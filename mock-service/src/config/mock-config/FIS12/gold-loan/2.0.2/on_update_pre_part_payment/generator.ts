import { randomUUID } from "crypto";

export async function onUpdatePrePartPaymentDefaultGenerator(existingPayload: any, sessionData: any) {
  // Standalone PRE_PART_PAYMENT on_update generator
  existingPayload.context = existingPayload.context || {};
  existingPayload.context.timestamp = new Date().toISOString();
  if (sessionData?.transaction_id) existingPayload.context.transaction_id = sessionData.transaction_id;
  if (sessionData?.message_id) existingPayload.context.message_id = sessionData.message_id;

  existingPayload.message = existingPayload.message || {};
  const order = existingPayload.message.order || (existingPayload.message.order = {});

  // If default.yaml doesn't have payments, try carrying forward from session
  if ((!Array.isArray(order.payments) || order.payments.length === 0) && sessionData?.order?.payments?.length) {
    order.payments = sessionData.order.payments;
  }

  // order.id
  if (sessionData?.order_id) order.id = sessionData.order_id;
  else if (!order.id || order.id === "LOAN_LEAD_ID_OR_SIMILAR_ORDER_ID" || String(order.id).startsWith("LOAN_LEAD_ID")) {
    order.id = `gold_loan_${randomUUID()}`;
  }

  // provider.id
  if (order.provider) {
    if (sessionData?.selected_provider?.id) order.provider.id = sessionData.selected_provider.id;
    else if (!order.provider.id || order.provider.id === "PROVIDER_ID" || String(order.provider.id).startsWith("PROVIDER_ID")) {
      order.provider.id = `gold_loan_${randomUUID()}`;
    }
  }

  // item.id
  const selectedItem = sessionData?.item || (Array.isArray(sessionData?.items) ? sessionData.items[0] : undefined);
  if (order.items?.[0]) {
    if (selectedItem?.id) order.items[0].id = selectedItem.id;
    else if (!order.items[0].id || String(order.items[0].id).startsWith("ITEM_ID_GOLD_LOAN")) {
      order.items[0].id = `gold_loan_${randomUUID()}`;
    }
  }

  // quote.id
  if (order.quote) {
    const quoteId = sessionData?.quote_id || sessionData?.order?.quote?.id || sessionData?.quote?.id;
    if (quoteId) order.quote.id = quoteId;
    else if (!order.quote.id || order.quote.id === "LOAN_LEAD_ID_OR_SIMILAR" || String(order.quote.id).startsWith("LOAN_LEAD_ID")) {
      order.quote.id = `gold_loan_${randomUUID()}`;
    }
  }

  // First payment tweaks
  order.payments = Array.isArray(order.payments) ? order.payments : [];
  const firstPayment = order.payments[0];
  if (firstPayment) {
    firstPayment.time = firstPayment.time || {};
    firstPayment.time.label = "PRE_PART_PAYMENT";
    if (firstPayment.time.range) delete firstPayment.time.range;

    // Prefer amount from flow/user input (config uses pre_part_payment)
    firstPayment.params = firstPayment.params || {};
    const userAmt = sessionData?.user_inputs?.pre_part_payment ?? sessionData?.user_inputs?.part_payment_amount;
    if (typeof userAmt === "number") firstPayment.params.amount = String(userAmt);
    else if (typeof userAmt === "string" && userAmt.trim()) firstPayment.params.amount = userAmt.trim();

    // Payment URL generation (FORM_SERVICE)
    const formService = process.env.FORM_SERVICE;
    const txId = existingPayload?.context?.transaction_id || sessionData?.transaction_id;
    if (formService && sessionData?.domain && sessionData?.session_id && sessionData?.flow_id && txId) {
      firstPayment.url = `${formService}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${txId}&direct=true`;
    }
  }

  return existingPayload;
}


