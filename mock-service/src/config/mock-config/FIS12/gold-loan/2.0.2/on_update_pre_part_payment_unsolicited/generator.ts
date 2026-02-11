import { randomUUID } from "crypto";

export async function onUpdatePrePartPaymentUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
  // Unsolicited PRE_PART_PAYMENT on_update generator (sent after main pre-part payment on_update)
  existingPayload.context = existingPayload.context || {};
  existingPayload.context.timestamp = new Date().toISOString();
  if (sessionData?.transaction_id) existingPayload.context.transaction_id = sessionData.transaction_id;
  if (sessionData?.message_id) existingPayload.context.message_id = sessionData.message_id;

  existingPayload.message = existingPayload.message || {};
  const order = existingPayload.message.order || (existingPayload.message.order = {});

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  if (existingPayload.context) {
    existingPayload.context.message_id = generateUUID();
  }

  // If default.yaml doesn't have payments, try carrying forward from session
  if ((!Array.isArray(order.payments) || order.payments.length === 0) && sessionData?.order?.payments?.length) {
    order.payments = sessionData.order.payments;
  }

  // CRITICAL: Merge installments, PRE_PART_PAYMENT, AND ON_ORDER payment from session data
  // IMPORTANT: Maintain the correct payment order from default.yaml
  // Expected order: PRE_PART_PAYMENT, ON_ORDER payment, then installments
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

    // Extract PRE_PART_PAYMENT from session (preserve unique ID from on_update_pre_part_payment)
    const prePartPaymentFromSession = sessionPayments.find(
      (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'PRE_PART_PAYMENT'
    );

    // Rebuild payments array in correct order
    const rebuiltPayments: any[] = [];

    // 1. Add PRE_PART_PAYMENT (from session, mark as PAID for unsolicited)
    if (prePartPaymentFromSession) {
      const { url, ...prePartWithoutUrl } = prePartPaymentFromSession;
      rebuiltPayments.push({
        ...prePartWithoutUrl,
        status: 'PAID'  // Pre-part payment is PAID in unsolicited (completed)
      });
      console.log('Preserved PRE_PART_PAYMENT from session with unique ID, updated status to PAID, and removed url');
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

    // 3. Add installments (from session, with updated statuses for pre-part payment deferral)
    if (installmentsFromSession.length > 0) {
      console.log(`Found ${installmentsFromSession.length} installments from session data for pre-part payment unsolicited`);

      // Update installment statuses to reflect pre-part payment deferral scenario
      // First 2: PAID (already paid before pre-part payment)
      // Next 2 (indices 2-3): DEFERRED (deferred due to pre-part payment)
      // Remaining: NOT-PAID (still unpaid)
      const updatedInstallments = installmentsFromSession.map((installment: any, index: number) => {
        let status = 'NOT-PAID'; // default

        if (index < 2) {
          status = 'PAID'; // First 2 installments are paid
        } else if (index >= 2 && index < 4) {
          status = 'DEFERRED'; // Next 2 installments are deferred due to pre-part payment
        }
        // Rest remain NOT-PAID

        return {
          ...installment,
          status
        };
      });

      rebuiltPayments.push(...updatedInstallments);
      console.log('Merged installments with DEFERRED status for pre-part payment scenario (2 PAID, 2 DEFERRED, rest NOT-PAID)');
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


