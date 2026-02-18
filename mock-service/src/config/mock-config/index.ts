import { readFileSync } from "fs";
import logger from "@ondc/automation-logger";
import path from "path";
import yaml from "js-yaml";
import { SessionData as MockSessionData } from "./FIS14/session-types";
// import { createMockResponse as createFIS12MockResponse } from "./FIS12/version-factory";
import { createMockResponse as createFIS14MockResponse } from "./FIS14/version-factory";
import { getMockAction as getFIS14MockAction } from "./FIS14/action-factory";

export { MockSessionData };

// Default to FIS10 for testing
const defaultDomain = process.env.DOMAIN || "ONDC:FIS14";

export const actionConfig = yaml.load(
	readFileSync(path.join(__dirname, "./FIS14/factory.yaml"), "utf8")
) as any;

export const defaultSessionData = (domain: string = defaultDomain) => {
	let sessionDataPath: string;

	switch (domain) {
		case "ONDC:FIS12":
			sessionDataPath = path.join(__dirname, `./FIS12/session-data.yaml`);
			break;
		case "ONDC:FIS14":
			sessionDataPath = path.join(__dirname, `./FIS14/session-data.yaml`);
			break;
		default:
			sessionDataPath = path.join(__dirname, `./${domain}/session-data.yaml`);
			break;
	}

	return yaml.load(readFileSync(sessionDataPath, "utf8")) as { session_data: MockSessionData };
};

export async function generateMockResponse(
	session_id: string,
	sessionData: any,
	action_id: string,
	input?: any,
	domain: string = defaultDomain
) {
	try {
		console.log("generateMockResponse - action_id:", action_id);
		console.log("generateMockResponse - domain:", domain);
		console.log("generateMockResponse - defaultDomain:", defaultDomain);
		console.log("generateMockResponse - sessionData", sessionData);

		let response;
		if (domain === "ONDC:FIS14") {
			response = await createFIS14MockResponse(
				session_id,
				sessionData,
				action_id,
				input
			);
		} 
		response.context.timestamp = new Date().toISOString();
		return response;
	} catch (e) {
		logger.error("Error in generating mock response", e);
		throw e;
	}
}

export function getMockActionObject(actionId: string, domain: string = defaultDomain) {
	if (domain === "ONDC:FIS14") {
		return getFIS14MockAction(actionId);
	}
	return getFIS14MockAction(actionId);
}

export function getActionData(code: number, domain: string = defaultDomain) {
	if (!actionConfig) {
		throw new Error(`Domain ${domain} not supported`);
	}

	const actionData = actionConfig.codes.find(
		(action: any) => action.code === code
	);
	if (actionData) {
		return actionData;
	}
	throw new Error(`Action code ${code} not found for domain ${domain}`);
}

export function getSaveDataContent(version: string, action: string, domain: string = defaultDomain) {
	let actionFolderPath: string;

	switch (domain) {
		case "ONDC:FIS14":
			actionFolderPath = path.resolve(
				__dirname,
				`./${domain}/${version}/${action}`
			);
			break;
		default:
			actionFolderPath = path.resolve(
				__dirname,
				`./${domain}/${version}/${action}`
			);
			break;
	}

	const saveDataFilePath = path.join(actionFolderPath, "save-data.yaml");
	const fileContent = readFileSync(saveDataFilePath, "utf8");
	const cont = yaml.load(fileContent) as any;
	console.log(cont);
	return cont;
}

export function getUiMetaKeys(): (keyof MockSessionData)[] {
	return ["investor_details_form", "payment_mandate_form"];
}