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

  // CRITICAL: Merge installments AND ON_ORDER payment from session data
  // IMPORTANT: Maintain the correct payment order from default.yaml
  // Expected order: MISSED_EMI_PAYMENT, ON_ORDER payment, then installments
  if (sessionData?.order?.payments?.length > 0) {
    const sessionPayments = sessionData.order.payments;

    // Extract installments from session
    const installmentsFromSession = sessionPayments.filter(
      (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT'
    );

    // Extract ON_ORDER payment from session (preserve unique ID from on_confirm)
    const onOrderFromSession = sessionPayments.find(
      (p: any) => p.type === 'ON_ORDER'
    );

    // Find the MISSED_EMI_PAYMENT payment from default.yaml (first payment)
    const missedEmiPayment = order.payments.find(
      (p: any) => p.type === 'POST_FULFILLMENT' &&
        (p.time?.label === 'MISSED_EMI_PAYMENT' || !p.time?.label)
    );

    // Rebuild payments array in correct order
    const rebuiltPayments: any[] = [];

    // 1. Add MISSED_EMI_PAYMENT (from default.yaml, but customize it)
    if (missedEmiPayment) {
      missedEmiPayment.time = missedEmiPayment.time || {};
      missedEmiPayment.time.label = "MISSED_EMI_PAYMENT";

      // Generate unique ID for this NEW missed EMI payment
      // Format: missed_emi_<uuid> to identify it as a missed EMI payment
      if (!missedEmiPayment.id || missedEmiPayment.id === 'PAYMENT_ID_GOLD_LOAN') {
        missedEmiPayment.id = `missed_emi_${randomUUID()}`;
        console.log(`Generated unique missed EMI payment ID: ${missedEmiPayment.id}`);
      }

      // Amount override
      missedEmiPayment.params = missedEmiPayment.params || {};
      const userAmt = sessionData?.user_inputs?.missed_emi_amount;
      if (typeof userAmt === "number") missedEmiPayment.params.amount = String(userAmt);
      else if (typeof userAmt === "string" && userAmt.trim()) missedEmiPayment.params.amount = userAmt.trim();

      // ALWAYS generate current date range for missed EMI payment (don't use 2023 dates from default.yaml)
      // This represents the month when the EMI is being missed (current month)
      const ts = existingPayload?.context?.timestamp || new Date().toISOString();
      const d = new Date(ts);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      missedEmiPayment.time.range = { start: start.toISOString(), end: end.toISOString() };
      console.log(`Set MISSED_EMI_PAYMENT date range to current month: ${start.toISOString().substring(0, 7)}`);

      // Payment URL generation (FORM_SERVICE)
      const formService = process.env.FORM_SERVICE;
      const txId = existingPayload?.context?.transaction_id || sessionData?.transaction_id;
      if (formService && sessionData?.domain && sessionData?.session_id && sessionData?.flow_id && txId) {
        missedEmiPayment.url = `${formService}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${txId}&direct=true`;
      }

      rebuiltPayments.push(missedEmiPayment);
      console.log('Updated MISSED_EMI_PAYMENT payment with label, unique ID, date range, and amount');
    }

    // 2. Add ON_ORDER payment (from session, with updated status)
    if (onOrderFromSession) {
      const updatedOnOrder = {
        ...onOrderFromSession,
        status: 'PAID'  // ON_ORDER is always PAID by the time we reach update flows
      };
      rebuiltPayments.push(updatedOnOrder);
      console.log('Preserved ON_ORDER payment from session with unique ID and updated status to PAID');
    }

    // 3. Add installments (from session, with updated statuses for missed EMI)
    if (installmentsFromSession.length > 0) {
      console.log(`Found ${installmentsFromSession.length} installments from session data for missed EMI`);

      // Update installment statuses for missed EMI scenario
      // First 2: PAID, third: DELAYED (missed EMI), rest: NOT-PAID
      const updatedInstallments = installmentsFromSession.map((installment: any, index: number) => {
        let status = 'NOT-PAID';
        if (index < 2) {
          status = 'PAID'; // First 2 paid
        } else if (index === 2) {
          status = 'DELAYED'; // Third one is delayed (missed EMI)
        }
        return {
          ...installment,
          status
        };
      });

      rebuiltPayments.push(...updatedInstallments);
      console.log('Merged installments with updated statuses (2 PAID, 1 DELAYED, rest NOT-PAID)');
    }

    // Replace the entire payments array with the correctly ordered one
    order.payments = rebuiltPayments;
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

  return existingPayload;
}


