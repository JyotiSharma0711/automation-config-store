import { randomUUID } from "crypto";

export async function onUpdateForeclosureUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
    // Unsolicited FORECLOSURE on_update generator (sent after main foreclosure on_update)
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
    // The session should have installments from on_update_foreclosure with updated statuses
    if (sessionData?.order?.payments?.length > 0) {
        const sessionPayments = sessionData.order.payments;
        const installmentsFromSession = sessionPayments.filter(
            (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT'
        );

        if (installmentsFromSession.length > 0) {
            console.log(`Found ${installmentsFromSession.length} installments from session data for foreclosure unsolicited`);

            // Remove any existing installments from order.payments
            order.payments = order.payments.filter(
                (p: any) => !(p.type === 'POST_FULFILLMENT' && p.time?.label === 'INSTALLMENT')
            );

            // Update installment statuses to reflect foreclosure completion
            // First 2: PAID (already paid before foreclosure)
            // Remaining (indices 2+): ALL DEFERRED (loan is foreclosed, all remaining installments deferred)
            const updatedInstallments = installmentsFromSession.map((installment: any, index: number) => {
                let status = 'DEFERRED'; // default for foreclosure - all remaining get deferred

                if (index < 2) {
                    status = 'PAID'; // First 2 installments are paid
                }
                // All others are DEFERRED due to foreclosure

                return {
                    ...installment,
                    status
                };
            });

            // Add updated installments to payments array
            order.payments.push(...updatedInstallments);
            console.log('Merged installments for foreclosure unsolicited (2 PAID, all remaining DEFERRED)');
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

    // Update fulfillment state to COMPLETE for unsolicited callback
    if (order.fulfillments?.[0]?.state?.descriptor) {
        order.fulfillments[0].state.descriptor.code = "COMPLETE";
    }

    return existingPayload;
}


