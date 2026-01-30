import { randomUUID } from 'crypto';

export async function onStatusUnsolicitedGenerator(existingPayload: any, sessionData: any) {
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  console.log("sessionData for on_status_unsolicited", sessionData);

  const submission_id = sessionData?.form_data?.verification_status?.form_submission_id;

  
  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Generate NEW message_id for unsolicited response (must be unique, cannot reuse)
  if (existingPayload.context) {
    existingPayload.context.message_id = randomUUID();
    console.log("Generated new message_id for unsolicited on_status:", existingPayload.context.message_id);
  }
  
  // Update order ID from session data if available
  if (sessionData.order_id) {
    existingPayload.message = existingPayload.message || {};
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.id = sessionData.order_id;
  }

  // Update provider information from session data (carry-forward from on_select_2)
  if (sessionData.provider_id) {
    existingPayload.message = existingPayload.message || {};
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.provider = existingPayload.message.order.provider || {};
    existingPayload.message.order.provider.id = sessionData.provider_id;
  }
  
  // Update item.id from session data (carry-forward from on_select_2)
  const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
  if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].id = selectedItem.id;
    console.log("Updated item.id:", selectedItem.id);
  }
  
  // Update form ID from session data (carry-forward from selected item) or generate new one
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    const formId = sessionData.form_id || selectedItem?.xinput?.form?.id || `form_${randomUUID()}`;
    existingPayload.message.order.items[0].xinput.form.id = formId;
    console.log("Updated form ID:", formId);
  }


  // Update form response status - on_status_unsolicited uses APPROVED/OFFLINE_PENDING status
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {

    
    if (sessionData.submission_id) {
      existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
    }
  }

  // Update customer name in fulfillments if available from session data
  if (sessionData.customer_name && existingPayload.message?.order?.fulfillments?.[0]?.customer?.person) {
    existingPayload.message.order.fulfillments[0].customer.person.name = sessionData.customer_name;
    console.log("Updated customer name:", sessionData.customer_name);
  }

  // Note: Gold loans don't have payments in status responses
  // Payments are handled separately during loan servicing (EMIs, foreclosure, etc.)

  // Update quote.id from session data (carry-forward from previous flows)
  if (existingPayload.message?.order?.quote) {
    if (sessionData.quote_id) {
      existingPayload.message.order.quote.id = sessionData.quote_id;
      console.log("Updated quote.id from session:", sessionData.quote_id);
    } else if (sessionData.order?.quote?.id) {
      existingPayload.message.order.quote.id = sessionData.order.quote.id;
      console.log("Updated quote.id from order.quote.id:", sessionData.order.quote.id);
    } else if (sessionData.quote?.id) {
      existingPayload.message.order.quote.id = sessionData.quote.id;
      console.log("Updated quote.id from quote.id:", sessionData.quote.id);
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


  // if(existingPayload.message?.order?.items?.[0]?.xinput?.form_response && submission_id){
  //   existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
  //   if (!existingPayload.message.order.items[0].xinput.form_response.status) {
  //     existingPayload.message.order.items[0].xinput.form_response.status = "COMPLETED";
  //   }
  // }

  return existingPayload;
}
