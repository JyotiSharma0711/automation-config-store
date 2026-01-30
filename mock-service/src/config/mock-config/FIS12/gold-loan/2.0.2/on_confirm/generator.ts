/**
 * On Confirm Generator for FIS12 Gold Loan
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Generate order.id with gold_loan_ prefix (first time order ID is created)
 * 4. Generate or update provider.id, item.id, and quote.id with gold_loan_ prefix
 * 5. Update customer information in fulfillments from session data
 */

import { randomUUID } from 'crypto';

export async function onConfirmDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("sessionData for on_confirm", sessionData);
  console.log("payments in on_confirm", JSON.stringify(existingPayload.message?.order?.payments));
  console.log("session data in on_confirm", JSON.stringify(sessionData.payments));
  console.log("payments in on_confirm near return", JSON.stringify(sessionData.order?.payments));
  
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  
  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Use the same message_id as confirm (matching pair)
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
    console.log("Using matching message_id from confirm:", sessionData.message_id);
  }
  
  // Generate or update order.id with gold_loan_ prefix (first time order ID is created in the flow)
  if (existingPayload.message?.order) {
    if (sessionData.order_id) {
      existingPayload.message.order.id = sessionData.order_id;
      console.log("Updated order.id from session:", sessionData.order_id);
    } else if (!existingPayload.message.order.id || 
               existingPayload.message.order.id === "LOAN_LEAD_ID_OR_SIMILAR_ORDER_ID" ||
               existingPayload.message.order.id.startsWith("LOAN_LEAD_ID")) {
      existingPayload.message.order.id = `gold_loan_${randomUUID()}`;
      console.log("Generated order.id:", existingPayload.message.order.id);
    }
  }

  if (existingPayload.message?.order) {
    const savedPayments =
      // Primary: order.payments saved from on_init/on_confirm save-data
      sessionData.order?.payments ||
      // Secondary: explicit payments key saved from on_init/save-data
      sessionData.payments;

    if (Array.isArray(savedPayments) && savedPayments.length > 0) {
      existingPayload.message.order.payments = savedPayments;
      console.log("Carried forward payments from session (installment ranges preserved)");
    } else {
      console.warn("No saved payments found in session; using payload defaults");
    }
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
    const sessionQuoteId =
      sessionData?.quote_id ||
      sessionData?.quote?.id ||
      sessionData?.order?.quote?.id;

    if (sessionQuoteId) {
      existingPayload.message.order.quote.id = sessionQuoteId;
      console.log("Updated quote.id from session:", sessionQuoteId);
    } else if (
      !existingPayload.message.order.quote.id ||
               existingPayload.message.order.quote.id === "LOAN_LEAD_ID_OR_SIMILAR" ||
      existingPayload.message.order.quote.id.startsWith("LOAN_LEAD_ID")
    ) {
      existingPayload.message.order.quote.id = `gold_loan_${randomUUID()}`;
      console.log("Generated quote.id:", existingPayload.message.order.quote.id);
    }
  }
  
  // Update location_ids from session data (carry-forward from previous flows)
  const selectedLocationId = sessionData.selected_location_id;
  if (selectedLocationId && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].location_ids = [selectedLocationId];
    console.log("Updated location_ids:", selectedLocationId);
  }
  
  // Update customer name in fulfillments if available from session data
  if (sessionData.customer_name && existingPayload.message?.order?.fulfillments?.[0]?.customer?.person) {
    existingPayload.message.order.fulfillments[0].customer.person.name = sessionData.customer_name;
    console.log("Updated customer name:", sessionData.customer_name);
  }
  
  // Update customer contact information if available from session data
  if (sessionData.customer_phone && existingPayload.message?.order?.fulfillments?.[0]?.customer?.contact) {
    existingPayload.message.order.fulfillments[0].customer.contact.phone = sessionData.customer_phone;
    console.log("Updated customer phone:", sessionData.customer_phone);
  }
  
  if (sessionData.customer_email && existingPayload.message?.order?.fulfillments?.[0]?.customer?.contact) {
    existingPayload.message.order.fulfillments[0].customer.contact.email = sessionData.customer_email;
    console.log("Updated customer email:", sessionData.customer_email);
  }
  
  // Update fulfillment state to DISBURSED (loan has been confirmed and disbursed)
  if (existingPayload.message?.order?.fulfillments?.[0]?.state?.descriptor) {
    existingPayload.message.order.fulfillments[0].state.descriptor.code = "DISBURSED";
    existingPayload.message.order.fulfillments[0].state.descriptor.name = "Loan Disbursed";
    console.log("Updated fulfillment state to DISBURSED");
  }
  return existingPayload;
}
