import { randomUUID } from "crypto";

export async function onUpdatePrePartPaymentUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
  // Standalone PRE_PART_PAYMENT on_update generator
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

  // CRITICAL: Merge installments from session data properly
  // The session should have installments from on_update_pre_part_payment with updated statuses
  if (sessionData?.order?.payments?.length > 0) {
    const sessionPayments = sessionData.order.payments;
    const installmentsFromSession = sessionPayments.filter(
      (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT'
    );

    if (installmentsFromSession.length > 0) {
      console.log(`Found ${installmentsFromSession.length} installments from session data for unsolicited update`);

      // Remove any existing installments from order.payments
      order.payments = order.payments.filter(
        (p: any) => !(p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT')
      );

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

      // Add updated installments to payments array
      order.payments.push(...updatedInstallments);
      console.log('Merged installments with DEFERRED status for pre-part payment scenario (2 PAID, 2 DEFERRED, rest NOT-PAID)');
    }
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


