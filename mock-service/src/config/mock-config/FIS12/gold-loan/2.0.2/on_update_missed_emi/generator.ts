import { randomUUID } from "crypto";

export async function onUpdateMissedEmiDefaultGenerator(existingPayload: any, sessionData: any) {
  // Standalone MISSED_EMI_PAYMENT on_update generator
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

  // Payments: make sure first payment is MISSED_EMI_PAYMENT with range
  order.payments = Array.isArray(order.payments) ? order.payments : [];

  // CRITICAL: Merge installments from session data BEFORE missed EMI logic processes them
  // The session should have installments from on_confirm with time ranges
  if (sessionData?.order?.payments?.length > 0) {
    const sessionPayments = sessionData.order.payments;
    const installmentsFromSession = sessionPayments.filter(
      (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT'
    );

    if (installmentsFromSession.length > 0) {
      console.log(`Found ${installmentsFromSession.length} installments from session data for missed EMI`);

      // Remove any existing installments from order.payments (from default.yaml)
      const nonInstallmentPayments = order.payments.filter(
        (p: any) => !(p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT')
      );

      // Start with non-installment payments and add installments from session
      order.payments = [...nonInstallmentPayments, ...installmentsFromSession];
      console.log('Merged installments from session data for missed EMI processing');
    }
  }

  const firstPayment = order.payments[0];
  if (firstPayment) {
    firstPayment.time = firstPayment.time || {};
    firstPayment.time.label = "MISSED_EMI_PAYMENT";

    // Amount override
    firstPayment.params = firstPayment.params || {};
    const userAmt = sessionData?.user_inputs?.missed_emi_amount;
    if (typeof userAmt === "number") firstPayment.params.amount = String(userAmt);
    else if (typeof userAmt === "string" && userAmt.trim()) firstPayment.params.amount = userAmt.trim();

    // Ensure time.range exists (prefer default range; else compute from timestamp)
    if (!firstPayment.time.range?.start || !firstPayment.time.range?.end) {
      const ts = existingPayload?.context?.timestamp || new Date().toISOString();
      const d = new Date(ts);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      firstPayment.time.range = { start: start.toISOString(), end: end.toISOString() };
    }

    // Update installment statuses for missed EMI scenario
    // We have installments from session, mark: first 2 PAID, third DELAYED, rest NOT-PAID
    const installments = order.payments.filter((p: any) =>
      p?.type === "POST_FULFILLMENT" &&
      p?.time?.label === "INSTALLMENT"
    );

    installments.forEach((installment: any, index: number) => {
      if (index < 2) {
        installment.status = "PAID"; // First 2 paid
      } else if (index === 2) {
        installment.status = "DELAYED"; // Third one is delayed (missed EMI)
      } else {
        installment.status = "NOT-PAID"; // Rest are not paid
      }
    });

    // Payment URL generation (FORM_SERVICE)
    const formService = process.env.FORM_SERVICE;
    const txId = existingPayload?.context?.transaction_id || sessionData?.transaction_id;
    if (formService && sessionData?.domain && sessionData?.session_id && sessionData?.flow_id && txId) {
      firstPayment.url = `${formService}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${txId}&direct=true`;
    }
  }

  return existingPayload;
}


