/**
 * On Select Generator for FIS12 Gold Loan - Adjust Loan Amount
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Generate or update provider.id, item.id, and quote.id with gold_loan_ prefix
 * 4. Update xinput form URL for loan_amount_adjustment_form
 */

import { randomUUID } from 'crypto';

export async function onSelectAdjustLoanAmountDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("On Select generator - Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    quote: !!sessionData.quote,
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
  
  // Update xinput form ID and URL for loan_amount_adjustment_form
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    // Always generate a NEW form ID for the next form (loan_amount_adjustment_form)
    // and let downstream steps (select_2) carry-forward using sessionData.form_id.
    const formId = `form_${randomUUID()}`;
    existingPayload.message.order.items[0].xinput.form.id = formId;
    console.log("Updated form ID:", formId);
    
    const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/loan_amount_adjustment_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
    console.log("✅ URL for loan_amount_adjustment_form in on_select_adjust_loan_amount:", url);
    existingPayload.message.order.items[0].xinput.form.url = url;
    console.log("✅ Form URL successfully set in payload");
  } else {
    console.error("❌ FAILED: Payload structure doesn't match expected path for form URL!");
    console.log("Actual payload structure:", JSON.stringify(existingPayload.message?.order, null, 2));
  }

  
  return existingPayload;
} 