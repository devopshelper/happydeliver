import { O as FILENAME, S as escape_html, b as attr, c as derived, d as spread_props, f as store_get, g as push_element, h as pop_element, l as ensure_array_like, m as unsubscribe_stores, o as attr_class, u as head } from "../../chunks/internal.js";
import { t as resolve } from "../../chunks/paths.js";
import { t as appConfig } from "../../chunks/config.js";
import "../../chunks/navigation.js";
import { a as FeatureCard, i as HowItWorksStep, r as HistoryTable } from "../../chunks/components.js";
import "../../chunks/api.js";
//#region src/routes/+page.svelte
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let loading = false;
		let recentTests = [];
		let dragging = false;
		function getMaxMessageSizeText() {
			const bytes = store_get($$store_subs ??= {}, "$appConfig", appConfig).max_message_size;
			if (!bytes) return "";
			return `${Math.round(bytes / 1048576)} MB`;
		}
		function getRetentionTimeText() {
			if (!store_get($$store_subs ??= {}, "$appConfig", appConfig).report_retention) return "ever";
			const seconds = store_get($$store_subs ??= {}, "$appConfig", appConfig).report_retention / 1e9;
			const days = Math.floor(seconds / 86400);
			const weeks = Math.floor(days / 7);
			const months = Math.floor(days / 30);
			if (months >= 1) return months === 1 ? "1 month" : `${months} months`;
			else if (weeks >= 1) return weeks === 1 ? "1 week" : `${weeks} weeks`;
			else if (days >= 1) return days === 1 ? "1 day" : `${days} days`;
			else {
				const hours = Math.floor(seconds / 3600);
				return hours === 1 ? "1 hour" : `${hours} hours`;
			}
		}
		const features = derived(() => [
			{
				icon: "bi-shield-check",
				title: "Authentication",
				description: "SPF, DKIM, DMARC, and BIMI validation with detailed results and recommendations.",
				variant: "primary"
			},
			{
				icon: "bi-building-check",
				title: "BIMI Support",
				description: "Brand Indicators for Message Identification - verify your brand logo configuration.",
				variant: "info",
				href: resolve("/bimi"),
				linkLabel: "Check a BIMI record"
			},
			{
				icon: "bi-link-45deg",
				title: "ARC Verification",
				description: "Authenticated Received Chain validation for forwarded emails and mailing lists.",
				variant: "primary"
			},
			{
				icon: "bi-check2-circle",
				title: "Domain Alignment",
				description: "Verify alignment between From, Return-Path, and DKIM domains for DMARC compliance.",
				variant: "success"
			},
			{
				icon: "bi-globe",
				title: "DNS Records",
				description: "Verify PTR, MX, SPF, DKIM, DMARC, and BIMI records are properly configured.",
				variant: "success"
			},
			{
				icon: "bi-bug",
				title: "Spam Score",
				description: "SpamAssassin analysis with detailed test results and scoring.",
				variant: "warning"
			},
			{
				icon: "bi-list-check",
				title: "Blacklists",
				description: "Check if your IP is listed in major DNS-based blacklists (RBLs).",
				variant: "danger"
			},
			{
				icon: "bi-card-heading",
				title: "Header Quality",
				description: "Validate required headers, check for missing fields and alignment.",
				variant: "secondary"
			},
			{
				icon: "bi-file-text",
				title: "Content Analysis",
				description: "HTML structure, link validation, image analysis, and more.",
				variant: "info"
			},
			{
				icon: "bi-bar-chart",
				title: "Detailed Scoring",
				description: "A to F deliverability grade with breakdown by category and recommendations.",
				variant: "primary"
			},
			{
				icon: "bi-file-earmark-arrow-up",
				title: "EML Upload",
				description: "Analyze a message you already received elsewhere: authentication results are read from the server that handled it.",
				variant: "info"
			},
			{
				icon: "bi-lock",
				title: "Privacy First",
				description: `Self-hosted solution, your data never leaves your infrastructure. Reports retained for ${getRetentionTimeText()}.`,
				variant: "success"
			}
		]);
		const steps = [
			{
				step: 1,
				title: "Create Test",
				description: "Click the button to generate a unique test email address."
			},
			{
				step: 2,
				title: "Send Email",
				description: "Send a test email from your mail server to the provided address, or upload an .eml file you already received."
			},
			{
				step: 3,
				title: "View Results",
				description: "Get instant detailed analysis with actionable recommendations."
			}
		];
		head("1uha8ag", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>happyDeliver. Test Your Email Deliverability.</title>`);
			});
		});
		$$renderer.push(`<section${attr_class("hero py-5 svelte-1uha8ag", void 0, { "dragging": dragging })} id="hero">`);
		push_element($$renderer, "section", 221, 0);
		$$renderer.push(`<div class="container py-5 svelte-1uha8ag">`);
		push_element($$renderer, "div", 236, 4);
		$$renderer.push(`<div class="row align-items-center svelte-1uha8ag">`);
		push_element($$renderer, "div", 237, 8);
		$$renderer.push(`<div class="col-lg-8 mx-auto text-center fade-in svelte-1uha8ag">`);
		push_element($$renderer, "div", 238, 12);
		$$renderer.push(`<h1 class="display-3 fw-bold mb-4 svelte-1uha8ag">`);
		push_element($$renderer, "h1", 239, 16);
		$$renderer.push(`Test Your Email Deliverability</h1>`);
		pop_element();
		$$renderer.push(` <p class="lead mb-4 opacity-90 svelte-1uha8ag" style="text-wrap: balance;">`);
		push_element($$renderer, "p", 240, 16);
		$$renderer.push(`Get detailed insights into your email configuration, authentication, spam score,
                    and more. Open-source, self-hosted, and privacy-focused.</p>`);
		pop_element();
		$$renderer.push(` <button class="btn btn-success btn-lg px-5 py-3 shadow cta-button svelte-1uha8ag"${attr("disabled", loading, true)}>`);
		push_element($$renderer, "button", 244, 16);
		$$renderer.push(`<!--[-1--><i class="bi bi-envelope-plus me-2 svelte-1uha8ag">`);
		push_element($$renderer, "i", 253, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Start Free Test`);
		$$renderer.push(`<!--]--></button>`);
		pop_element();
		$$renderer.push(` `);
		if (store_get($$store_subs ??= {}, "$appConfig", appConfig).eml_upload_enabled) {
			$$renderer.push(`<!--[0--><div class="mt-4 svelte-1uha8ag">`);
			push_element($$renderer, "div", 259, 20);
			$$renderer.push(`<p class="mb-2 opacity-90 svelte-1uha8ag" style="text-wrap: balance;">`);
			push_element($$renderer, "p", 260, 24);
			$$renderer.push(`Already received the message elsewhere?</p>`);
			pop_element();
			$$renderer.push(` <input type="file" accept=".eml,message/rfc822,text/plain" class="d-none svelte-1uha8ag"/>`);
			push_element($$renderer, "input", 263, 24);
			pop_element();
			$$renderer.push(` <button class="btn btn-outline-light btn-lg px-4 svelte-1uha8ag"${attr("disabled", loading, true)}>`);
			push_element($$renderer, "button", 270, 24);
			$$renderer.push(`<i class="bi bi-file-earmark-arrow-up me-2 svelte-1uha8ag">`);
			push_element($$renderer, "i", 275, 28);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Analyze an .eml file</button>`);
			pop_element();
			$$renderer.push(` <p class="small mt-2 mb-0 opacity-90 svelte-1uha8ag" style="text-wrap: balance;">`);
			push_element($$renderer, "p", 278, 24);
			$$renderer.push(`Drop the raw file here`);
			if (getMaxMessageSizeText()) $$renderer.push(`<!--[0--> (${escape_html(getMaxMessageSizeText())}
                                max)`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->. Authentication results are then read from the server that
                            actually received it.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</section>`);
		pop_element();
		$$renderer.push(` `);
		if (store_get($$store_subs ??= {}, "$appConfig", appConfig).test_list_enabled && recentTests.length > 0) {
			$$renderer.push(`<!--[0--><section class="py-5 border-bottom border-3 svelte-1uha8ag" id="recent">`);
			push_element($$renderer, "section", 299, 4);
			$$renderer.push(`<div class="container py-4 svelte-1uha8ag">`);
			push_element($$renderer, "div", 300, 8);
			$$renderer.push(`<div class="row text-center mb-5 svelte-1uha8ag">`);
			push_element($$renderer, "div", 301, 12);
			$$renderer.push(`<div class="col-lg-8 mx-auto svelte-1uha8ag">`);
			push_element($$renderer, "div", 302, 16);
			$$renderer.push(`<h2 class="display-5 fw-bold mb-3 svelte-1uha8ag">`);
			push_element($$renderer, "h2", 303, 20);
			$$renderer.push(`Recently Tested</h2>`);
			pop_element();
			$$renderer.push(` <p class="text-muted svelte-1uha8ag">`);
			push_element($$renderer, "p", 304, 20);
			$$renderer.push(`Latest deliverability reports from this instance</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="row svelte-1uha8ag">`);
			push_element($$renderer, "div", 308, 12);
			$$renderer.push(`<div class="col-lg-10 mx-auto svelte-1uha8ag">`);
			push_element($$renderer, "div", 309, 16);
			HistoryTable($$renderer, { tests: recentTests });
			$$renderer.push(`<!----> <div class="text-center mt-4 svelte-1uha8ag">`);
			push_element($$renderer, "div", 311, 20);
			$$renderer.push(`<a${attr("href", resolve("/history"))} class="btn btn-outline-primary svelte-1uha8ag">`);
			push_element($$renderer, "a", 312, 24);
			$$renderer.push(`<i class="bi bi-clock-history me-2 svelte-1uha8ag">`);
			push_element($$renderer, "i", 313, 28);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` View All Tests</a>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</section>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <section class="py-5 svelte-1uha8ag" id="features">`);
		push_element($$renderer, "section", 324, 0);
		$$renderer.push(`<div class="container py-4 svelte-1uha8ag">`);
		push_element($$renderer, "div", 325, 4);
		$$renderer.push(`<div class="row text-center mb-5 svelte-1uha8ag">`);
		push_element($$renderer, "div", 326, 8);
		$$renderer.push(`<div class="col-lg-8 mx-auto svelte-1uha8ag">`);
		push_element($$renderer, "div", 327, 12);
		$$renderer.push(`<h2 class="display-5 fw-bold mb-3 svelte-1uha8ag">`);
		push_element($$renderer, "h2", 328, 16);
		$$renderer.push(`Comprehensive Email Analysis</h2>`);
		pop_element();
		$$renderer.push(` <p class="text-muted svelte-1uha8ag">`);
		push_element($$renderer, "p", 329, 16);
		$$renderer.push(`Your favorite deliverability tester, open-source and self-hostable for complete
                    privacy and control.</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="row g-4 justify-content-center svelte-1uha8ag">`);
		push_element($$renderer, "div", 336, 8);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(features());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let feature = each_array[$$index];
			$$renderer.push(`<div class="col-md-6 col-lg-3 svelte-1uha8ag">`);
			push_element($$renderer, "div", 338, 16);
			FeatureCard($$renderer, spread_props([feature]));
			$$renderer.push(`<!----></div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</section>`);
		pop_element();
		$$renderer.push(` <section class="bg-light py-5 svelte-1uha8ag" id="steps">`);
		push_element($$renderer, "section", 347, 0);
		$$renderer.push(`<div class="container py-4 svelte-1uha8ag">`);
		push_element($$renderer, "div", 348, 4);
		$$renderer.push(`<div class="row text-center mb-5 svelte-1uha8ag">`);
		push_element($$renderer, "div", 349, 8);
		$$renderer.push(`<div class="col-lg-8 mx-auto svelte-1uha8ag">`);
		push_element($$renderer, "div", 350, 12);
		$$renderer.push(`<h2 class="display-5 fw-bold mb-3 svelte-1uha8ag">`);
		push_element($$renderer, "h2", 351, 16);
		$$renderer.push(`How It Works</h2>`);
		pop_element();
		$$renderer.push(` <p class="text-muted svelte-1uha8ag">`);
		push_element($$renderer, "p", 352, 16);
		$$renderer.push(`Simple three-step process to test your email deliverability</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="row g-4 svelte-1uha8ag">`);
		push_element($$renderer, "div", 358, 8);
		$$renderer.push(`<!--[-->`);
		const each_array_1 = ensure_array_like(steps);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let stepData = each_array_1[$$index_1];
			$$renderer.push(`<div class="col-md-4 svelte-1uha8ag">`);
			push_element($$renderer, "div", 360, 16);
			HowItWorksStep($$renderer, spread_props([stepData]));
			$$renderer.push(`<!----></div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <div class="text-center mt-5 svelte-1uha8ag">`);
		push_element($$renderer, "div", 366, 8);
		$$renderer.push(`<button class="btn btn-primary btn-lg px-5 py-3 svelte-1uha8ag"${attr("disabled", loading, true)}>`);
		push_element($$renderer, "button", 367, 12);
		$$renderer.push(`<!--[-1--><i class="bi bi-rocket-takeoff me-2 svelte-1uha8ag">`);
		push_element($$renderer, "i", 376, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Get Started Now`);
		$$renderer.push(`<!--]--></button>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="text-center mt-4 svelte-1uha8ag">`);
		push_element($$renderer, "div", 382, 8);
		if (store_get($$store_subs ??= {}, "$appConfig", appConfig).eml_upload_enabled) {
			$$renderer.push(`<!--[0--><button class="btn btn-secondary btn-lg me-2 svelte-1uha8ag"${attr("disabled", loading, true)}>`);
			push_element($$renderer, "button", 384, 16);
			$$renderer.push(`<i class="bi bi-file-earmark-arrow-up me-2 svelte-1uha8ag">`);
			push_element($$renderer, "i", 389, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Analyze an .eml File</button>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <a${attr("href", resolve("/domain"))} class="btn btn-secondary btn-lg me-2 svelte-1uha8ag">`);
		push_element($$renderer, "a", 393, 12);
		$$renderer.push(`<i class="bi bi-globe me-2 svelte-1uha8ag">`);
		push_element($$renderer, "i", 394, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Test Domain Only</a>`);
		pop_element();
		$$renderer.push(` <a${attr("href", resolve("/bimi"))} class="btn btn-secondary btn-lg me-2 svelte-1uha8ag">`);
		push_element($$renderer, "a", 397, 12);
		$$renderer.push(`<i class="bi bi-building-check me-2 svelte-1uha8ag">`);
		push_element($$renderer, "i", 398, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Check BIMI Only</a>`);
		pop_element();
		$$renderer.push(` <a${attr("href", resolve("/blacklist"))} class="btn btn-secondary btn-lg svelte-1uha8ag">`);
		push_element($$renderer, "a", 401, 12);
		$$renderer.push(`<i class="bi bi-shield-exclamation me-2 svelte-1uha8ag">`);
		push_element($$renderer, "i", 402, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Check IP Blacklist</a>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</section>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
