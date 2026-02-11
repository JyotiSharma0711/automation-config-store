import { randomUUID } from "crypto";

export async function onUpdateForeclosureDefaultGenerator(existingPayload: any, sessionData: any) {
  // Standalone FORECLOSURE on_update generator
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
  // Expected order: FORECLOSURE payment, ON_ORDER payment, then installments
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

    // Find the FORECLOSURE payment from default.yaml (first payment)
    const foreclosurePayment = order.payments.find(
      (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'FORECLOSURE'
    );

    // Rebuild payments array in correct order
    const rebuiltPayments: any[] = [];

    // 1. Add FORECLOSURE payment (from default.yaml)
    if (foreclosurePayment) {
      rebuiltPayments.push(foreclosurePayment);
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

    // 3. Add installments (from session, with updated statuses)
    if (installmentsFromSession.length > 0) {
      console.log(`Found ${installmentsFromSession.length} installments from session data for foreclosure`);


      const updatedInstallments = installmentsFromSession.map((installment: any, index: number) => {
        return {
          ...installment,
          status: index < 2 ? 'PAID' : 'NOT-PAID'
        };
      });

      rebuiltPayments.push(...updatedInstallments);
      console.log('Merged installments for foreclosure with updated statuses (2 PAID, rest NOT-PAID)');
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

  // First payment tweaks
  order.payments = Array.isArray(order.payments) ? order.payments : [];
  const firstPayment = order.payments[0];
  if (firstPayment) {
    firstPayment.time = firstPayment.time || {};
    firstPayment.time.label = "FORECLOSURE";
    if (firstPayment.time.range) delete firstPayment.time.range;

    // Generate unique ID for this NEW foreclosure payment
    // Format: foreclosure_<uuid> to identify it as a foreclosure payment
    if (!firstPayment.id || firstPayment.id === 'PAYMENT_ID_GOLD_LOAN') {
      firstPayment.id = `foreclosure_${randomUUID()}`;
      console.log(`Generated unique foreclosure payment ID: ${firstPayment.id}`);
    }

    // Prefer foreclosure amount override from user input
    firstPayment.params = firstPayment.params || {};
    const userAmt = sessionData?.user_inputs?.foreclosure_amount;
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


