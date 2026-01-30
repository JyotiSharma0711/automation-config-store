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

    // Installments safety: mark previous PAID and ensure target month exists as DELAYED (dedupe if needed)
    const targetRange = firstPayment.time.range as { start: string; end: string };
    const targetStartDate = new Date(targetRange.start);

    const isInstallment = (p: any) =>
      p?.type === "POST_FULFILLMENT" &&
      p?.time?.label === "INSTALLMENT" &&
      p?.time?.range?.start &&
      p?.time?.range?.end;

    order.payments.forEach((p: any) => {
      if (!isInstallment(p)) return;
      const sd = new Date(p.time.range.start);
      if (sd < targetStartDate && p.status !== "DELAYED") p.status = "PAID";
    });

    const matchingIdx: number[] = [];
    order.payments.forEach((p: any, idx: number) => {
      if (!isInstallment(p)) return;
      if (p.time.range.start === targetRange.start && p.time.range.end === targetRange.end) matchingIdx.push(idx);
    });

    if (matchingIdx.length === 0) {
      order.payments.push({
        id: "INSTALLMENT_ID_GOLD_LOAN",
        type: "POST_FULFILLMENT",
        params: { amount: "46360", currency: "INR" },
        status: "DELAYED",
        time: { label: "INSTALLMENT", range: { start: targetRange.start, end: targetRange.end } },
      });
    } else {
      const keep = matchingIdx[0];
      order.payments[keep].status = "DELAYED";
      for (let i = matchingIdx.length - 1; i >= 1; i--) {
        order.payments.splice(matchingIdx[i], 1);
      }
    }

    // Payment URL generation (FORM_SERVICE)
    const formService = process.env.FORM_SERVICE;
    const txId = existingPayload?.context?.transaction_id || sessionData?.transaction_id;
    if (formService && sessionData?.domain && sessionData?.session_id && sessionData?.flow_id && txId) {
      firstPayment.url = `${formService}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${txId}&direct=true`;
    }
  }

  return existingPayload;
}


