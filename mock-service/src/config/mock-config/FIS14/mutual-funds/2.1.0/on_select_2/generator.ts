import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function on_select_2DefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== on_select_2 Generator Start ===");

    // Update timestamp and IDs
    if (existingPayload.context) {
        existingPayload.context.timestamp = new Date().toISOString();
    }

    // Update provider and item from session
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

    // Generate quote ID
    if (existingPayload.message?.order?.quote) {
        if (!existingPayload.message.order.quote.id || existingPayload.message.order.quote.id.startsWith("QUOTE")) {
            existingPayload.message.order.quote.id = `quote_${randomUUID()}`;
            console.log("Generated quote.id:", existingPayload.message.order.quote.id);
        }
    }

    // Update submission_id from investor_details_form
    const submission_id = sessionData?.form_data?.investor_details_form?.form_submission_id;
    if (submission_id && existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
        existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
    }

    console.log("=== on_select_2 Generator End ===");
    return existingPayload;
}
