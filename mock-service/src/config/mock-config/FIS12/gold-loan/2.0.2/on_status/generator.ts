import { randomUUID } from 'crypto';

export async function onStatusGenerator(existingPayload: any, sessionData: any) {
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  console.log("sessionData for on_status", sessionData);

  const submission_id = sessionData?.form_data?.verification_status?.form_submission_id;
  
  const form_status = sessionData?.form_data?.verification_status?.idType;
  
  // Update transaction_id and message_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }
  
  // Update order ID from session data if available
  if (sessionData.order_id) {
    existingPayload.message = existingPayload.message || {};
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.id = sessionData.order_id;
  }
  
  // Update provider information from session data (carry-forward from previous flows)
  if (existingPayload.message?.order?.provider) {
    if (sessionData.selected_provider?.id) {
      existingPayload.message.order.provider.id = sessionData.selected_provider.id;
      console.log("Updated provider.id from session:", sessionData.selected_provider.id);
    } else if (sessionData.provider_id) {
      existingPayload.message.order.provider.id = sessionData.provider_id;
      console.log("Updated provider.id from provider_id:", sessionData.provider_id);
    }
  }

  // Fix items: ensure ID consistency and form status
  if (existingPayload.message?.order?.items?.[0]) {
    const item = existingPayload.message.order.items[0];
    
    // Update item.id from session data (carry-forward from previous flows)
    const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
    if (selectedItem?.id) {
      item.id = selectedItem.id;
      console.log("Updated item.id:", selectedItem.id);
    } else if (sessionData.item_id) {
      item.id = sessionData.item_id;
      console.log("Updated item.id from item_id:", sessionData.item_id);
    }
    
    // Update location_ids from session data (carry-forward from previous flows)
    const selectedLocationId = sessionData.selected_location_id;
    if (selectedLocationId) {
      item.location_ids = [selectedLocationId];
      console.log("Updated location_ids:", selectedLocationId);
    }
    
    // Update form ID from session data (carry-forward from previous flows) or generate new one
    if (item.xinput?.form) {
      // Use form ID from session data, from selected item, or generate new one
      const formId = sessionData.form_id || selectedItem?.xinput?.form?.id || `form_${randomUUID()}`;
      item.xinput.form.id = formId;
      console.log("Updated form ID:", formId);
    }
    console.log("form_status", form_status);
    console.log("submission_id", submission_id);
    if (item.xinput?.form_response) {
      item.xinput.form_response.status = form_status;
      if (submission_id) {

        item.xinput.form_response.submission_id = submission_id;
      }
    }
  }
  console.log("form data in on_status", sessionData?.form_data?.verification_status);
  
  // Update customer name in fulfillments if available from session data
  if (sessionData.customer_name && existingPayload.message?.order?.fulfillments?.[0]?.customer?.person) {
    existingPayload.message.order.fulfillments[0].customer.person.name = sessionData.customer_name;
    console.log("Updated customer name:", sessionData.customer_name);
  }
  
  // Fix fulfillments: remove customer details and state (if not updating customer name)
  if (existingPayload.message?.order?.fulfillments && !sessionData.customer_name) {
    existingPayload.message.order.fulfillments.forEach((fulfillment: any) => {
      delete fulfillment.customer;
      delete fulfillment.state;
    });
  }

  // Remove documents section completely
  if (existingPayload.message?.order?.documents) {
    delete existingPayload.message.order.documents;
  }


  if (existingPayload.message?.order?.quote) {
    if (sessionData.quote_id) {
      existingPayload.message.order.quote.id = sessionData.quote_id;
      console.log("Updated quote.id from session:", sessionData.quote_id);
    }
  }

  // Update quote information if provided
  if (sessionData.quote_amount && existingPayload.message?.order?.quote) {
    existingPayload.message.order.quote.price.value = sessionData.quote_amount;
  }

  // Update loan amount in items if provided
  if (sessionData.loan_amount && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].price.value = sessionData.loan_amount;
  }

  return existingPayload;
}
