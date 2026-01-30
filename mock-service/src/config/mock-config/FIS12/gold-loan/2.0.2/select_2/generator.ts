/**
 * Select2 Generator for FIS12 Gold Loan
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Update provider.id and item.id from session data (carry-forward mapping)
 * 4. Update form_response with status and submission_id (preserve existing structure)
 */

import { randomUUID } from 'crypto';

export async function select2Generator(existingPayload: any, sessionData: any) {
  console.log("Select2 generator - Available session data:", {
    selected_provider: !!sessionData.selected_provider,
    selected_items: !!sessionData.selected_items,
    items: !!sessionData.items,
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id
  });

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  console.log("existing payloa-->",JSON.stringify(existingPayload))
  
  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Generate a new message_id as UUID
  if (existingPayload.context) {
    existingPayload.context.message_id = randomUUID();
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
  
  // Carry-forward form.id from on_select_adjust_loan_amount (loan_amount_adjustment_form)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    const formIdFromSession =
      sessionData?.form_id ||
      selectedItem?.xinput?.form?.id ||
      existingPayload.message.order.items[0].xinput.form.id;
    if (formIdFromSession) {
      existingPayload.message.order.items[0].xinput.form.id = formIdFromSession;
      console.log("Set form.id from session (carry-forward):", formIdFromSession);
    }
  }
  
  // Update form_response with status and submission_id (preserve existing structure)
  // Use the submission_id from the form submitted before select_2
  // (loan_amount_adjustment_form is returned by on_select_adjust_loan_amount)
  const submission_id =
    sessionData?.form_data?.loan_amount_adjustment_form?.form_submission_id ||
    sessionData?.form_data?.loan_amount_adjustment?.form_submission_id ||
    sessionData?.submission_id;

  console.log("checking form data for loan_amount_adjustment_form submission_id:", submission_id);

  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    if (submission_id) {
      // Use the actual UUID submission_id from form service
      existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
      existingPayload.message.order.items[0].xinput.form_response.status = "SUCCESS";
      console.log("Updated form_response with submission_id from form service:", submission_id);
    } else {
      console.warn("⚠️ No submission_id found for consumer_information_form - form may not have been submitted yet");
      // Only generate fallback if absolutely necessary
      existingPayload.message.order.items[0].xinput.form_response.submission_id = `F01_SUBMISSION_ID_${Date.now()}`;
      existingPayload.message.order.items[0].xinput.form_response.status = "SUCCESS";
    }
    console.log("Updated form_response with status and submission_id");
  }
  
  return existingPayload;
}

