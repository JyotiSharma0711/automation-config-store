import * as cheerio from "cheerio";
import logger from "@ondc/automation-logger";

export function resolveFormActions(baseUrl: string, html: string): string {
	logger.info("Resolving form actions", { baseUrl, html });

	let base: URL;
	try {
		base = new URL(baseUrl);
		if (!/^https?:$/i.test(base.protocol)) {
			throw new Error("Base URL must be http(s)");
		}
	} catch {
		throw new Error(`Invalid baseUrl: ${baseUrl}`);
	}

	const $ = cheerio.load(html);

	const isAbsoluteHttp = (u: string) => /^https?:\/\//i.test(u);
	const isProtocolRelative = (u: string) => /^\/\//.test(u);
	const isBad = (u: string) =>
		/^\s*javascript\s*:/i.test(u) || u.trim() === "" || u.trim() === "#";


	$("form").each((_, element) => {
		const $form = $(element);
		const raw = ($form.attr("action") || "").trim();

		if (isAbsoluteHttp(raw) || isProtocolRelative(raw)) return;


		let resolved: string;
		if (isBad(raw)) {

			const cleanBase = new URL(base.toString());
			cleanBase.hash = "";
			resolved = cleanBase.toString();
		} else {
			resolved = new URL(raw, base).toString();
		}
		$form.attr("action", resolved);
	});

	logger.info("Resolved form actions", { html: $.html() });


	return $.html();
}