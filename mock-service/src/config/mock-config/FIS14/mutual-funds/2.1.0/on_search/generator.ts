import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function on_searchDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== on_search Generator Start ===");

    // Update message_id from session data
    if (sessionData.message_id && existingPayload.context) {
        existingPayload.context.message_id = sessionData.message_id;
    }

    // Generate dynamic IDs with mutual_funds_ prefix for provider and items
    if (existingPayload.message?.catalog?.providers?.[0]) {
        const provider = existingPayload.message.catalog.providers[0];

        // Generate provider ID if it's a placeholder
        if (!provider.id || provider.id === "PROVIDER_ID" || provider.id.startsWith("PROVIDER")) {
            provider.id = `mutual_funds_${randomUUID()}`;
            console.log("Generated provider.id:", provider.id);
        }

        // Generate item IDs if they are placeholders
        if (provider.items && Array.isArray(provider.items)) {
            provider.items = provider.items.map((item: any) => {
                if (!item.id || item.id.startsWith("ITEM_ID")) {
                    item.id = `mutual_funds_scheme_${randomUUID()}`;
                    console.log("Generated item.id:", item.id);
                }

                // Update fulfillment IDs
                if (item.fulfillment_ids && Array.isArray(item.fulfillment_ids)) {
                    item.fulfillment_ids = item.fulfillment_ids.map((fid: string) => {
                        if (fid.startsWith("FULFILLMENT")) {
                            return `fulfillment_${randomUUID()}`;
                        }
                        return fid;
                    });
                }

                // Update category IDs with actual values
                if (item.category_ids && Array.isArray(item.category_ids)) {
                    // Keep the actual category IDs from payload (e.g., "101123" for mutual funds)
                    console.log("Category IDs:", item.category_ids);
                }

                return item;
            });
        }

        // Update fulfillments
        if (provider.fulfillments && Array.isArray(provider.fulfillments)) {
            provider.fulfillments = provider.fulfillments.map((fulfillment: any) => {
                if (!fulfillment.id || fulfillment.id.startsWith("FULFILLMENT")) {
                    fulfillment.id = `fulfillment_${randomUUID()}`;
                }
                return fulfillment;
            });
        }
    }

    console.log("=== on_search Generator End ===");
    return existingPayload;
}
