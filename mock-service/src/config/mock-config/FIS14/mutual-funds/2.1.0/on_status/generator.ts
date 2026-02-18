import { randomUUID } from 'crypto';
import { SessionData } from "../../../session-types";

export async function on_statusDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    console.log("=== on_status Generator Start ===");

    // Update message_id from session data
    if (sessionData.message_id && existingPayload.context) {
        existingPayload.context.message_id = sessionData.message_id;
    }

    // Determine current KYC stage from session data
    const kycStage = sessionData.kyc_stage || 0;

    // Update checklist based on KYC stage
    if (existingPayload.message?.order?.items?.[0]?.tags) {
        const tags = existingPayload.message.order.items[0].tags;
        const checklistTag = tags.find((tag: any) => tag.descriptor?.code === 'CHECKLISTS');

        if (checklistTag && checklistTag.list) {
            // Update checklist values based on stage
            checklistTag.list.forEach((item: any) => {
                const code = item.descriptor?.code;

                if (code === 'APPLICATION_FORM_WITH_KYC') {
                    // Always completed if we've reached on_status
                    item.value = sessionData.form_submission_id || randomUUID();
                } else if (code === 'KYC') {
                    // Completed if stage >= 1
                    item.value = kycStage >= 1 ? (sessionData.kyc_submission_id || randomUUID()) : "PENDING";
                } else if (code === 'ESIGN') {
                    // Completed if stage >= 2
                    item.value = kycStage >= 2 ? (sessionData.esign_submission_id || randomUUID()) : "PENDING";
                }
            });
        }
    }

    console.log("=== on_status Generator End ===");
    return existingPayload;
}
