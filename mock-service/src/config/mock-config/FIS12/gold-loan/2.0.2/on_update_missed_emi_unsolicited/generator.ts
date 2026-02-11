import { randomUUID } from "crypto";

export async function onUpdateMissedEmiUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
    // Unsolicited MISSED EMI on_update generator (sent after main missed EMI on_update)
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

    // CRITICAL: Merge installments, MISSED_EMI_PAYMENT, AND ON_ORDER payment from session data
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

        // Extract MISSED_EMI_PAYMENT from session (preserve unique ID from on_update_missed_emi)
        const missedEmiFromSession = sessionPayments.find(
            (p: any) => p.type === 'POST_FULFILLMENT' && p.time?.label === 'MISSED_EMI_PAYMENT'
        );

        // Rebuild payments array in correct order
        const rebuiltPayments: any[] = [];

        // 1. Add MISSED_EMI_PAYMENT (from session, mark as PAID for unsolicited)
        if (missedEmiFromSession) {
            const { url, ...missedEmiWithoutUrl } = missedEmiFromSession;
            rebuiltPayments.push({
                ...missedEmiWithoutUrl,
                status: 'PAID'  // Missed EMI payment is PAID in unsolicited (completed)
            });
            console.log('Preserved MISSED_EMI_PAYMENT from session with unique ID, updated status to PAID, and removed url');
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

        // 3. Add installments (from session, with DELAYED changed to DEFERRED)
        if (installmentsFromSession.length > 0) {
            console.log(`Found ${installmentsFromSession.length} installments from session data for missed EMI unsolicited`);

            // Update installment statuses: Find the DELAYED one and change it to DEFERRED
            // Keep all other statuses as-is
            const updatedInstallments = installmentsFromSession.map((installment: any) => {
                // If this installment was marked as DELAYED, change it to DEFERRED
                if (installment.status === 'DELAYED') {
                    return {
                        ...installment,
                        status: 'DEFERRED'
                    };
                }
                // Otherwise keep the status as-is (PAID, NOT-PAID, etc.)
                return installment;
            });

            rebuiltPayments.push(...updatedInstallments);
            console.log('Merged installments for missed EMI unsolicited (DELAYED -> DEFERRED)');
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

    // Update fulfillment state to DISBURSED for unsolicited callback
    if (order.fulfillments?.[0]?.state?.descriptor) {
        order.fulfillments[0].state.descriptor.code = "DISBURSED";
    }

    return existingPayload;
}


