/*  */import { randomUUID } from 'crypto';

export async function onSearchDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("existingPayload on search", existingPayload);
  
  // Set payment_collected_by if present in session data
  if (sessionData.collected_by && existingPayload.message?.catalog?.providers?.[0]?.payments?.[0]) {
    existingPayload.message.catalog.providers[0].payments[0].collected_by = sessionData.collected_by;
  }

  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }
  console.log("sessionData.message_id", sessionData);

  // Generate dynamic IDs with gold_loan_ prefix for provider, items, and quotes
  if (existingPayload.message?.catalog?.providers?.[0]) {
    const provider = existingPayload.message.catalog.providers[0];
    
    // Generate ONE form id for consumer_information_form and apply to all items.
    // This ensures the form id returned by on_search is the same one used in select_1 and on_select_1,
    // regardless of which item gets selected.
    const consumerInformationFormId =
      (typeof sessionData?.form_id === "string" && sessionData.form_id.trim()
        ? sessionData.form_id
        : `form_${randomUUID()}`);
    
    // Generate provider ID if it's a placeholder
    if (!provider.id || provider.id === "PROVIDER_ID" || provider.id.startsWith("PROVIDER_ID")) {
      provider.id = `gold_loan_${randomUUID()}`;
      console.log("Generated provider.id:", provider.id);
    }
    
    // Generate item IDs if they are placeholders
    // Different prefixes based on category: AA_LOAN (101125) vs BUREAU_LOAN (101124)
    if (provider.items && Array.isArray(provider.items)) {
      provider.items = provider.items.map((item: any) => {
        if (!item.id || item.id === "ITEM_ID_GOLD_LOAN_1" || item.id === "ITEM_ID_GOLD_LOAN_2" || item.id.startsWith("ITEM_ID_GOLD_LOAN")) {
          // Determine prefix based on category_ids
          const categoryIds = item.category_ids || [];
          let prefix = "gold_loan_"; // default prefix
          
          // Check if item has AA_LOAN category (101125)
          if (categoryIds.includes("101125")) {
            prefix = "aa_gold_loan_";
            console.log("Item has AA_LOAN category - using aa_gold_loan_ prefix");
          } 
          // Check if item has BUREAU_LOAN category (101124)
          else if (categoryIds.includes("101124")) {
            prefix = "bureau_gold_loan_";
            console.log("Item has BUREAU_LOAN category - using bureau_gold_loan_ prefix");
          }
          
          item.id = `${prefix}${randomUUID()}`;
          console.log("Generated item.id:", item.id);
        }
        
        // Update form ID and generate dynamic form URL for items with session data
        if (item.xinput?.form) {
          item.xinput.form.id = consumerInformationFormId;
          console.log("Using consumer_information_form form.id:", item.xinput.form.id);
          
          // Generate dynamic form URL with session data
          const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/consumer_information_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
          console.log("Form URL generated:", url);
          item.xinput.form.url = url;
        }
        
        return item;
      });
    }
  }

  console.log("session data of on_search", sessionData);
  return existingPayload;
} 