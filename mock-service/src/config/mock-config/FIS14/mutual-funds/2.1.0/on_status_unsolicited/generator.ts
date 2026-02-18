import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function on_status_unsolicitedDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== on_status_unsolicited Generator Start ===");

    // Update timestamp
    if (existingPayload.context) {
        existingPayload.context.timestamp = new Date().toISOString();
    }

    // Update IDs from session
    if (sessionData.transaction_id && existingPayload.context) {
        existingPayload.context.transaction_id = sessionData.transaction_id;
    }

    // Generate new message_id for unsolicited callback
    if (existingPayload.context) {
        existingPayload.context.message_id = randomUUID();
    }

    // Update order ID
    if (sessionData.order_id && existingPayload.message?.order) {
        existingPayload.message.order.id = sessionData.order_id;
    }

    // Update payment status
    if (existingPayload.message?.order?.payments?.[0]) {
        existingPayload.message.order.payments[0].status = "PAID";
        existingPayload.message.order.payments[0].time = {
            timestamp: new Date().toISOString()
        };
        console.log("Updated payment status to PAID");
    }

    // Update order status
    if (existingPayload.message?.order) {
        existingPayload.message.order.status = "PAYMENT_COMPLETED";
    }

    console.log("=== on_status_unsolicited Generator End ===");
    return existingPayload;
}
