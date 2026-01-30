import axios from 'axios';
import { randomUUID } from 'crypto';
import logger from '@ondc/automation-logger';

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
      logger.info(
        "Finvu consent handler generated",
        {
          flow_id: sessionData?.flow_id,
          session_id: sessionData?.session_id,
          domain: sessionData?.domain,
          transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
        },
        { consent_handler: consentHandler }
      );
      
      // Store consent handler in session data for later use (verify step)
      sessionData.consent_handler = consentHandler;
      logger.info(
        "Stored consent_handler in session data",
        {
          flow_id: sessionData?.flow_id,
          session_id: sessionData?.session_id,
          domain: sessionData?.domain,
          transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
        },
        { consent_handler: sessionData?.consent_handler }
      );
      
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
          logger.info(
            "Existing CONSENT_HANDLER value (before update)",
            {
              flow_id: sessionData?.flow_id,
              session_id: sessionData?.session_id,
              domain: sessionData?.domain,
              transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
            },
            {
              consent_handler:
                consentInfoTag.list?.find((l: any) => l.descriptor?.code === "CONSENT_HANDLER")?.value ||
                "not found",
            }
          );
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
          logger.info(
            "✅ Updated existing CONSENT_HANDLER in payload",
            {
              flow_id: sessionData?.flow_id,
              session_id: sessionData?.session_id,
              domain: sessionData?.domain,
              transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
            },
            { index: existingHandlerIndex, consent_handler: consentHandler }
          );
        } else {
          // Add new CONSENT_HANDLER
          consentInfoTag.list.push(consentHandlerItem);
          logger.info(
            "✅ Added new CONSENT_HANDLER to payload",
            {
              flow_id: sessionData?.flow_id,
              session_id: sessionData?.session_id,
              domain: sessionData?.domain,
              transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
            },
            { consent_handler: consentHandler }
          );
        }
        
        // Final verification - check the actual payload structure
        const finalValue = existingPayload.message.order.items[0].tags
          ?.find((t: any) => t.descriptor?.code === 'CONSENT_INFO')
          ?.list?.find((l: any) => l.descriptor?.code === 'CONSENT_HANDLER')
          ?.value;
        
        if (finalValue === consentHandler) {
          logger.info(
            "✅ Verification passed - consent handler successfully updated in payload",
            {
              flow_id: sessionData?.flow_id,
              session_id: sessionData?.session_id,
              domain: sessionData?.domain,
              transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
            },
            { consent_handler: consentHandler }
          );
        } else {
          logger.error(
            "❌ Verification failed - consent handler not properly updated in payload",
            {
              flow_id: sessionData?.flow_id,
              session_id: sessionData?.session_id,
              domain: sessionData?.domain,
              transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
            },
            { expected: consentHandler, got: finalValue }
          );
        }
      } else {
        logger.info(
          "⚠️ Cannot inject consent handler - items[0] not found in payload",
          {
            flow_id: sessionData?.flow_id,
            session_id: sessionData?.session_id,
            domain: sessionData?.domain,
            transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
          },
          {}
        );
      }
      
    } catch (error: any) {
      logger.error(
        "❌ Finvu AA consent generation failed",
        {
          flow_id: sessionData?.flow_id,
          session_id: sessionData?.session_id,
          domain: sessionData?.domain,
          transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
        },
        {
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          code: error?.code,
        }
      );
      
      // Fail-safe: Continue without consent handler (or you can throw error to stop flow)
      logger.info(
        "⚠️ Continuing without consent handler due to error",
        {
          flow_id: sessionData?.flow_id,
          session_id: sessionData?.session_id,
          domain: sessionData?.domain,
          transaction_id: existingPayload?.context?.transaction_id || sessionData?.transaction_id,
        },
        {}
      );
    }
  } else if (!isAAItem) {
    console.log("✅ Skipping Finvu AA integration - Item is Bureau loan type, AA consent not required");
  }
  
  console.log("--- Finvu AA Integration End ---");

  console.log("existingPayload on_select_1", existingPayload);

  // ========== FORM URL UPDATE ==========
  
  // Update form URL for kyc_verification_status (next step form)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    // Carry forward the form.id from on_search/select_1 so UI/protocol has a consistent id
    const formIdFromSession =
      sessionData?.form_id ||
      sessionData?.item?.xinput?.form?.id ||
      (Array.isArray(sessionData?.items) ? sessionData.items?.[0]?.xinput?.form?.id : undefined);
    if (formIdFromSession) {
      existingPayload.message.order.items[0].xinput.form.id = formIdFromSession;
      console.log("Updated form.id from session:", formIdFromSession);
    }

    const formUrl = `${process.env.FORM_SERVICE || 'http://localhost:3001'}/forms/${sessionData.domain}/kyc_verification_status?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
    
    existingPayload.message.order.items[0].xinput.form.url = formUrl;
    console.log("Updated form URL for kyc_verification_status:", formUrl);
  }
  
  // ========== SUBMISSION ID MAPPING ==========
  

  const submission_id = sessionData?.form_data?.consumer_information_form?.form_submission_id;
  
  console.log("Submission ID for on_select_1 (from consumer_information_form):", submission_id);
  
  // Update form_response with submission_id (preserve existing structure)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    if (submission_id) {
      // Use the actual submission_id from form service (UUID generated by form service)
      existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
      console.log("Updated form_response with submission_id from form service:", submission_id);
    } else {
      console.warn("⚠️ No submission_id found in session data - form may not have been submitted yet");
    }
    console.log("Updated form_response with submission_id");
  }
  
  
  console.log("existingPayload on_select_1", existingPayload);
  console.log("=== On Select1 Generator End ===");
  return existingPayload;
}

