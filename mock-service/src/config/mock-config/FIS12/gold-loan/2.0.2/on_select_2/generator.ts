/**
 * On Select2 Generator for FIS12 Gold Loan
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Update provider.id and item.id from session data (carry-forward mapping)
 * 4. Generate quote.id with gold_loan_ prefix if placeholder
 * 5. Update form URL for verification_status (preserve existing structure)
 */

import { randomUUID } from 'crypto';

export async function onSelect2Generator(existingPayload: any, sessionData: any) {
  console.log("On Select2 generator - Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    selected_provider: !!sessionData.selected_provider,
    items: !!sessionData.items
  });

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  
  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
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
  
  // Generate or update item.id with gold_loan_ prefix
  const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
  if (existingPayload.message?.order?.items?.[0]) {
    if (selectedItem?.id) {
      existingPayload.message.order.items[0].id = selectedItem.id;
      console.log("Updated item.id from session:", selectedItem.id);
    } else if (!existingPayload.message.order.items[0].id || 
               existingPayload.message.order.items[0].id === "ITEM_ID_GOLD_LOAN_1" ||
               existingPayload.message.order.items[0].id === "ITEM_ID_GOLD_LOAN_2" ||
               existingPayload.message.order.items[0].id.startsWith("ITEM_ID_GOLD_LOAN")) {
      existingPayload.message.order.items[0].id = `gold_loan_${randomUUID()}`;
      console.log("Generated item.id:", existingPayload.message.order.items[0].id);
    }
  }
  
  // Update location_ids if available from session data
  const selectedLocationId = sessionData.selected_location_id;
  if (selectedLocationId && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].location_ids = [selectedLocationId];
    console.log("Updated location_ids:", selectedLocationId);
  }
  
  // Generate or update quote.id with gold_loan_ prefix
  if (existingPayload.message?.order?.quote) {
    if (sessionData.quote_id) {
      existingPayload.message.order.quote.id = sessionData.quote_id;
      console.log("Updated quote.id from session:", sessionData.quote_id);
    } else if (!existingPayload.message.order.quote.id || 
               existingPayload.message.order.quote.id === "LOAN_LEAD_ID_OR_SIMILAR" ||
               existingPayload.message.order.quote.id.startsWith("LOAN_LEAD_ID")) {
      existingPayload.message.order.quote.id = `gold_loan_${randomUUID()}`;
      console.log("Generated quote.id:", existingPayload.message.order.quote.id);
    }
  }
  
  // Update xinput index to cur: 1, max: 1 (second form in the flow)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.head?.index) {
    existingPayload.message.order.items[0].xinput.head.index.cur = 1;
    existingPayload.message.order.items[0].xinput.head.index.max = 1;
    console.log("Updated xinput index to cur: 1, max: 1");
  }
  
  // Update form ID and URL for verification_status (preserve existing structure)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    // Always generate a NEW form ID for the next form (verification_status)
    // and let downstream steps (on_status/init) carry-forward using sessionData.form_id.
    const formId = `form_${randomUUID()}`;
    existingPayload.message.order.items[0].xinput.form.id = formId;
    console.log("Updated form ID:", formId);
    
    const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/verification_status?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
    console.log("URL for verification_status in on_select_2", url);
    existingPayload.message.order.items[0].xinput.form.url = url;
  }

  console.log("session data on_select_2-->",sessionData)
  
  return existingPayload;
}

