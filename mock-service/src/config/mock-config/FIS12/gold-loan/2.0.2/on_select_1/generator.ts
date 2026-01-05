import axios from 'axios';
import { randomUUID } from 'crypto';

export async function onSelect1Generator(existingPayload: any, sessionData: any) {
  console.log("=== On Select1 Generator Start ===");
  console.log("Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    selected_provider: !!sessionData.selected_provider,
    items: !!sessionData.items,
    bap_id: sessionData.bap_id
  });

  // ========== STANDARD PAYLOAD UPDATES ==========
  
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  
  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
    console.log("Updated transaction_id:", sessionData.transaction_id);
  }
  
  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
    console.log("Updated message_id:", sessionData.message_id);
  }
  
  // Generate or update provider.id with gold_loan_ prefix
  if (existingPayload.message?.order?.provider) {
    if (sessionData.selected_provider?.id) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
      console.log("Updated provider.id from session:", sessionData.selected_provider.id);
    } else if (!existingPayload.message.order.provider.id || 
               existingPayload.message.order.provider.id === "PROVIDER_ID" ||
               existingPayload.message.order.provider.id.startsWith("PROVIDER_ID")) {
      existingPayload.message.order.provider.id = `gold_loan_${randomUUID()}`;
      console.log("Generated provider.id:", existingPayload.message.order.provider.id);
    }
  }
  
  // Generate or update item.id - preserve prefix from session (aa_gold_loan_ or bureau_gold_loan_)
  const selectedItem = sessionData.item || 
                       (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
  if (existingPayload.message?.order?.items?.[0]) {
    if (selectedItem?.id) {
      existingPayload.message.order.items[0].id = selectedItem.id;
      console.log("Updated item.id from session:", selectedItem.id);
    } else if (!existingPayload.message.order.items[0].id || 
               existingPayload.message.order.items[0].id === "ITEM_ID_GOLD_LOAN_1" ||
               existingPayload.message.order.items[0].id === "ITEM_ID_GOLD_LOAN_2" ||
               existingPayload.message.order.items[0].id.startsWith("ITEM_ID_GOLD_LOAN")) {
      // Default to gold_loan_ prefix if no session data available
      existingPayload.message.order.items[0].id = `gold_loan_${randomUUID()}`;
      console.log("Generated item.id:", existingPayload.message.order.items[0].id);
    }
  }
  
  // Determine item type based on ID prefix for conditional logic
  const currentItemId = existingPayload.message?.order?.items?.[0]?.id || "";
  const isAAItem = currentItemId.startsWith("aa_gold_loan_");
  const isBureauItem = currentItemId.startsWith("bureau_gold_loan_");
  console.log("Item type detection - isAAItem:", isAAItem, "isBureauItem:", isBureauItem, "itemId:", currentItemId);
  
  // Update location_ids if available from session data
  const selectedLocationId = sessionData.selected_location_id;
  if (selectedLocationId && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].location_ids = [selectedLocationId];
    console.log("Updated location_ids:", selectedLocationId);
  }

  // ========== FINVU AA CONSENT INTEGRATION ==========
  // Only call Finvu AA service for AA items (items with aa_gold_loan_ prefix)
  
  console.log("--- Finvu AA Integration Start ---");
  
  // Check if this is an AA item before proceeding with consent generation
  if (!isAAItem) {
    console.log("⚠️ Skipping Finvu AA integration - Item is not an AA loan (Bureau loan or other type)");
    console.log("Item ID:", currentItemId, "does not start with 'aa_gold_loan_'");
  }
  
  // Extract customer ID from session data
  const contactNumber = sessionData.form_data?.consumer_information_form?.contactNumber;
  
  // Only proceed with AA consent if it's an AA item
  if (contactNumber && isAAItem) {
    const custId = `${contactNumber}@finvu`;
    console.log("Customer ID for consent:", custId);
    
    try {
      // Call Finvu AA Service to generate consent handler
      const finvuServiceUrl = process.env.FINVU_AA_SERVICE_URL || 'http://localhost:3002';
      const consentUrl = `${finvuServiceUrl}/finvu-aa/consent/generate`;
      
      console.log("Calling Finvu AA Service:", consentUrl);
      
      const consentRequest = {
        custId: custId,
        templateName: "FINVUDEMO_TESTING",
        consentDescription: "Gold Loan Account Aggregator Consent",
        redirectUrl: "https://google.co.in"
      };
      
      console.log("Consent request payload:", consentRequest);
      
      const response = await axios.post(consentUrl, consentRequest, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      const consentHandler = response.data.consentHandler;
      console.log("✅ Consent handler generated:", consentHandler);
      
      // Store consent handler in session data for later use (verify step)
      sessionData.consent_handler = consentHandler;
      console.log("sessionData.consent_handler", sessionData.consent_handler);
      console.log("Stored consent_handler in session data");
      console.log("consent handler in response", consentHandler);
      
      // Inject consent handler into payload tags
      if (existingPayload.message?.order?.items?.[0]) {
        const item = existingPayload.message.order.items[0];
        
        // Initialize tags array if it doesn't exist
        if (!item.tags) {
          item.tags = [];
          console.log("Initialized tags array");
        }
        
        // Find existing CONSENT_INFO tag or create new one
        let consentInfoTagIndex = item.tags.findIndex((tag: any) => 
          tag.descriptor?.code === 'CONSENT_INFO'
        );
        
        let consentInfoTag;
        if (consentInfoTagIndex >= 0) {
          consentInfoTag = item.tags[consentInfoTagIndex];
          console.log("Found existing CONSENT_INFO tag at index:", consentInfoTagIndex);
          console.log("Existing CONSENT_HANDLER value:", 
            consentInfoTag.list?.find((l: any) => l.descriptor?.code === 'CONSENT_HANDLER')?.value || 'not found');
        } else {
          // Create new CONSENT_INFO tag structure
          consentInfoTag = {
            descriptor: {
              code: 'CONSENT_INFO',
              name: 'Consent Information'
            },
            list: [],
            display: false
          };
          item.tags.push(consentInfoTag);
          consentInfoTagIndex = item.tags.length - 1;
          console.log("Created new CONSENT_INFO tag at index:", consentInfoTagIndex);
        }
        
        // Ensure list exists
        if (!consentInfoTag.list) {
          consentInfoTag.list = [];
          console.log("Initialized CONSENT_INFO list");
        }
        
        // Find and update existing CONSENT_HANDLER or add new one
        const existingHandlerIndex = consentInfoTag.list.findIndex((listItem: any) => 
          listItem.descriptor?.code === 'CONSENT_HANDLER'
        );
        
        const consentHandlerItem = {
          descriptor: {
            code: 'CONSENT_HANDLER',
            name: 'Consent Handler'
          },
          value: consentHandler
        };
        
        if (existingHandlerIndex >= 0) {
          // Update existing CONSENT_HANDLER value directly
          consentInfoTag.list[existingHandlerIndex].value = consentHandler;
          console.log(`✅ Updated existing CONSENT_HANDLER at index ${existingHandlerIndex} with new value: ${consentHandler}`);
          console.log("Verification - CONSENT_HANDLER value in payload:", 
            item.tags[consentInfoTagIndex].list[existingHandlerIndex].value);
        } else {
          // Add new CONSENT_HANDLER
          consentInfoTag.list.push(consentHandlerItem);
          console.log(`✅ Added new CONSENT_HANDLER to list with value: ${consentHandler}`);
          console.log("Verification - CONSENT_HANDLER value in payload:", 
            item.tags[consentInfoTagIndex].list[consentInfoTag.list.length - 1].value);
        }
        
        // Final verification - check the actual payload structure
        const finalValue = existingPayload.message.order.items[0].tags
          ?.find((t: any) => t.descriptor?.code === 'CONSENT_INFO')
          ?.list?.find((l: any) => l.descriptor?.code === 'CONSENT_HANDLER')
          ?.value;
        
        if (finalValue === consentHandler) {
          console.log("✅ Verification passed - consent handler successfully updated in payload");
        } else {
          console.error("❌ Verification failed - consent handler not properly updated. Expected:", consentHandler, "Got:", finalValue);
        }
      } else {
        console.warn("⚠️ Cannot inject consent handler - items[0] not found in payload");
        console.log("Payload structure:", JSON.stringify(existingPayload.message?.order, null, 2));
      }
      
    } catch (error: any) {
      console.error("❌ Finvu AA consent generation failed:", error.message);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      
      // Fail-safe: Continue without consent handler (or you can throw error to stop flow)
      console.warn("⚠️ Continuing without consent handler due to error");
    }
  } else if (!isAAItem) {
    console.log("✅ Skipping Finvu AA integration - Item is Bureau loan type, AA consent not required");
  }
  
  console.log("--- Finvu AA Integration End ---");

  console.log("existingPayload on_select_1", existingPayload);

  // ========== FORM URL UPDATE ==========
  
  // Update form URL for kyc_verification_status (next step form)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    const formUrl = `${process.env.FORM_SERVICE || 'http://localhost:3001'}/forms/${sessionData.domain}/kyc_verification_status?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
    
    existingPayload.message.order.items[0].xinput.form.url = formUrl;
    console.log("Updated form URL for kyc_verification_status:", formUrl);
  }
  
  console.log("existingPayload on_select_1", existingPayload);
  console.log("=== On Select1 Generator End ===");
  return existingPayload;
}

