import { SessionData } from "../../../session-types";

export async function searchDefaultGenerator(
    existingPayload: any,
    sessionData: SessionData
) {
    // Remove BPP context fields (not needed in search)
    delete existingPayload.context.bpp_uri;
    delete existingPayload.context.bpp_id;

    // Set city code from user inputs if available
    if (sessionData.user_inputs?.city_code) {
        existingPayload.context.location.city.code = sessionData.user_inputs.city_code;
    }

    console.log("sessionData.message_id in search generator", sessionData.message_id);

    return existingPayload;
}
