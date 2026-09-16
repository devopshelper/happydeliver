import { O as FILENAME, S as escape_html, b as attr, c as derived, g as push_element, h as pop_element, u as head } from "../../../../chunks/internal.js";
import { t as resolve } from "../../../../chunks/paths.js";
import { t as page } from "../../../../chunks/state.js";
import "../../../../chunks/components.js";
import "../../../../chunks/api.js";
//#region src/routes/bimi/[domain]/+page.svelte
_page[FILENAME] = "src/routes/bimi/[domain]/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let domain = derived(() => page.params.domain ?? "");
		derived(() => page.url.searchParams.get("selector") || "default");
		derived(() => page.url.searchParams.get("local_part") || "");
		const record = derived(() => void 0);
		const dmarcBlocked = derived(() => record()?.checks?.some((c) => c.name === "dmarc_enforcement" && c.status === "fail") ?? false);
		const selfAsserted = derived(() => !record()?.vmc_url && (record()?.checks?.some((c) => c.name === "vmc" && c.status === "warning") ?? false));
		const declination = derived(() => !!record()?.record_valid && !record()?.logo_url && !record()?.vmc_url);
		const advisories = derived(() => record()?.checks?.filter((c) => c.status === "warning").length ?? 0);
		derived(() => {
			if (!record()) return void 0;
			if (!record().record) return {
				level: "danger",
				icon: "bi-x-octagon-fill",
				title: "No BIMI record published",
				text: `Nothing is published at ${record().selector}._bimi.${record().domain}, so no mail client will show an indicator for this domain.`
			};
			if (!record().record_valid) return {
				level: "danger",
				icon: "bi-x-octagon-fill",
				title: "The Assertion Record is not valid",
				text: "The TXT record was found but it is not a well-formed BIMI record, so receivers cannot act on it."
			};
			if (dmarcBlocked()) return {
				level: "danger",
				icon: "bi-exclamation-octagon-fill",
				title: "This indicator will not be displayed",
				text: "A message only becomes eligible for BIMI once the sending domain's DMARC policy is at enforcement. Until then, nothing is shown however compliant the record and the logo are."
			};
			if (!record().valid) return {
				level: "danger",
				icon: "bi-exclamation-octagon-fill",
				title: "The record is valid, its assets are not",
				text: "The DNS record is well-formed, but the logo or the certificate it points at failed validation. An indicator receivers cannot validate is one they do not display, so nothing will be shown until this is fixed. Expand the detailed checks below to see what failed."
			};
			if (declination()) return {
				level: "secondary",
				icon: "bi-slash-circle-fill",
				title: "This domain declines to publish an indicator",
				text: "The record is well-formed and publishes neither a logo nor a certificate, which is how a domain deliberately opts out of BIMI. No indicator will be shown, and none is meant to be."
			};
			if (selfAsserted()) return {
				level: "warning",
				icon: "bi-patch-exclamation-fill",
				title: "Valid, but the indicator is self-asserted",
				text: "The record and the logo passed, and the a= tag they leave out is optional. But with no Verified Mark Certificate vouching for the logo, only the mail clients that accept a self-asserted indicator will display it: Gmail and Apple Mail, between them most of the inboxes, will not."
			};
			return {
				level: "success",
				icon: "bi-check-circle-fill",
				title: "This BIMI configuration is compliant",
				text: "The record, the logo and the certificate all passed. Mail clients that support BIMI can display this indicator for messages that pass DMARC." + (advisories() === 1 ? " One check raised an advisory point. Expand the detailed checks below." : advisories() > 1 ? ` ${advisories()} checks raised advisory points. Expand the detailed checks below.` : "")
			};
		});
		head("17z5pab", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(domain())} - BIMI Checker - happyDeliver</title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 164, 0);
		$$renderer.push(`<div class="row">`);
		push_element($$renderer, "div", 165, 4);
		$$renderer.push(`<div class="col-lg-10 mx-auto">`);
		push_element($$renderer, "div", 166, 8);
		$$renderer.push(`<div class="mb-4">`);
		push_element($$renderer, "div", 168, 12);
		$$renderer.push(`<div class="d-flex align-items-center justify-content-between">`);
		push_element($$renderer, "div", 169, 16);
		$$renderer.push(`<h1 class="h2 mb-0">`);
		push_element($$renderer, "h1", 170, 20);
		$$renderer.push(`<i class="bi bi-building-check me-2">`);
		push_element($$renderer, "i", 171, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` BIMI Check</h1>`);
		pop_element();
		$$renderer.push(` <a${attr("href", resolve("/bimi"))} class="btn btn-outline-secondary">`);
		push_element($$renderer, "a", 174, 20);
		$$renderer.push(`<i class="bi bi-arrow-left me-2">`);
		push_element($$renderer, "i", 175, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Check Another Domain</a>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		$$renderer.push(`<!--[0--><div class="card shadow-sm">`);
		push_element($$renderer, "div", 183, 16);
		$$renderer.push(`<div class="card-body text-center py-5">`);
		push_element($$renderer, "div", 184, 20);
		$$renderer.push(`<div class="spinner-border text-primary mb-3" role="status">`);
		push_element($$renderer, "div", 185, 24);
		$$renderer.push(`<span class="visually-hidden">`);
		push_element($$renderer, "span", 186, 28);
		$$renderer.push(`Loading...</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h3 class="h5">`);
		push_element($$renderer, "h3", 188, 24);
		$$renderer.push(`Checking ${escape_html(domain())}...</h3>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-0">`);
		push_element($$renderer, "p", 189, 24);
		$$renderer.push(`Reading the record, then fetching the logo and the certificate it points
                            at. This can take a few seconds.</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
