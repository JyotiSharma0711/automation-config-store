import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function initDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== init Generator Start ===");

    // Update context
    if (existingPayload.context) {
        existingPayload.context.timestamp = new Date().toISOString();
        existingPayload.context.action = "init";
    }

    // Update transaction_id from session
    if (sessionData.transaction_id && existingPayload.context) {
        existingPayload.context.transaction_id = sessionData.transaction_id;
    }

    // Generate new message_id for init
    if (existingPayload.context) {
        existingPayload.context.message_id = randomUUID();
    }

    // Update provider and item IDs
    const selectedProvider = sessionData.selected_provider || sessionData.provider_id;
    if (selectedProvider && existingPayload.message?.order?.provider) {
        if (typeof selectedProvider === 'string') {
            existingPayload.message.order.provider.id = selectedProvider;
        } else if (selectedProvider.id) {
            existingPayload.message.order.provider.id = selectedProvider.id;
        }
    }

    const selectedItem = sessionData.selected_item_id || sessionData.item;
    if (selectedItem && existingPayload.message?.order?.items?.[0]) {
        if (typeof selectedItem === 'string') {
            existingPayload.message.order.items[0].id = selectedItem;
        } else if (selectedItem.id) {
            existingPayload.message.order.items[0].id = selectedItem.id;
        }
    }

    // Update quote ID from session
    if (sessionData.quote_id && existingPayload.message?.order?.quote) {
        existingPayload.message.order.quote.id = sessionData.quote_id;
    }

    console.log("=== init Generator End ===");
    return existingPayload;
}
