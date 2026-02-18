import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function on_update_unsolicitedDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== on_update_unsolicited Generator Start ===");

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

    // Update folio number from session
    if (sessionData.folio_number && existingPayload.message?.order?.items?.[0]?.tags) {
        const folioTag = existingPayload.message.order.items[0].tags.find(
            (tag: any) => tag.descriptor?.code === 'FOLIO_INFO'
        );
        if (folioTag && folioTag.list) {
            const folioItem = folioTag.list.find(
                (item: any) => item.descriptor?.code === 'FOLIO_NUMBER'
            );
            if (folioItem) {
                folioItem.value = sessionData.folio_number;
            }
        }
    }

    // Update SIP status to ACTIVE
    if (existingPayload.message?.order) {
        existingPayload.message.order.status = "ACTIVE";
        console.log("Updated order status to ACTIVE (SIP activated)");
    }

    // Update fulfillment status
    if (existingPayload.message?.order?.fulfillments?.[0]) {
        existingPayload.message.order.fulfillments[0].state = {
            descriptor: {
                code: "ACTIVE",
                name: "SIP Active"
            }
        };
    }

    console.log("=== on_update_unsolicited Generator End ===");
    return existingPayload;
}
