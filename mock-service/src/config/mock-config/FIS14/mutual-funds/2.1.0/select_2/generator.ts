import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function select_2DefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== select_2 Generator Start ===");

    // Update timestamp
    if (existingPayload.context) {
        existingPayload.context.timestamp = new Date().toISOString();
    }

    // Map provider and item IDs from session
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

    // Update form response with submission ID from investor_details_form
    const submission_id = sessionData?.form_data?.investor_details_form?.form_submission_id;

    if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
        if (submission_id) {
            existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
            console.log("Updated form_response with submission_id:", submission_id);
        } else {
            console.warn("⚠️ No submission_id found for investor_details_form");
        }
    }

    // Ensure form ID matches from on_select
    const formId = sessionData.form_id;
    if (formId && existingPayload.message?.order?.items?.[0]?.xinput?.form) {
        existingPayload.message.order.items[0].xinput.form.id = formId;
    }

    console.log("=== select_2 Generator End ===");
    return existingPayload;
}
