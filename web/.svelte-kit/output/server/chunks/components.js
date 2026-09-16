import { O as FILENAME, S as escape_html, _ as validate_snippet_args, b as attr, c as derived, f as store_get, g as push_element, h as pop_element, l as ensure_array_like, m as unsubscribe_stores, o as attr_class, p as stringify, r as createEventDispatcher, s as attr_style, x as clsx, y as prevent_snippet_stringification } from "./internal.js";
import { t as resolve } from "./paths.js";
import { t as theme } from "./theme.js";
import { t as appConfig } from "./config.js";
import "./navigation.js";
//#region src/lib/authentication.ts
/**
* True when the report describes a file the user supplied rather than a message delivered to
* this instance.
*
* It changes who is responsible for a missing authentication verdict: for an uploaded file
* the verdicts come from whichever server originally received the message, so their absence
* says nothing about this instance's configuration.
*/
function isUploadedMessage(source) {
	return source === "uploaded";
}
/**
* Short explanation of why no authentication grade can be shown, suitable for a tooltip.
*/
function noAuthResultsTitle(source) {
	if (isUploadedMessage(source)) return "The uploaded file carries no usable authentication result, so no grade can be computed. This depends on the server that originally received the message, not on this instance.";
	return "This server did not report any authentication result, so no grade can be computed. Contact the administrator of this instance.";
}
/**
* True when none of the required authentication mechanisms were reported.
*
* This is not a sender problem: it means no usable `Authentication-Results` header was
* available. For a message received by this instance that points at its configuration (the
* receiving mail server does not verify authentication, or the header's authserv-id does not
* match the configured `--receiver-hostname`); for an uploaded file it simply means the
* message did not carry one. Grades derived from these results are meaningless either way.
*
* An SPF verdict on the HELO identity alone counts: the receiver did evaluate the message, it
* just says nothing about the envelope sender. The backend scores it accordingly, so hiding
* the grade here would contradict it.
*/
function hasNoAuthenticationResults(authentication) {
	if (!authentication) return true;
	return reportedMechanisms(authentication).every((reported) => !reported);
}
/** Whether each of the required authentication mechanisms was reported, in a fixed order. */
function reportedMechanisms(authentication) {
	return [
		!!authentication.spf || !!authentication.spf_helo,
		!!authentication.dkim?.length,
		!!authentication.dmarc
	];
}
/**
* True when some, but not all, of the required authentication mechanisms were reported.
*
* The verdicts present come from the infrastructure that received the message before
* happyDeliver, which does not recompute them; the missing ones show as "Not tested".
*/
function hasPartialAuthenticationResults(authentication) {
	if (!authentication) return false;
	const reported = reportedMechanisms(authentication);
	return reported.some((ok) => ok) && !reported.every((ok) => ok);
}
//#endregion
//#region src/lib/score.ts
function getScoreColorClass(percentage) {
	if (percentage >= 85) return "success";
	if (percentage >= 50) return "warning";
	return "danger";
}
//#endregion
//#region src/lib/components/GradeDisplay.svelte
GradeDisplay[FILENAME] = "src/lib/components/GradeDisplay.svelte";
function GradeDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { grade, score, size = "medium" } = $$props;
		function getGradeColor(grade) {
			if (!grade) return "#6b7280";
			const baseLetter = grade.charAt(0).toUpperCase();
			const modifier = grade.length > 1 ? grade.charAt(1) : "";
			switch (baseLetter) {
				case "A":
					if (modifier === "+") return "#22c55e";
					if (modifier === "-") return "#16a34a";
					return "#22c55e";
				case "B":
					if (modifier === "-") return "#65a30d";
					return "#84cc16";
				case "C":
					if (modifier === "-") return "#ca8a04";
					return "#eab308";
				case "D": return "#f97316";
				case "E": return "#ea580c";
				case "F": return "#dc2626";
				default: return "#6b7280";
			}
		}
		function getSizeClass(size) {
			if (size === "inline") return "fw-bold";
			if (size === "small") return "fs-4";
			if (size === "large") return "display-1";
			return "fs-2";
		}
		$$renderer.push(`<strong${attr_class(clsx(getSizeClass(size)), "svelte-19rv8mx")}${attr_style(`color: ${stringify(getGradeColor(grade))}; font-weight: 700;`)}>`);
		push_element($$renderer, "strong", 47, 0);
		if (grade) $$renderer.push(`<!--[0-->${escape_html(grade)}`);
		else $$renderer.push(`<!--[-1-->${escape_html(score)}%`);
		$$renderer.push(`<!--]--></strong>`);
		pop_element();
	}, GradeDisplay);
}
GradeDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/AuthenticationCard.svelte
AuthenticationCard[FILENAME] = "src/lib/components/AuthenticationCard.svelte";
function AuthenticationCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { authentication, authenticationGrade, authenticationScore, dnsResults, source, authservId } = $$props;
		let allRequiredMissing = derived(() => hasNoAuthenticationResults(authentication));
		let partialResults = derived(() => hasPartialAuthenticationResults(authentication));
		let uploaded = derived(() => isUploadedMessage(source));
		function getAuthResultClass(result, noneIsFail) {
			switch (result) {
				case "pass":
				case "domain_pass":
				case "orgdomain_pass": return "text-success";
				case "permerror":
				case "error":
				case "fail":
				case "missing":
				case "invalid":
				case "null":
				case "null_smtp":
				case "null_header": return "text-danger";
				case "softfail":
				case "neutral": return "text-warning";
				case "declined": return "text-info";
				case "none": return noneIsFail ? "text-danger" : "text-muted";
				default: return "text-muted";
			}
		}
		function getAuthResultIcon(result, noneIsFail) {
			switch (result) {
				case "pass":
				case "domain_pass":
				case "orgdomain_pass": return "bi-check-circle-fill";
				case "fail": return "bi-x-circle-fill";
				case "softfail":
				case "neutral":
				case "invalid":
				case "null":
				case "permerror":
				case "error":
				case "null_smtp":
				case "null_header": return "bi-exclamation-circle-fill";
				case "missing": return "bi-dash-circle-fill";
				case "declined": return "bi-dash-circle";
				case "none": return noneIsFail ? "bi-x-circle-fill" : "bi-question-circle";
				default: return "bi-question-circle";
			}
		}
		function getAuthResultText(result) {
			switch (result) {
				case "missing": return "Not tested";
				default: return result;
			}
		}
		$$renderer.push(`<div class="card shadow-sm" id="authentication-details">`);
		push_element($$renderer, "div", 100, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 101, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 102, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 103, 12);
		$$renderer.push(`<i class="bi bi-shield-check me-2">`);
		push_element($$renderer, "i", 104, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Authentication</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 107, 12);
		if (allRequiredMissing()) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: "N/A",
				size: "small"
			});
		} else {
			$$renderer.push("<!--[-1-->");
			if (authenticationScore !== void 0) {
				$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(authenticationScore))}`)}>`);
				push_element($$renderer, "span", 113, 24);
				$$renderer.push(`${escape_html(authenticationScore)}%</span>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authenticationGrade !== void 0) {
				$$renderer.push("<!--[0-->");
				GradeDisplay($$renderer, {
					grade: authenticationGrade,
					size: "small"
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (allRequiredMissing()) {
			$$renderer.push(`<!--[0--><div class="card-body border-bottom">`);
			push_element($$renderer, "div", 125, 8);
			$$renderer.push(`<div class="alert alert-warning mb-0">`);
			push_element($$renderer, "div", 126, 12);
			$$renderer.push(`<i class="bi bi-exclamation-triangle-fill me-2">`);
			push_element($$renderer, "i", 127, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 128, 16);
			$$renderer.push(`No authentication results found.</strong>`);
			pop_element();
			$$renderer.push(` `);
			if (uploaded()) {
				$$renderer.push(`<!--[0--><p class="mb-0 mt-1">`);
				push_element($$renderer, "p", 130, 20);
				$$renderer.push(`The uploaded file carries no usable <code>`);
				push_element($$renderer, "code", 131, 60);
				$$renderer.push(`Authentication-Results</code>`);
				pop_element();
				$$renderer.push(` header, so SPF, DKIM and DMARC could not be evaluated and the authentication grade
                        is reported as <strong>`);
				push_element($$renderer, "strong", 133, 39);
				$$renderer.push(`N/A</strong>`);
				pop_element();
				$$renderer.push(`. Whether those verdicts exist depends on
                        the server that originally received the message. Send the message to a test
                        address to have them verified here.</p>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><p class="mb-0 mt-1">`);
				push_element($$renderer, "p", 138, 20);
				$$renderer.push(`This is not a problem with the analysed email: this server could not
                        evaluate SPF, DKIM and DMARC, so the authentication grade is reported as <strong>`);
				push_element($$renderer, "strong", 141, 24);
				$$renderer.push(`N/A</strong>`);
				pop_element();
				$$renderer.push(`. The administrator of this HappyDeliver instance should
                        look at it, as it usually means either:</p>`);
				pop_element();
				$$renderer.push(` <ul class="mb-0 mt-1">`);
				push_element($$renderer, "ul", 144, 20);
				$$renderer.push(`<li>`);
				push_element($$renderer, "li", 145, 24);
				$$renderer.push(`The receiving mail server is not configured to verify email
                            authentication (no <code>`);
				push_element($$renderer, "code", 147, 47);
				$$renderer.push(`Authentication-Results</code>`);
				pop_element();
				$$renderer.push(` header was found in
                            the message).</li>`);
				pop_element();
				$$renderer.push(` <li>`);
				push_element($$renderer, "li", 150, 24);
				$$renderer.push(`The <code>`);
				push_element($$renderer, "code", 151, 32);
				$$renderer.push(`Authentication-Results</code>`);
				pop_element();
				$$renderer.push(` header exists but the receiver
                            hostname does not match the configured <code>`);
				push_element($$renderer, "code", 153, 28);
				$$renderer.push(`--receiver-hostname</code>`);
				pop_element();
				$$renderer.push(` value.</li>`);
				pop_element();
				$$renderer.push(`</ul>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else if (partialResults()) {
			$$renderer.push(`<!--[1--><div class="card-body border-bottom">`);
			push_element($$renderer, "div", 160, 8);
			$$renderer.push(`<div class="alert alert-warning mb-0">`);
			push_element($$renderer, "div", 161, 12);
			$$renderer.push(`<i class="bi bi-exclamation-triangle-fill me-2">`);
			push_element($$renderer, "i", 162, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 163, 16);
			$$renderer.push(`Some authentication results are missing.</strong>`);
			pop_element();
			$$renderer.push(` <p class="mb-0 mt-1">`);
			push_element($$renderer, "p", 164, 16);
			if (uploaded() && authservId) {
				$$renderer.push(`<!--[0-->The results shown here were produced by <code>`);
				push_element($$renderer, "code", 166, 64);
				$$renderer.push(`${escape_html(authservId)}</code>`);
				pop_element();
				$$renderer.push(`, the
                        server that received this message before it reached happyDeliver.`);
			} else if (uploaded()) $$renderer.push(`<!--[1-->The results shown here were produced by the infrastructure of your mail
                        provider that received this message before it reached happyDeliver.`);
			else $$renderer.push(`<!--[-1-->The results shown here were produced by this happyDeliver instance's own
                        receiving mail server.`);
			$$renderer.push(`<!--]--> happyDeliver does not recompute this
                    part. Mechanisms marked <strong>`);
			push_element($$renderer, "strong", 176, 44);
			$$renderer.push(`Not tested</strong>`);
			pop_element();
			$$renderer.push(` were not evaluated by that infrastructure.
                    Send a test message directly to happyDeliver to have them verified here.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else if (uploaded() && authservId) {
			$$renderer.push(`<!--[2--><div class="card-body border-bottom py-2">`);
			push_element($$renderer, "div", 182, 8);
			$$renderer.push(`<p class="mb-0 small text-muted">`);
			push_element($$renderer, "p", 183, 12);
			$$renderer.push(`<i class="bi bi-info-circle me-2">`);
			push_element($$renderer, "i", 184, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` These verdicts were produced by <code>`);
			push_element($$renderer, "code", 185, 48);
			$$renderer.push(`${escape_html(authservId)}</code>`);
			pop_element();
			$$renderer.push(`, the server that received
                the uploaded message, not by this instance.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="list-group list-group-flush">`);
		push_element($$renderer, "div", 190, 4);
		if (authentication.iprev) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-iprev">`);
			push_element($$renderer, "div", 193, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 194, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.iprev.result, true))} ${stringify(getAuthResultClass(authentication.iprev.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 195, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 201, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 202, 24);
			$$renderer.push(`IP Reverse DNS</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.iprev.result, true))}`)}>`);
			push_element($$renderer, "span", 203, 24);
			$$renderer.push(`${escape_html(authentication.iprev.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.iprev.ip) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 212, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 213, 32);
				$$renderer.push(`IP Address:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 214, 32);
				$$renderer.push(`${escape_html(authentication.iprev.ip)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.iprev.hostname) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 218, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 219, 32);
				$$renderer.push(`Hostname:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 220, 32);
				$$renderer.push(`${escape_html(authentication.iprev.hostname)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.iprev.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 224, 28);
				$$renderer.push(`${escape_html(authentication.iprev.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (authentication.x_ptr) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-x-ptr">`);
			push_element($$renderer, "div", 237, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 238, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.x_ptr.result, true))} ${stringify(getAuthResultClass(authentication.x_ptr.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 239, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 245, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 246, 24);
			$$renderer.push(`HELO / PTR</strong>`);
			pop_element();
			$$renderer.push(` <i class="bi bi-info-circle text-muted ms-1" title="Checks that the HELO/EHLO hostname announced by the sending server matches the sender IP's reverse DNS (PTR) record.">`);
			push_element($$renderer, "i", 247, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.x_ptr.result, true))}`)}>`);
			push_element($$renderer, "span", 251, 24);
			$$renderer.push(`${escape_html(authentication.x_ptr.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.x_ptr.helo) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 260, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 261, 32);
				$$renderer.push(`Announced HELO:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 262, 32);
				$$renderer.push(`${escape_html(authentication.x_ptr.helo)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.x_ptr.ptr) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 266, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 267, 32);
				$$renderer.push(`Reverse DNS (PTR):</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 268, 32);
				$$renderer.push(`${escape_html(authentication.x_ptr.ptr)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.x_ptr.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 272, 28);
				$$renderer.push(`${escape_html(authentication.x_ptr.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (authentication.x_tls) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-x-tls">`);
			push_element($$renderer, "div", 285, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 286, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.x_tls.result, true))} ${stringify(getAuthResultClass(authentication.x_tls.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 287, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 293, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 294, 24);
			$$renderer.push(`Transport TLS</strong>`);
			pop_element();
			$$renderer.push(` <i class="bi bi-info-circle text-muted ms-1" title="Whether the inbound connection that delivered this message used TLS encryption (x-tls). Falls back to the inbound Received hop when no x-tls header is present.">`);
			push_element($$renderer, "i", 295, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.x_tls.result, true))}`)}>`);
			push_element($$renderer, "span", 299, 24);
			$$renderer.push(`${escape_html(authentication.x_tls.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.x_tls.details) {
				$$renderer.push(`<!--[0--><div class="small text-muted mt-1">`);
				push_element($$renderer, "div", 308, 28);
				$$renderer.push(`${escape_html(authentication.x_tls.details)}</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="list-group-item" id="authentication-spf">`);
		push_element($$renderer, "div", 318, 8);
		$$renderer.push(`<div class="d-flex align-items-start">`);
		push_element($$renderer, "div", 319, 12);
		if (authentication.spf) {
			$$renderer.push(`<!--[0--><i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.spf.result, true))} ${stringify(getAuthResultClass(authentication.spf.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 321, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 327, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 328, 24);
			$$renderer.push(`SPF</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.spf.result, true))}`)}>`);
			push_element($$renderer, "span", 329, 24);
			$$renderer.push(`${escape_html(authentication.spf.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.spf.domain) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 338, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 339, 32);
				$$renderer.push(`Domain:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 340, 32);
				$$renderer.push(`${escape_html(authentication.spf.domain)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.spf.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 344, 28);
				$$renderer.push(`${escape_html(authentication.spf.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else if (authentication.spf_helo) {
			$$renderer.push(`<!--[1--><i${attr_class(`bi ${stringify(getAuthResultIcon("none", false))} ${stringify(getAuthResultClass("none", false))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 354, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 360, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 361, 24);
			$$renderer.push(`SPF</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass("none", false))}`)}>`);
			push_element($$renderer, "span", 362, 24);
			$$renderer.push(`Not checked</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 365, 24);
			$$renderer.push(`The receiver only checked the HELO identity below, so it reported no
                            verdict for the envelope sender.</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else {
			$$renderer.push(`<!--[-1--><i${attr_class(`bi ${stringify(getAuthResultIcon("missing", true))} ${stringify(getAuthResultClass("missing", true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 371, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 377, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 378, 24);
			$$renderer.push(`SPF</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass("missing", true))}`)}>`);
			push_element($$renderer, "span", 379, 24);
			$$renderer.push(`${escape_html(getAuthResultText("missing"))}</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 382, 24);
			$$renderer.push(`SPF record is required for proper email authentication</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` `);
		if (authentication.spf_helo) {
			$$renderer.push(`<!--[0--><div class="d-flex align-items-start mt-3">`);
			push_element($$renderer, "div", 391, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.spf_helo.result, true))} ${stringify(getAuthResultClass(authentication.spf_helo.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 392, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 398, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 399, 24);
			$$renderer.push(`SPF (HELO)</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.spf_helo.result, true))}`)}>`);
			push_element($$renderer, "span", 400, 24);
			$$renderer.push(`${escape_html(authentication.spf_helo.result)}</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 408, 24);
			$$renderer.push(`Checked against the hostname the sending server announced, not against
                            the envelope sender.</div>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.spf_helo.domain) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 413, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 414, 32);
				$$renderer.push(`Hostname:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 415, 32);
				$$renderer.push(`${escape_html(authentication.spf_helo.domain)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.spf_helo.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 419, 28);
				$$renderer.push(`${escape_html(authentication.spf_helo.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <div class="list-group-item" id="authentication-dkim">`);
		push_element($$renderer, "div", 432, 8);
		if (authentication.dkim && authentication.dkim.length > 0) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(authentication.dkim);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let dkim = each_array[i];
				$$renderer.push(`<div${attr_class("d-flex align-items-start", void 0, { "mt-3": i > 0 })}>`);
				push_element($$renderer, "div", 435, 20);
				$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(dkim.result, true))} ${stringify(getAuthResultClass(dkim.result, true))} me-2 fs-5`)}>`);
				push_element($$renderer, "i", 436, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <div>`);
				push_element($$renderer, "div", 442, 24);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 443, 28);
				$$renderer.push(`DKIM${escape_html(authentication.dkim.length > 1 ? ` #${i + 1}` : "")}</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(dkim.result, true))}`)}>`);
				push_element($$renderer, "span", 445, 28);
				$$renderer.push(`${escape_html(dkim.result)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (dkim.domain) {
					$$renderer.push(`<!--[0--><div class="small">`);
					push_element($$renderer, "div", 451, 32);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 452, 36);
					$$renderer.push(`Domain:</strong>`);
					pop_element();
					$$renderer.push(` <span class="text-muted">`);
					push_element($$renderer, "span", 453, 36);
					$$renderer.push(`${escape_html(dkim.domain)}</span>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (dkim.selector) {
					$$renderer.push(`<!--[0--><div class="small">`);
					push_element($$renderer, "div", 457, 32);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 458, 36);
					$$renderer.push(`Selector:</strong>`);
					pop_element();
					$$renderer.push(` <span class="text-muted">`);
					push_element($$renderer, "span", 459, 36);
					$$renderer.push(`${escape_html(dkim.selector)}</span>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (dkim.details) {
					$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
					push_element($$renderer, "pre", 463, 32);
					$$renderer.push(`${escape_html(dkim.details)}</pre>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 473, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon("missing", true))} ${stringify(getAuthResultClass("missing", true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 474, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 480, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 481, 24);
			$$renderer.push(`DKIM</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass("missing", true))}`)}>`);
			push_element($$renderer, "span", 482, 24);
			$$renderer.push(`${escape_html(getAuthResultText("missing"))}</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 485, 24);
			$$renderer.push(`DKIM signature is required for proper email authentication</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` `);
		if (authentication.x_google_dkim) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-x-google-dkim">`);
			push_element($$renderer, "div", 495, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 496, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.x_google_dkim.result, false))} ${stringify(getAuthResultClass(authentication.x_google_dkim.result, false))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 497, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 506, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 507, 24);
			$$renderer.push(`X-Google-DKIM</strong>`);
			pop_element();
			$$renderer.push(` <i class="bi bi-info-circle text-muted ms-1" title="Google's internal DKIM signature for messages routed through Gmail infrastructure">`);
			push_element($$renderer, "i", 508, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.x_google_dkim.result, false))}`)}>`);
			push_element($$renderer, "span", 512, 24);
			$$renderer.push(`${escape_html(authentication.x_google_dkim.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.x_google_dkim.domain) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 521, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 522, 32);
				$$renderer.push(`Domain:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 523, 32);
				$$renderer.push(`${escape_html(authentication.x_google_dkim.domain)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.x_google_dkim.selector) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 528, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 529, 32);
				$$renderer.push(`Selector:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 530, 32);
				$$renderer.push(`${escape_html(authentication.x_google_dkim.selector)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.x_google_dkim.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 536, 28);
				$$renderer.push(`${escape_html(authentication.x_google_dkim.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (authentication.x_aligned_from) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-x-aligned-from">`);
			push_element($$renderer, "div", 550, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 551, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.x_aligned_from.result, false))} ${stringify(getAuthResultClass(authentication.x_aligned_from.result, false))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 552, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 561, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 562, 24);
			$$renderer.push(`X-Aligned-From</strong>`);
			pop_element();
			$$renderer.push(` <i class="bi bi-info-circle text-muted ms-1" title="Check that Mail From and Header From addresses are in alignment. See Domain Alignment section.">`);
			push_element($$renderer, "i", 563, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.x_aligned_from.result, false))}`)}>`);
			push_element($$renderer, "span", 567, 24);
			$$renderer.push(`${escape_html(authentication.x_aligned_from.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.x_aligned_from.domain) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 576, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 577, 32);
				$$renderer.push(`Domain:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 578, 32);
				$$renderer.push(`${escape_html(authentication.x_aligned_from.domain)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.x_aligned_from.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 584, 28);
				$$renderer.push(`${escape_html(authentication.x_aligned_from.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="list-group-item" id="authentication-dmarc">`);
		push_element($$renderer, "div", 597, 8);
		$$renderer.push(`<div class="d-flex align-items-start">`);
		push_element($$renderer, "div", 598, 12);
		if (authentication.dmarc) {
			$$renderer.push("<!--[0-->");
			prevent_snippet_stringification(DMARCPolicy);
			function DMARCPolicy($$renderer, policy) {
				validate_snippet_args($$renderer);
				$$renderer.push(`<div class="small">`);
				push_element($$renderer, "div", 623, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 624, 32);
				$$renderer.push(`Policy:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class("fw-bold", void 0, {
					"text-success": policy == "reject",
					"text-warning": policy == "quarantine",
					"text-danger": policy == "none",
					"bg-warning": policy != "none" && policy != "quarantine" && policy != "reject"
				})}>`);
				push_element($$renderer, "span", 625, 32);
				$$renderer.push(`${escape_html(policy)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.dmarc.result, true))} ${stringify(getAuthResultClass(authentication.dmarc.result, true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 600, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 606, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 607, 24);
			$$renderer.push(`DMARC</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.dmarc.result, true))}`)}>`);
			push_element($$renderer, "span", 608, 24);
			$$renderer.push(`${escape_html(authentication.dmarc.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.dmarc.domain) {
				$$renderer.push(`<!--[0--><div class="small">`);
				push_element($$renderer, "div", 617, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 618, 32);
				$$renderer.push(`Domain:</strong>`);
				pop_element();
				$$renderer.push(` <span class="text-muted">`);
				push_element($$renderer, "span", 619, 32);
				$$renderer.push(`${escape_html(authentication.dmarc.domain)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.dmarc.result != "none") {
				$$renderer.push("<!--[0-->");
				if (authentication.dmarc.details && authentication.dmarc.details.indexOf("policy.published-domain-policy=") > 0) {
					$$renderer.push("<!--[0-->");
					DMARCPolicy($$renderer, authentication.dmarc.details.replace(/^.*policy.published-domain-policy=([^\s]+).*$/, "$1"));
				} else if (authentication.dmarc.domain && dnsResults?.dmarc_record?.policy) {
					$$renderer.push("<!--[1-->");
					DMARCPolicy($$renderer, dnsResults.dmarc_record.policy);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.dmarc.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 650, 28);
				$$renderer.push(`${escape_html(authentication.dmarc.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else {
			$$renderer.push(`<!--[-1--><i${attr_class(`bi ${stringify(getAuthResultIcon("missing", true))} ${stringify(getAuthResultClass("missing", true))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 658, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 664, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 665, 24);
			$$renderer.push(`DMARC</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass("missing", true))}`)}>`);
			push_element($$renderer, "span", 666, 24);
			$$renderer.push(`${escape_html(getAuthResultText("missing"))}</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 669, 24);
			$$renderer.push(`DMARC policy is required for proper email authentication</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="list-group-item" id="authentication-bimi">`);
		push_element($$renderer, "div", 678, 8);
		$$renderer.push(`<div class="d-flex align-items-start">`);
		push_element($$renderer, "div", 679, 12);
		if (authentication.bimi && authentication.bimi.result != "none") {
			$$renderer.push(`<!--[0--><i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.bimi.result, false))} ${stringify(getAuthResultClass(authentication.bimi.result, false))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 681, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 687, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 688, 24);
			$$renderer.push(`BIMI</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.bimi.result, false))}`)}>`);
			push_element($$renderer, "span", 689, 24);
			$$renderer.push(`${escape_html(authentication.bimi.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.bimi.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 698, 28);
				$$renderer.push(`${escape_html(authentication.bimi.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else if (authentication.bimi && authentication.bimi.result == "none") {
			$$renderer.push(`<!--[1--><i class="bi bi-exclamation-circle-fill text-warning me-2 fs-5">`);
			push_element($$renderer, "i", 706, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 707, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 708, 24);
			$$renderer.push(`BIMI</strong>`);
			pop_element();
			$$renderer.push(` <span class="text-uppercase ms-2 text-warning">`);
			push_element($$renderer, "span", 709, 24);
			$$renderer.push(`NONE</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 710, 24);
			$$renderer.push(`Brand Indicators for Message Identification</div>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.bimi.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 714, 28);
				$$renderer.push(`${escape_html(authentication.bimi.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else {
			$$renderer.push(`<!--[-1--><i class="bi bi-info-circle text-muted me-2 fs-5">`);
			push_element($$renderer, "i", 722, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 723, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 724, 24);
			$$renderer.push(`BIMI</strong>`);
			pop_element();
			$$renderer.push(` <span class="text-uppercase ms-2 text-muted">`);
			push_element($$renderer, "span", 725, 24);
			$$renderer.push(`Optional</span>`);
			pop_element();
			$$renderer.push(` <div class="text-muted small">`);
			push_element($$renderer, "div", 726, 24);
			$$renderer.push(`Brand Indicators for Message Identification (optional enhancement)</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (authentication.arc) {
			$$renderer.push(`<!--[0--><div class="list-group-item" id="authentication-arc">`);
			push_element($$renderer, "div", 736, 12);
			$$renderer.push(`<div class="d-flex align-items-start">`);
			push_element($$renderer, "div", 737, 16);
			$$renderer.push(`<i${attr_class(`bi ${stringify(getAuthResultIcon(authentication.arc.result, false))} ${stringify(getAuthResultClass(authentication.arc.result, false))} me-2 fs-5`)}>`);
			push_element($$renderer, "i", 738, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 744, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 745, 24);
			$$renderer.push(`ARC</strong>`);
			pop_element();
			$$renderer.push(` <span${attr_class(`text-uppercase ms-2 ${stringify(getAuthResultClass(authentication.arc.result, false))}`)}>`);
			push_element($$renderer, "span", 746, 24);
			$$renderer.push(`${escape_html(authentication.arc.result)}</span>`);
			pop_element();
			$$renderer.push(` `);
			if (authentication.arc.chain_length) {
				$$renderer.push(`<!--[0--><div class="text-muted small">`);
				push_element($$renderer, "div", 755, 28);
				$$renderer.push(`Chain length: ${escape_html(authentication.arc.chain_length)}</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (authentication.arc.details) {
				$$renderer.push(`<!--[0--><pre${attr_class(`p-2 mb-0 ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} text-muted small`)} style="white-space: pre-wrap">`);
				push_element($$renderer, "pre", 760, 28);
				$$renderer.push(`${escape_html(authentication.arc.details)}</pre>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, AuthenticationCard);
}
AuthenticationCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/BimiRecordDisplay.svelte
BimiRecordDisplay[FILENAME] = "src/lib/components/BimiRecordDisplay.svelte";
prevent_snippet_stringification(presenceBadge);
function presenceBadge($$renderer, value, passLabel = "present", failLabel = "missing") {
	validate_snippet_args($$renderer);
	if (value === void 0) {
		$$renderer.push(`<!--[0--><span class="badge bg-secondary">`);
		push_element($$renderer, "span", 184, 8);
		$$renderer.push(`not evaluated</span>`);
		pop_element();
	} else if (value) {
		$$renderer.push(`<!--[1--><span class="badge bg-success">`);
		push_element($$renderer, "span", 186, 8);
		$$renderer.push(`${escape_html(passLabel)}</span>`);
		pop_element();
	} else {
		$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
		push_element($$renderer, "span", 188, 8);
		$$renderer.push(`${escape_html(failLabel)}</span>`);
		pop_element();
	}
	$$renderer.push(`<!--]-->`);
}
function BimiRecordDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { bimiRecord, dmarcRecord } = $$props;
		const dmarcEnforced = derived(() => dmarcRecord?.policy === "quarantine" || dmarcRecord?.policy === "reject");
		let checksOpen = false;
		let vmcOpen = false;
		const headline = derived(() => !bimiRecord?.record_valid || !bimiRecord?.valid ? "fail" : bimiRecord.checks?.some((c) => c.status === "warning") ?? false ? "warning" : "pass");
		const inheritedFrom = derived(() => bimiRecord?.record_domain && bimiRecord.record_domain !== bimiRecord.domain ? bimiRecord.record_domain : void 0);
		const derivedFromLocalPart = derived(() => !!bimiRecord?.requested_selector && bimiRecord.requested_selector !== bimiRecord.selector);
		const localPartScope = derived(() => {
			if (!bimiRecord?.local_part_selector) return void 0;
			const prefixes = bimiRecord.local_part_prefixes ?? [];
			if (prefixes.length === 0) return "every sending address";
			return `the addresses starting with ${prefixes.map((p) => `“${p}”`).join(", ")}`;
		});
		const dmarcBlockers = derived(() => {
			const check = bimiRecord?.checks?.find((c) => c.name === "dmarc_enforcement");
			if (check?.status !== "fail") return [];
			return (check.messages ?? []).filter((m) => m.severity === "error").map((m) => m.text);
		});
		const checksDots = derived(() => (bimiRecord?.checks ?? []).map((c) => ({
			status: c.status,
			label: c.description ?? c.name
		})));
		function triState(value) {
			if (value === void 0) return "skipped";
			return value ? "pass" : "fail";
		}
		const vmcDots = derived(() => {
			const vmc = bimiRecord?.vmc;
			if (!vmc) return [];
			const dots = [
				{
					status: triState(vmc.has_bimi_eku),
					label: "BIMI Extended Key Usage"
				},
				{
					status: triState(vmc.issuer_has_bimi_eku),
					label: "Issuer allowed to issue VMCs"
				},
				{
					status: triState(vmc.has_logotype),
					label: "Embedded logo"
				},
				{
					status: triState(vmc.logo_hash_verified),
					label: "Embedded logo matches its certified hash"
				},
				{
					status: triState(vmc.has_crl_distribution_points),
					label: "Revocation checkable"
				},
				{
					status: triState(vmc.sct_count === void 0 ? void 0 : vmc.sct_count > 0),
					label: "Logged to Certificate Transparency"
				}
			];
			if (vmc.logo_matches !== void 0) dots.push({
				status: triState(vmc.logo_matches),
				label: "Embedded logo matches published logo"
			});
			if (vmc.chain_trusted !== void 0) dots.push({
				status: triState(vmc.chain_trusted),
				label: "Chain leads to a trusted BIMI root"
			});
			return dots;
		});
		const STATUS = {
			pass: {
				badge: "bg-success",
				icon: "bi-check-circle-fill",
				text: "text-success"
			},
			fail: {
				badge: "bg-danger",
				icon: "bi-x-circle-fill",
				text: "text-danger"
			},
			warning: {
				badge: "bg-warning text-dark",
				icon: "bi-exclamation-triangle-fill",
				text: "text-warning"
			},
			skipped: {
				badge: "bg-secondary",
				icon: "bi-dash-circle",
				text: "text-muted"
			}
		};
		function messageColor(message) {
			if (message.severity === "info") return "text-muted";
			return message.severity === "warning" ? "text-warning" : "text-danger";
		}
		function formatDate(date) {
			if (!date) return "";
			return new Date(date).toLocaleDateString();
		}
		prevent_snippet_stringification(statusDots);
		function statusDots($$renderer, dots) {
			validate_snippet_args($$renderer);
			$$renderer.push(`<span class="badge bg-light border rounded-pill d-inline-flex align-items-center gap-1 py-1 px-2">`);
			push_element($$renderer, "span", 164, 4);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(dots);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let dot = each_array[i];
				$$renderer.push(`<span${attr_class(`status-dot rounded-circle ${stringify(STATUS[dot.status].badge)}`, "svelte-13wm9y8")}${attr("title", `${stringify(dot.label)}: ${stringify(dot.status)}`)}>`);
				push_element($$renderer, "span", 168, 12);
				$$renderer.push(`</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></span>`);
			pop_element();
		}
		prevent_snippet_stringification(collapseHeader);
		function collapseHeader($$renderer, open, controls, title, dots, toggle) {
			validate_snippet_args($$renderer);
			$$renderer.push(`<button type="button" class="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center w-100"${attr("aria-expanded", open)}${attr("aria-controls", controls)}>`);
			push_element($$renderer, "button", 201, 4);
			$$renderer.push(`<i${attr_class("bi me-1", void 0, {
				"bi-chevron-right": !open,
				"bi-chevron-down": open
			})}>`);
			push_element($$renderer, "i", 208, 8);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <h6 class="mb-0 me-2">`);
			push_element($$renderer, "h6", 209, 8);
			$$renderer.push(`${escape_html(title)}</h6>`);
			pop_element();
			$$renderer.push(` `);
			if (!open) {
				$$renderer.push("<!--[0-->");
				statusDots($$renderer, dots);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button>`);
			pop_element();
		}
		if (bimiRecord) {
			$$renderer.push(`<!--[0--><div class="card mb-4" id="dns-bimi">`);
			push_element($$renderer, "div", 217, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 218, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 219, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": headline() === "pass",
				"text-success": headline() === "pass",
				"bi-exclamation-triangle-fill": headline() === "warning",
				"text-warning": headline() === "warning",
				"bi-x-circle-fill": headline() === "fail",
				"text-danger": headline() === "fail"
			})}>`);
			push_element($$renderer, "i", 220, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Brand Indicators for Message Identification</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 231, 12);
			$$renderer.push(`BIMI</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 233, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-2">`);
			push_element($$renderer, "p", 234, 12);
			$$renderer.push(`BIMI allows your brand logo to be displayed next to your emails in supported mail
                clients. Requires strong DMARC enforcement (quarantine or reject policy) and
                optionally a Verified Mark Certificate (VMC).</p>`);
			pop_element();
			$$renderer.push(` <hr/>`);
			push_element($$renderer, "hr", 240, 12);
			pop_element();
			$$renderer.push(` <div class="mb-2">`);
			push_element($$renderer, "div", 242, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 243, 16);
			$$renderer.push(`Selector:</strong>`);
			pop_element();
			$$renderer.push(` <code>`);
			push_element($$renderer, "code", 243, 43);
			$$renderer.push(`${escape_html(bimiRecord.selector)}</code>`);
			pop_element();
			$$renderer.push(` <strong class="ms-3">`);
			push_element($$renderer, "strong", 244, 16);
			$$renderer.push(`Domain:</strong>`);
			pop_element();
			$$renderer.push(` <code>`);
			push_element($$renderer, "code", 244, 54);
			$$renderer.push(`${escape_html(bimiRecord.domain)}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (dmarcBlockers().length > 0) {
				$$renderer.push(`<!--[0--><div class="alert alert-danger">`);
				push_element($$renderer, "div", 247, 16);
				$$renderer.push(`<h6 class="alert-heading">`);
				push_element($$renderer, "h6", 248, 20);
				$$renderer.push(`<i class="bi bi-exclamation-octagon-fill me-1">`);
				push_element($$renderer, "i", 249, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` This logo will not be displayed</h6>`);
				pop_element();
				$$renderer.push(` <p class="mb-2 small">`);
				push_element($$renderer, "p", 252, 20);
				$$renderer.push(`A message is only considered for BIMI once the sending domain's DMARC policy
                        is at enforcement. Receivers must not perform BIMI processing here, so no
                        indicator is shown however compliant the record and the logo below are.</p>`);
				pop_element();
				$$renderer.push(` <ul class="mb-2 small">`);
				push_element($$renderer, "ul", 257, 20);
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(dmarcBlockers());
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					let reason = each_array_1[i];
					$$renderer.push(`<li>`);
					push_element($$renderer, "li", 259, 28);
					$$renderer.push(`${escape_html(reason)}</li>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></ul>`);
				pop_element();
				$$renderer.push(` <p class="mb-0 small text-muted">`);
				push_element($$renderer, "p", 262, 20);
				$$renderer.push(`Requirement from § 7.1 of <em>`);
				push_element($$renderer, "em", 264, 24);
				$$renderer.push(`draft-brand-indicators-for-message-identification</em>`);
				pop_element();
				$$renderer.push(`. See the <a href="#dns-dmarc" class="alert-link">`);
				push_element($$renderer, "a", 265, 24);
				$$renderer.push(`DMARC section</a>`);
				pop_element();
				$$renderer.push(` of this report.</p>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (inheritedFrom()) {
				$$renderer.push(`<!--[0--><div class="alert alert-info py-2">`);
				push_element($$renderer, "div", 270, 16);
				$$renderer.push(`<i class="bi bi-diagram-2 me-1">`);
				push_element($$renderer, "i", 271, 20);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 272, 20);
				$$renderer.push(`${escape_html(bimiRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(` publishes no BIMI record of its own: the one
                    shown below is inherited from its organizational domain <code>`);
				push_element($$renderer, "code", 274, 20);
				$$renderer.push(`${escape_html(inheritedFrom())}</code>`);
				pop_element();
				$$renderer.push(`. Publish a record at <code>`);
				push_element($$renderer, "code", 275, 20);
				$$renderer.push(`${escape_html(bimiRecord.selector)}._bimi.${escape_html(bimiRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(` to give this domain its
                    own indicator, or a declination record to opt it out.</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (derivedFromLocalPart()) {
				$$renderer.push(`<!--[0--><div class="alert alert-info py-2">`);
				push_element($$renderer, "div", 280, 16);
				$$renderer.push(`<i class="bi bi-person-badge me-1">`);
				push_element($$renderer, "i", 281, 20);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` The record published at <code>`);
				push_element($$renderer, "code", 283, 20);
				$$renderer.push(`${escape_html(bimiRecord.requested_selector)}._bimi.${escape_html(bimiRecord.record_domain ?? bimiRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(` sends this sender to a selector named after its address, so the indicator shown below
                    is the one published at <code>`);
				push_element($$renderer, "code", 289, 20);
				$$renderer.push(`${escape_html(bimiRecord.selector)}._bimi.${escape_html(bimiRecord.record_domain ?? bimiRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(`.</div>`);
				pop_element();
			} else if (localPartScope()) {
				$$renderer.push(`<!--[1--><div class="alert alert-info py-2">`);
				push_element($$renderer, "div", 295, 16);
				$$renderer.push(`<i class="bi bi-person-badge me-1">`);
				push_element($$renderer, "i", 296, 20);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` This record's <code>`);
				push_element($$renderer, "code", 297, 34);
				$$renderer.push(`lps=</code>`);
				pop_element();
				$$renderer.push(` tag sends ${escape_html(localPartScope())} to a selector named after
                    the address, so those senders can be served another indicator than the one shown below.</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.avatar_preference) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 302, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 303, 20);
				$$renderer.push(`Avatar preference:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 304, 20);
				$$renderer.push(`${escape_html(bimiRecord.avatar_preference)}</code>`);
				pop_element();
				$$renderer.push(` <span class="small text-muted ms-1">`);
				push_element($$renderer, "span", 305, 20);
				if (bimiRecord.avatar_preference === "personal") $$renderer.push(`<!--[0-->providers that display personal avatars are asked to prefer the sender's
                            avatar over the brand indicator.`);
				else if (bimiRecord.avatar_preference === "brand") $$renderer.push(`<!--[1-->providers that display personal avatars are asked to prefer the brand
                            indicator. This is also the default.`);
				else {
					$$renderer.push(`<!--[-1-->unknown value: receivers must ignore it and fall back to <code>`);
					push_element($$renderer, "code", 314, 28);
					$$renderer.push(`brand</code>`);
					pop_element();
					$$renderer.push(`, and some may treat the whole record as failing.`);
				}
				$$renderer.push(`<!--]--></span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="mb-2">`);
			push_element($$renderer, "div", 319, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 320, 16);
			$$renderer.push(`DNS record:</strong>`);
			pop_element();
			$$renderer.push(` `);
			if (bimiRecord.record_valid) {
				$$renderer.push(`<!--[0--><span class="badge bg-success">`);
				push_element($$renderer, "span", 322, 20);
				$$renderer.push(`Valid</span>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
				push_element($$renderer, "span", 324, 20);
				$$renderer.push(`Invalid</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` `);
			if (bimiRecord.record) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 328, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 329, 20);
				$$renderer.push(`Record:</strong>`);
				pop_element();
				$$renderer.push(`<br/>`);
				push_element($$renderer, "br", 329, 44);
				pop_element();
				$$renderer.push(` <code class="d-block mt-1 text-break">`);
				push_element($$renderer, "code", 330, 20);
				$$renderer.push(`${escape_html(bimiRecord.record)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.error) {
				$$renderer.push(`<!--[0--><div class="text-danger">`);
				push_element($$renderer, "div", 334, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 335, 20);
				$$renderer.push(`Error:</strong>`);
				pop_element();
				$$renderer.push(` ${escape_html(bimiRecord.error)}</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.logo_url) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 340, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 341, 20);
				$$renderer.push(`Logo URL:</strong>`);
				pop_element();
				$$renderer.push(` <a${attr("href", bimiRecord.logo_url)} target="_blank" rel="noopener noreferrer">`);
				push_element($$renderer, "a", 343, 20);
				$$renderer.push(`${escape_html(bimiRecord.logo_url)}</a>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.vmc_url) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 349, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 350, 20);
				$$renderer.push(`VMC URL:</strong>`);
				pop_element();
				$$renderer.push(` <a${attr("href", bimiRecord.vmc_url)} target="_blank" rel="noopener noreferrer">`);
				push_element($$renderer, "a", 352, 20);
				$$renderer.push(`${escape_html(bimiRecord.vmc_url)}</a>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.record_valid) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 358, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 359, 20);
				$$renderer.push(`Assets (logo, VMC):</strong>`);
				pop_element();
				$$renderer.push(` `);
				if (bimiRecord.valid) {
					$$renderer.push(`<!--[0--><span class="badge bg-success">`);
					push_element($$renderer, "span", 361, 24);
					$$renderer.push(`Compliant</span>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
					push_element($$renderer, "span", 363, 24);
					$$renderer.push(`Failed validation</span>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.checks && bimiRecord.checks.length > 0) {
				$$renderer.push(`<!--[0--><hr/>`);
				push_element($$renderer, "hr", 368, 16);
				pop_element();
				$$renderer.push(` `);
				collapseHeader($$renderer, checksOpen, "bimi-detailed-checks", "Detailed checks", checksDots(), () => checksOpen = !checksOpen);
				$$renderer.push(`<!----> <ul id="bimi-detailed-checks"${attr_class("list-group list-group-flush mt-2", void 0, { "d-none": !checksOpen })}>`);
				push_element($$renderer, "ul", 376, 16);
				$$renderer.push(`<!--[-->`);
				const each_array_2 = ensure_array_like(bimiRecord.checks);
				for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
					let check = each_array_2[$$index_3];
					$$renderer.push(`<li class="list-group-item px-0">`);
					push_element($$renderer, "li", 382, 24);
					$$renderer.push(`<i${attr_class(`bi ${stringify(STATUS[check.status].icon)} ${stringify(STATUS[check.status].text)} me-1`, "svelte-13wm9y8")}>`);
					push_element($$renderer, "i", 383, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 387, 28);
					$$renderer.push(`${escape_html(check.description)}</strong>`);
					pop_element();
					$$renderer.push(` <span${attr_class(`badge ms-2 ${stringify(STATUS[check.status].badge)}`, "svelte-13wm9y8")}>`);
					push_element($$renderer, "span", 388, 28);
					$$renderer.push(`${escape_html(check.status)}</span>`);
					pop_element();
					$$renderer.push(` `);
					if (check.messages && check.messages.length > 0) {
						$$renderer.push(`<!--[0--><ul class="small mb-0 mt-1">`);
						push_element($$renderer, "ul", 392, 32);
						$$renderer.push(`<!--[-->`);
						const each_array_3 = ensure_array_like(check.messages);
						for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
							let message = each_array_3[i];
							$$renderer.push(`<li${attr_class(clsx(messageColor(message)), "svelte-13wm9y8")}>`);
							push_element($$renderer, "li", 394, 40);
							if (message.severity === "warning" && check.status === "fail") {
								$$renderer.push(`<!--[0--><i class="bi bi-exclamation-triangle-fill me-1" title="Warning (does not cause the failure)">`);
								push_element($$renderer, "i", 396, 48);
								$$renderer.push(`</i>`);
								pop_element();
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> ${escape_html(message.text)}</li>`);
							pop_element();
						}
						$$renderer.push(`<!--]--></ul>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></li>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></ul>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bimiRecord.vmc) {
				$$renderer.push(`<!--[0--><hr/>`);
				push_element($$renderer, "hr", 411, 16);
				pop_element();
				$$renderer.push(` `);
				collapseHeader($$renderer, vmcOpen, "bimi-vmc-details", "Verified Mark Certificate", vmcDots(), () => vmcOpen = !vmcOpen);
				$$renderer.push(`<!----> <div id="bimi-vmc-details"${attr_class("small mt-2", void 0, { "d-none": !vmcOpen })}>`);
				push_element($$renderer, "div", 419, 16);
				if (bimiRecord.vmc.error) {
					$$renderer.push(`<!--[0--><div class="alert alert-danger py-1 px-2 mb-2 small">`);
					push_element($$renderer, "div", 421, 24);
					$$renderer.push(`${escape_html(bimiRecord.vmc.error)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (bimiRecord.vmc.subject) {
					$$renderer.push(`<!--[0--><div class="mb-1 text-truncate">`);
					push_element($$renderer, "div", 426, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 427, 28);
					$$renderer.push(`Subject:</strong>`);
					pop_element();
					$$renderer.push(` <code class="text-break"${attr("title", bimiRecord.vmc.subject)}>`);
					push_element($$renderer, "code", 428, 28);
					$$renderer.push(`${escape_html(bimiRecord.vmc.subject)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (bimiRecord.vmc.issuer) {
					$$renderer.push(`<!--[0--><div class="mb-1 text-truncate">`);
					push_element($$renderer, "div", 434, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 435, 28);
					$$renderer.push(`Issuer:</strong>`);
					pop_element();
					$$renderer.push(` <code class="text-break"${attr("title", bimiRecord.vmc.issuer)}>`);
					push_element($$renderer, "code", 436, 28);
					$$renderer.push(`${escape_html(bimiRecord.vmc.issuer)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (bimiRecord.vmc.not_before && bimiRecord.vmc.not_after) {
					$$renderer.push(`<!--[0--><div class="mb-1">`);
					push_element($$renderer, "div", 442, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 443, 28);
					$$renderer.push(`Validity:</strong>`);
					pop_element();
					$$renderer.push(` ${escape_html(formatDate(bimiRecord.vmc.not_before))} → ${escape_html(formatDate(bimiRecord.vmc.not_after))}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (bimiRecord.vmc.san_domains && bimiRecord.vmc.san_domains.length > 0) {
					$$renderer.push(`<!--[0--><div class="mb-1">`);
					push_element($$renderer, "div", 450, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 451, 28);
					$$renderer.push(`Covered domains:</strong>`);
					pop_element();
					$$renderer.push(` <!--[-->`);
					const each_array_4 = ensure_array_like(bimiRecord.vmc.san_domains);
					for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
						let san = each_array_4[$$index_4];
						$$renderer.push(`<code class="me-1">`);
						push_element($$renderer, "code", 453, 32);
						$$renderer.push(`${escape_html(san)}</code>`);
						pop_element();
					}
					$$renderer.push(`<!--]--></div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="mb-1">`);
				push_element($$renderer, "div", 457, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 458, 24);
				$$renderer.push(`BIMI Extended Key Usage:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.has_bimi_eku);
				$$renderer.push(`<!----> <strong class="ms-3">`);
				push_element($$renderer, "strong", 460, 24);
				$$renderer.push(`Embedded logo:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.has_logotype);
				$$renderer.push(`<!----> `);
				if (bimiRecord.vmc.logo_media_type) {
					$$renderer.push(`<!--[0--><span class="badge bg-secondary ms-1">`);
					push_element($$renderer, "span", 463, 28);
					$$renderer.push(`${escape_html(bimiRecord.vmc.logo_media_type)}</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (bimiRecord.vmc.logo_matches === true) {
					$$renderer.push(`<!--[0--><span class="badge bg-success ms-1">`);
					push_element($$renderer, "span", 468, 28);
					$$renderer.push(`matches published logo</span>`);
					pop_element();
				} else if (bimiRecord.vmc.logo_matches === false) {
					$$renderer.push(`<!--[1--><span class="badge bg-danger ms-1">`);
					push_element($$renderer, "span", 470, 28);
					$$renderer.push(`differs from published logo</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` <div class="mb-1">`);
				push_element($$renderer, "div", 473, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 474, 24);
				$$renderer.push(`Certified logo hash:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.logo_hash_verified, `verified${bimiRecord.vmc.logo_hash_algorithm ? ` (${bimiRecord.vmc.logo_hash_algorithm})` : ""}`, "does not cover the embedded logo");
				$$renderer.push(`<!----></div>`);
				pop_element();
				$$renderer.push(` <div class="mb-1">`);
				push_element($$renderer, "div", 485, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 486, 24);
				$$renderer.push(`Issuer Extended Key Usage:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.issuer_has_bimi_eku);
				$$renderer.push(`<!----> <strong class="ms-3">`);
				push_element($$renderer, "strong", 488, 24);
				$$renderer.push(`CRL distribution point:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.has_crl_distribution_points);
				$$renderer.push(`<!----></div>`);
				pop_element();
				$$renderer.push(` <div class="mb-1">`);
				push_element($$renderer, "div", 491, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 492, 24);
				$$renderer.push(`Certificate Transparency:</strong>`);
				pop_element();
				$$renderer.push(` `);
				presenceBadge($$renderer, bimiRecord.vmc.sct_count === void 0 ? void 0 : bimiRecord.vmc.sct_count > 0, `${bimiRecord.vmc.sct_count} signed timestamp${(bimiRecord.vmc.sct_count ?? 0) > 1 ? "s" : ""}`, "no signed timestamp");
				$$renderer.push(`<!----> `);
				if (bimiRecord.vmc.chain_trusted !== void 0) {
					$$renderer.push(`<!--[0--><strong class="ms-3">`);
					push_element($$renderer, "strong", 503, 28);
					$$renderer.push(`Issuance chain:</strong>`);
					pop_element();
					$$renderer.push(` `);
					presenceBadge($$renderer, bimiRecord.vmc.chain_trusted, "leads to a trusted BIMI root", "does not lead to a trusted BIMI root");
					$$renderer.push(`<!---->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (!bimiRecord.record && dmarcEnforced()) {
				$$renderer.push(`<!--[0--><div class="alert alert-info mt-3 mb-0">`);
				push_element($$renderer, "div", 514, 16);
				$$renderer.push(`<h6 class="alert-heading">`);
				push_element($$renderer, "h6", 515, 20);
				$$renderer.push(`<i class="bi bi-lightbulb me-1">`);
				push_element($$renderer, "i", 516, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` Explicitly decline BIMI participation</h6>`);
				pop_element();
				$$renderer.push(` <p class="mb-2 small">`);
				push_element($$renderer, "p", 519, 20);
				$$renderer.push(`If you do not intend to publish a brand logo, you can add a declination
                        record to signal that this domain deliberately opts out of BIMI. This
                        prevents mail clients from falling back to a parent-domain record:</p>`);
				pop_element();
				$$renderer.push(` <code class="d-block bg-white rounded p-2 text-break border">`);
				push_element($$renderer, "code", 524, 20);
				$$renderer.push(`${escape_html(bimiRecord.selector)}._bimi.${escape_html(bimiRecord.domain)}. IN TXT "v=BIMI1; l=; a="</code>`);
				pop_element();
				$$renderer.push(` <p class="mt-1 mb-0 small text-muted">`);
				push_element($$renderer, "p", 527, 20);
				$$renderer.push(`Declination record format as defined in § 4.3.1 of <em>`);
				push_element($$renderer, "em", 529, 24);
				$$renderer.push(`draft-brand-indicators-for-message-identification</em>`);
				pop_element();
				$$renderer.push(`.</p>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, BimiRecordDisplay);
}
BimiRecordDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/BlacklistCard.svelte
BlacklistCard[FILENAME] = "src/lib/components/BlacklistCard.svelte";
function BlacklistCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { blacklists, blacklistGrade, blacklistScore } = $$props;
		$$renderer.push(`<div class="card shadow-sm" id="rbl-details">`);
		push_element($$renderer, "div", 16, 0);
		$$renderer.push(`<div${attr_class("card-header", void 0, {
			"bg-white": store_get($$store_subs ??= {}, "$theme", theme) === "light",
			"bg-dark": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
		})}>`);
		push_element($$renderer, "div", 17, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex flex-wrap justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 18, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 19, 12);
		$$renderer.push(`<i class="bi bi-shield-exclamation me-2">`);
		push_element($$renderer, "i", 20, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Blacklist Checks</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 23, 12);
		if (blacklistScore !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(blacklistScore))}`)}>`);
			push_element($$renderer, "span", 25, 20);
			$$renderer.push(`${escape_html(blacklistScore)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (blacklistGrade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: blacklistGrade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 35, 4);
		$$renderer.push(`<div class="row row-cols-1 row-cols-lg-2 overflow-auto">`);
		push_element($$renderer, "div", 36, 8);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(Object.entries(blacklists));
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let [ip, checks] = each_array[$$index_1];
			$$renderer.push(`<div class="col mb-3">`);
			push_element($$renderer, "div", 38, 16);
			$$renderer.push(`<h5 class="text-muted">`);
			push_element($$renderer, "h5", 39, 20);
			$$renderer.push(`<i class="bi bi-hdd-network me-1">`);
			push_element($$renderer, "i", 40, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` ${escape_html(ip)}</h5>`);
			pop_element();
			$$renderer.push(` <table class="table table-sm table-striped table-hover mb-0">`);
			push_element($$renderer, "table", 43, 20);
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 44, 24);
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(checks);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let check = each_array_1[$$index];
				$$renderer.push(`<tr>`);
				push_element($$renderer, "tr", 46, 32);
				$$renderer.push(`<td${attr("title", check.response || "-")}>`);
				push_element($$renderer, "td", 47, 36);
				$$renderer.push(`<span${attr_class(`badge ${check.listed ? "bg-danger" : check.error ? "bg-dark" : "bg-success"}`)}>`);
				push_element($$renderer, "span", 48, 40);
				$$renderer.push(`${escape_html(check.error ? "Error" : check.listed ? "Listed" : "Clean")}</span>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 62, 36);
				$$renderer.push(`<code>`);
				push_element($$renderer, "code", 62, 40);
				$$renderer.push(`${escape_html(check.rbl)}</code>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, BlacklistCard);
}
BlacklistCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/ContentAnalysisCard.svelte
ContentAnalysisCard[FILENAME] = "src/lib/components/ContentAnalysisCard.svelte";
function ContentAnalysisCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { contentAnalysis, contentGrade, contentScore } = $$props;
		$$renderer.push(`<div class="card shadow-sm" id="content-details">`);
		push_element($$renderer, "div", 16, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 17, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 18, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 19, 12);
		$$renderer.push(`<i class="bi bi-file-text me-2">`);
		push_element($$renderer, "i", 20, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Content Analysis</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 23, 12);
		if (contentScore !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(contentScore))}`)}>`);
			push_element($$renderer, "span", 25, 20);
			$$renderer.push(`${escape_html(contentScore)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (contentGrade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: contentGrade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 35, 4);
		$$renderer.push(`<div class="row mb-3">`);
		push_element($$renderer, "div", 36, 8);
		$$renderer.push(`<div class="col-md-6">`);
		push_element($$renderer, "div", 37, 12);
		$$renderer.push(`<div class="d-flex align-items-center mb-2">`);
		push_element($$renderer, "div", 38, 16);
		$$renderer.push(`<i${attr_class(`bi ${contentAnalysis.has_html ? "bi-check-circle text-success" : "bi-x-circle text-muted"} me-2`)}>`);
		push_element($$renderer, "i", 39, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 44, 20);
		$$renderer.push(`HTML Part</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="d-flex align-items-center mb-2">`);
		push_element($$renderer, "div", 46, 16);
		$$renderer.push(`<i${attr_class(`bi ${contentAnalysis.has_plaintext ? "bi-check-circle text-success" : "bi-x-circle text-muted"} me-2`)}>`);
		push_element($$renderer, "i", 47, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 52, 20);
		$$renderer.push(`Plaintext Part</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (typeof contentAnalysis.has_unsubscribe_link === "boolean") {
			$$renderer.push(`<!--[0--><div class="d-flex align-items-center mb-2">`);
			push_element($$renderer, "div", 55, 20);
			$$renderer.push(`<i${attr_class(`bi ${contentAnalysis.has_unsubscribe_link ? "bi-check-circle text-success" : "bi-x-circle text-warning"} me-2`)}>`);
			push_element($$renderer, "i", 56, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <span>`);
			push_element($$renderer, "span", 61, 24);
			$$renderer.push(`Unsubscribe Link</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <div class="col-md-6">`);
		push_element($$renderer, "div", 65, 12);
		if (contentAnalysis.text_to_image_ratio !== void 0) {
			$$renderer.push(`<!--[0--><div class="mb-2">`);
			push_element($$renderer, "div", 67, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 68, 24);
			$$renderer.push(`Text to Image Ratio:</strong>`);
			pop_element();
			$$renderer.push(` <span class="ms-2">`);
			push_element($$renderer, "span", 69, 24);
			$$renderer.push(`${escape_html(contentAnalysis.text_to_image_ratio.toFixed(2))}</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (contentAnalysis.unsubscribe_methods && contentAnalysis.unsubscribe_methods.length > 0) {
			$$renderer.push(`<!--[0--><div class="mb-2">`);
			push_element($$renderer, "div", 73, 20);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 74, 24);
			$$renderer.push(`Unsubscribe Methods:</strong>`);
			pop_element();
			$$renderer.push(` <div class="mt-1">`);
			push_element($$renderer, "div", 75, 24);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(contentAnalysis.unsubscribe_methods);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let method = each_array[$$index];
				$$renderer.push(`<span class="badge bg-info me-1">`);
				push_element($$renderer, "span", 77, 32);
				$$renderer.push(`${escape_html(method)}</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (contentAnalysis.html_issues && contentAnalysis.html_issues.length > 0) {
			$$renderer.push(`<!--[0--><div class="mt-3">`);
			push_element($$renderer, "div", 86, 12);
			$$renderer.push(`<h5>`);
			push_element($$renderer, "h5", 87, 16);
			$$renderer.push(`Content Issues</h5>`);
			pop_element();
			$$renderer.push(` <!--[-->`);
			const each_array_1 = ensure_array_like(contentAnalysis.html_issues);
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				let issue = each_array_1[i];
				$$renderer.push(`<div${attr_class(`alert alert-${issue.severity === "critical" || issue.severity === "high" ? "danger" : issue.severity === "medium" ? "warning" : "info"} py-2 px-3 mb-2`)}>`);
				push_element($$renderer, "div", 89, 20);
				$$renderer.push(`<div class="d-flex justify-content-between align-items-start">`);
				push_element($$renderer, "div", 97, 24);
				$$renderer.push(`<div>`);
				push_element($$renderer, "div", 98, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 99, 32);
				$$renderer.push(`${escape_html(issue.type)}</strong>`);
				pop_element();
				$$renderer.push(` <div class="small">`);
				push_element($$renderer, "div", 100, 32);
				$$renderer.push(`${escape_html(issue.message)}</div>`);
				pop_element();
				$$renderer.push(` `);
				if (issue.location) {
					$$renderer.push(`<!--[0--><div class="small text-muted">`);
					push_element($$renderer, "div", 102, 36);
					$$renderer.push(`${escape_html(issue.location)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (issue.advice) {
					$$renderer.push(`<!--[0--><div class="small mt-1">`);
					push_element($$renderer, "div", 105, 36);
					$$renderer.push(`<i class="bi bi-lightbulb me-1">`);
					push_element($$renderer, "i", 106, 40);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` ${escape_html(issue.advice)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-secondary">`);
				push_element($$renderer, "span", 111, 28);
				$$renderer.push(`${escape_html(issue.severity)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (contentAnalysis.links && contentAnalysis.links.length > 0) {
			$$renderer.push(`<!--[0--><div class="mt-3">`);
			push_element($$renderer, "div", 119, 12);
			$$renderer.push(`<h5>`);
			push_element($$renderer, "h5", 120, 16);
			$$renderer.push(`Links (${escape_html(contentAnalysis.links.length)})</h5>`);
			pop_element();
			$$renderer.push(` <div class="table-responsive">`);
			push_element($$renderer, "div", 121, 16);
			$$renderer.push(`<table class="table table-sm">`);
			push_element($$renderer, "table", 122, 20);
			$$renderer.push(`<thead>`);
			push_element($$renderer, "thead", 123, 24);
			$$renderer.push(`<tr>`);
			push_element($$renderer, "tr", 124, 28);
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 125, 32);
			$$renderer.push(`URL</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 126, 32);
			$$renderer.push(`Status</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 127, 32);
			$$renderer.push(`HTTP Code</th>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
			$$renderer.push(`</thead>`);
			pop_element();
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 130, 24);
			$$renderer.push(`<!--[-->`);
			const each_array_2 = ensure_array_like(contentAnalysis.links);
			for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
				let link = each_array_2[i];
				$$renderer.push(`<tr>`);
				push_element($$renderer, "tr", 132, 32);
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 133, 36);
				$$renderer.push(`<small class="text-break">`);
				push_element($$renderer, "small", 134, 40);
				$$renderer.push(`${escape_html(link.url)}</small>`);
				pop_element();
				$$renderer.push(` `);
				if (link.is_shortened) {
					$$renderer.push(`<!--[0--><span class="badge bg-warning ms-1">`);
					push_element($$renderer, "span", 136, 44);
					$$renderer.push(`Shortened</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 139, 36);
				$$renderer.push(`<span${attr_class(`badge ${link.status === "valid" ? "bg-success" : link.status === "broken" ? "bg-danger" : "bg-warning"}`)}>`);
				push_element($$renderer, "span", 140, 40);
				$$renderer.push(`${escape_html(link.status)}</span>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 150, 36);
				$$renderer.push(`${escape_html(link.http_code || "-")}</td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (contentAnalysis.images && contentAnalysis.images.length > 0) {
			$$renderer.push(`<!--[0--><div class="mt-3">`);
			push_element($$renderer, "div", 160, 12);
			$$renderer.push(`<h5>`);
			push_element($$renderer, "h5", 161, 16);
			$$renderer.push(`Images (${escape_html(contentAnalysis.images.length)})</h5>`);
			pop_element();
			$$renderer.push(` <div class="table-responsive">`);
			push_element($$renderer, "div", 162, 16);
			$$renderer.push(`<table class="table table-sm">`);
			push_element($$renderer, "table", 163, 20);
			$$renderer.push(`<thead>`);
			push_element($$renderer, "thead", 164, 24);
			$$renderer.push(`<tr>`);
			push_element($$renderer, "tr", 165, 28);
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 166, 32);
			$$renderer.push(`Source</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 167, 32);
			$$renderer.push(`Alt Text</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 168, 32);
			$$renderer.push(`Tracking</th>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
			$$renderer.push(`</thead>`);
			pop_element();
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 171, 24);
			$$renderer.push(`<!--[-->`);
			const each_array_3 = ensure_array_like(contentAnalysis.images);
			for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
				let image = each_array_3[i];
				$$renderer.push(`<tr>`);
				push_element($$renderer, "tr", 173, 32);
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 174, 36);
				$$renderer.push(`<small class="text-break">`);
				push_element($$renderer, "small", 174, 40);
				$$renderer.push(`${escape_html(image.src || "-")}</small>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 175, 36);
				if (image.has_alt) {
					$$renderer.push(`<!--[0--><i class="bi bi-check-circle text-success me-1">`);
					push_element($$renderer, "i", 177, 44);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <small>`);
					push_element($$renderer, "small", 178, 44);
					$$renderer.push(`${escape_html(image.alt_text || "Present")}</small>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><i class="bi bi-x-circle text-warning me-1">`);
					push_element($$renderer, "i", 180, 44);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <small class="text-muted">`);
					push_element($$renderer, "small", 181, 44);
					$$renderer.push(`Missing</small>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 184, 36);
				if (image.is_tracking_pixel) {
					$$renderer.push(`<!--[0--><span class="badge bg-info">`);
					push_element($$renderer, "span", 186, 44);
					$$renderer.push(`Tracking Pixel</span>`);
					pop_element();
				} else $$renderer.push(`<!--[-1-->-`);
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, ContentAnalysisCard);
}
ContentAnalysisCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/DkimRecordsDisplay.svelte
DkimRecordsDisplay[FILENAME] = "src/lib/components/DkimRecordsDisplay.svelte";
function DkimRecordsDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { dkimRecords } = $$props;
		const dkimIsValid = derived(() => dkimRecords?.reduce((acc, r) => acc && r.valid, true) ?? false);
		$$renderer.push(`<div class="card mb-4">`);
		push_element($$renderer, "div", 14, 0);
		$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "div", 15, 4);
		$$renderer.push(`<h5 class="text-muted mb-0">`);
		push_element($$renderer, "h5", 16, 8);
		$$renderer.push(`<i${attr_class("bi", void 0, {
			"bi-check-circle-fill": dkimIsValid(),
			"text-success": dkimIsValid(),
			"bi-x-circle-fill": !dkimIsValid(),
			"text-danger": !dkimIsValid()
		})}>`);
		push_element($$renderer, "i", 17, 12);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` DomainKeys Identified Mail</h5>`);
		pop_element();
		$$renderer.push(` <span class="badge bg-secondary">`);
		push_element($$renderer, "span", 26, 8);
		$$renderer.push(`DKIM</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 28, 4);
		$$renderer.push(`<p class="card-text small text-muted mb-0">`);
		push_element($$renderer, "p", 29, 8);
		$$renderer.push(`DKIM cryptographically signs your emails, proving they haven't been tampered with in
            transit. Receiving servers verify this signature against your DNS records.</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="list-group list-group-flush">`);
		push_element($$renderer, "div", 34, 4);
		if (dkimRecords && dkimRecords.length > 0) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(dkimRecords);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let dkim = each_array[i];
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 37, 16);
				$$renderer.push(`<div class="mb-2">`);
				push_element($$renderer, "div", 38, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 39, 24);
				$$renderer.push(`Selector:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 39, 51);
				$$renderer.push(`${escape_html(dkim.selector)}</code>`);
				pop_element();
				$$renderer.push(` <strong class="ms-3">`);
				push_element($$renderer, "strong", 40, 24);
				$$renderer.push(`Domain:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 40, 62);
				$$renderer.push(`${escape_html(dkim.domain)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` <div class="mb-2">`);
				push_element($$renderer, "div", 42, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 43, 24);
				$$renderer.push(`Status:</strong>`);
				pop_element();
				$$renderer.push(` `);
				if (dkim.valid) {
					$$renderer.push(`<!--[0--><span class="badge bg-success">`);
					push_element($$renderer, "span", 45, 28);
					$$renderer.push(`Valid</span>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
					push_element($$renderer, "span", 47, 28);
					$$renderer.push(`Invalid</span>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` `);
				if (dkim.record) {
					$$renderer.push(`<!--[0--><div class="mb-2">`);
					push_element($$renderer, "div", 51, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 52, 28);
					$$renderer.push(`Record:</strong>`);
					pop_element();
					$$renderer.push(`<br/>`);
					push_element($$renderer, "br", 52, 52);
					pop_element();
					$$renderer.push(` <code class="d-block mt-1 text-break small text-truncate">`);
					push_element($$renderer, "code", 53, 28);
					$$renderer.push(`${escape_html(dkim.record)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (dkim.error) {
					$$renderer.push(`<!--[0--><div class="text-danger">`);
					push_element($$renderer, "div", 59, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 60, 28);
					$$renderer.push(`Error:</strong>`);
					pop_element();
					$$renderer.push(` ${escape_html(dkim.error)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><div class="list-group-item text-muted">`);
			push_element($$renderer, "div", 67, 12);
			$$renderer.push(`<i class="bi bi-exclamation-octagon me-2">`);
			push_element($$renderer, "i", 68, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` No DKIM signatures found in this email. DKIM provides cryptographic authentication and
                helps avoid spoofing, thus improving deliverability.</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, DkimRecordsDisplay);
}
DkimRecordsDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/DmarcRecordDisplay.svelte
DmarcRecordDisplay[FILENAME] = "src/lib/components/DmarcRecordDisplay.svelte";
function DmarcRecordDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { dmarcRecord, fromDomain } = $$props;
		const isFallback = derived(() => !!dmarcRecord?.domain && !!fromDomain && dmarcRecord.domain !== fromDomain);
		const isPsdFallback = derived(() => isFallback() && !dmarcRecord?.domain?.includes("."));
		const policyStrength = (policy) => {
			return {
				none: 0,
				quarantine: 1,
				reject: 2
			}[policy || "none"] || 0;
		};
		if (dmarcRecord) {
			$$renderer.push(`<!--[0--><div class="card mb-4" id="dns-dmarc">`);
			push_element($$renderer, "div", 25, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 26, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 27, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": dmarcRecord.valid && dmarcRecord.policy != "none",
				"text-success": dmarcRecord.valid && dmarcRecord.policy != "none",
				"bi-arrow-up-circle-fill": dmarcRecord.valid && dmarcRecord.policy == "none",
				"text-warning": dmarcRecord.valid && dmarcRecord.policy == "none",
				"bi-x-circle-fill": !dmarcRecord.valid,
				"text-danger": !dmarcRecord.valid
			})}>`);
			push_element($$renderer, "i", 28, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Domain-based Message Authentication</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 40, 12);
			$$renderer.push(`DMARC</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 42, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-2">`);
			push_element($$renderer, "p", 43, 12);
			$$renderer.push(`DMARC enforces domain alignment requirements (regardless of the policy). It builds
                on SPF and DKIM by telling receiving servers what to do with emails that fail
                authentication checks. It also enables reporting so you can monitor your email
                security.</p>`);
			pop_element();
			$$renderer.push(` <hr/>`);
			push_element($$renderer, "hr", 50, 12);
			pop_element();
			$$renderer.push(` <div class="mb-2">`);
			push_element($$renderer, "div", 53, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 54, 16);
			$$renderer.push(`Status:</strong>`);
			pop_element();
			$$renderer.push(` `);
			if (dmarcRecord.valid) {
				$$renderer.push(`<!--[0--><span class="badge bg-success">`);
				push_element($$renderer, "span", 56, 20);
				$$renderer.push(`Valid</span>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
				push_element($$renderer, "span", 58, 20);
				$$renderer.push(`Invalid</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` `);
			if (isFallback()) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 64, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 65, 20);
				$$renderer.push(`Record found at:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 66, 20);
				$$renderer.push(`${escape_html(dmarcRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-info mt-2 mb-0 small">`);
				push_element($$renderer, "div", 67, 20);
				$$renderer.push(`<i class="bi bi-info-circle me-1">`);
				push_element($$renderer, "i", 68, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` No DMARC record exists for <code>`);
				push_element($$renderer, "code", 69, 51);
				$$renderer.push(`${escape_html(fromDomain)}</code>`);
				pop_element();
				$$renderer.push(`. The record above was
                        inherited from `);
				if (isPsdFallback()) {
					$$renderer.push(`<!--[0-->the Public Suffix Domain <code>`);
					push_element($$renderer, "code", 72, 53);
					$$renderer.push(`${escape_html(dmarcRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(` via the DMARCbis
                            DNS Tree Walk (which obsoletes the RFC 9091 PSD DMARC experiment).`);
				} else {
					$$renderer.push(`<!--[-1-->the organizational domain <code>`);
					push_element($$renderer, "code", 75, 54);
					$$renderer.push(`${escape_html(dmarcRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(` via the DMARCbis
                            DNS Tree Walk (compatible with RFC 7489 organizational domain fallback).`);
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.policy) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 84, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 85, 20);
				$$renderer.push(`Policy:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.policy === "reject" ? "bg-success" : dmarcRecord.policy === "quarantine" ? "bg-warning" : "bg-secondary"}`)}>`);
				push_element($$renderer, "span", 86, 20);
				$$renderer.push(`${escape_html(dmarcRecord.policy)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (dmarcRecord.policy === "reject") {
					$$renderer.push(`<!--[0--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 96, 24);
					$$renderer.push(`<i class="bi bi-shield-check me-1">`);
					push_element($$renderer, "i", 97, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 98, 28);
					$$renderer.push(`Maximum protection</strong>`);
					pop_element();
					$$renderer.push(` — emails failing DMARC checks are rejected.
                            This provides the strongest defense against spoofing and phishing.</div>`);
					pop_element();
				} else if (dmarcRecord.policy === "quarantine") {
					$$renderer.push(`<!--[1--><div class="alert alert-info mt-2 mb-0 small">`);
					push_element($$renderer, "div", 102, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 103, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 104, 28);
					$$renderer.push(`Good protection</strong>`);
					pop_element();
					$$renderer.push(` — emails failing DMARC checks are
                            quarantined (sent to spam). This is a safe middle ground.<br/>`);
					push_element($$renderer, "br", 105, 85);
					pop_element();
					$$renderer.push(` <i class="bi bi-arrow-up-circle me-1">`);
					push_element($$renderer, "i", 106, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` Once you've validated your configuration and ensured all legitimate mail
                            passes, consider upgrading to <code>`);
					push_element($$renderer, "code", 108, 58);
					$$renderer.push(`p=reject</code>`);
					pop_element();
					$$renderer.push(` for maximum protection.</div>`);
					pop_element();
				} else if (dmarcRecord.policy === "none") {
					$$renderer.push(`<!--[2--><div class="alert alert-warning mt-2 mb-0 small">`);
					push_element($$renderer, "div", 111, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 112, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 113, 28);
					$$renderer.push(`Monitoring only</strong>`);
					pop_element();
					$$renderer.push(` — emails failing DMARC are delivered
                            normally. This is only recommended during initial setup.<br/>`);
					push_element($$renderer, "br", 114, 84);
					pop_element();
					$$renderer.push(` <i class="bi bi-arrow-up-circle me-1">`);
					push_element($$renderer, "i", 115, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` After monitoring reports, upgrade to <code>`);
					push_element($$renderer, "code", 116, 65);
					$$renderer.push(`p=quarantine</code>`);
					pop_element();
					$$renderer.push(` or <code>`);
					push_element($$renderer, "code", 117, 28);
					$$renderer.push(`p=reject</code>`);
					pop_element();
					$$renderer.push(` to actively protect your domain.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-danger mt-2 mb-0 small">`);
					push_element($$renderer, "div", 120, 24);
					$$renderer.push(`<i class="bi bi-x-circle me-1">`);
					push_element($$renderer, "i", 121, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 122, 28);
					$$renderer.push(`Unknown policy</strong>`);
					pop_element();
					$$renderer.push(` — the policy value is not recognized. Valid
                            options are: none, quarantine, or reject.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.test_mode) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 131, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 132, 20);
				$$renderer.push(`Test Mode:</strong>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-warning">`);
				push_element($$renderer, "span", 133, 20);
				$$renderer.push(`t=y (active)</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-warning mt-2 mb-0 small">`);
				push_element($$renderer, "div", 134, 20);
				$$renderer.push(`<i class="bi bi-flask me-1">`);
				push_element($$renderer, "i", 135, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 136, 24);
				$$renderer.push(`Test mode active</strong>`);
				pop_element();
				$$renderer.push(` — DMARCbis-compliant receivers will
                        downgrade the effective policy one level: `);
				if (dmarcRecord.policy === "reject") {
					$$renderer.push(`<!--[0--><code>`);
					push_element($$renderer, "code", 139, 28);
					$$renderer.push(`p=reject</code>`);
					pop_element();
					$$renderer.push(` is applied as <code>`);
					push_element($$renderer, "code", 139, 64);
					$$renderer.push(`p=quarantine</code>`);
					pop_element();
					$$renderer.push(`.`);
				} else if (dmarcRecord.policy === "quarantine") {
					$$renderer.push(`<!--[1--><code>`);
					push_element($$renderer, "code", 141, 28);
					$$renderer.push(`p=quarantine</code>`);
					pop_element();
					$$renderer.push(` is applied as <code>`);
					push_element($$renderer, "code", 141, 68);
					$$renderer.push(`p=none</code>`);
					pop_element();
					$$renderer.push(` (no action taken).`);
				} else {
					$$renderer.push(`<!--[-1--><code>`);
					push_element($$renderer, "code", 143, 28);
					$$renderer.push(`p=none</code>`);
					pop_element();
					$$renderer.push(` is unaffected by test mode.`);
				}
				$$renderer.push(`<!--]--> Aggregate reports are still generated normally. This tag replaces the deprecated <code>`);
				push_element($$renderer, "code", 146, 24);
				$$renderer.push(`pct=</code>`);
				pop_element();
				$$renderer.push(` for gradual rollout.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.psd === "y") {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 153, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 154, 20);
				$$renderer.push(`Public Suffix Domain:</strong>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-info">`);
				push_element($$renderer, "span", 155, 20);
				$$renderer.push(`psd=y</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-info mt-2 mb-0 small">`);
				push_element($$renderer, "div", 156, 20);
				$$renderer.push(`<i class="bi bi-info-circle me-1">`);
				push_element($$renderer, "i", 157, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 158, 24);
				$$renderer.push(`PSD declared</strong>`);
				pop_element();
				$$renderer.push(` — this domain is declared as a Public Suffix Domain.
                        DMARCbis-compliant receivers will apply this policy to subdomains that have no
                        DMARC record of their own when using the DNS Tree Walk algorithm.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else if (dmarcRecord.psd === "n") {
				$$renderer.push(`<!--[1--><div class="mb-3">`);
				push_element($$renderer, "div", 164, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 165, 20);
				$$renderer.push(`Organizational Domain Boundary:</strong>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-info">`);
				push_element($$renderer, "span", 166, 20);
				$$renderer.push(`psd=n</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-info mt-2 mb-0 small">`);
				push_element($$renderer, "div", 167, 20);
				$$renderer.push(`<i class="bi bi-info-circle me-1">`);
				push_element($$renderer, "i", 168, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 169, 24);
				$$renderer.push(`Org Domain declared</strong>`);
				pop_element();
				$$renderer.push(` — <code>`);
				push_element($$renderer, "code", 169, 63);
				$$renderer.push(`psd=n</code>`);
				pop_element();
				$$renderer.push(` explicitly declares
                        this as an Organizational Domain boundary. Subdomains with separate DNS delegation
                        will use their own independent DMARCbis Tree Walk.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.subdomain_policy) {
				$$renderer.push("<!--[0-->");
				const mainStrength = policyStrength(dmarcRecord.policy);
				const subStrength = policyStrength(dmarcRecord.subdomain_policy);
				$$renderer.push(`<div class="mb-3">`);
				push_element($$renderer, "div", 180, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 181, 20);
				$$renderer.push(`Subdomain Policy:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.subdomain_policy === "reject" ? "bg-success" : dmarcRecord.subdomain_policy === "quarantine" ? "bg-warning" : "bg-secondary"}`)}>`);
				push_element($$renderer, "span", 182, 20);
				$$renderer.push(`${escape_html(dmarcRecord.subdomain_policy)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (subStrength >= mainStrength) {
					$$renderer.push(`<!--[0--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 192, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 193, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 194, 28);
					$$renderer.push(`Good configuration</strong>`);
					pop_element();
					$$renderer.push(` — subdomain policy is equal to or stricter
                            than main policy.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-warning mt-2 mb-0 small">`);
					push_element($$renderer, "div", 198, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 199, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 200, 28);
					$$renderer.push(`Weaker subdomain protection</strong>`);
					pop_element();
					$$renderer.push(` — consider setting <code>`);
					push_element($$renderer, "code", 201, 28);
					$$renderer.push(`sp=${escape_html(dmarcRecord.policy)}</code>`);
					pop_element();
					$$renderer.push(` to match your main policy for consistent
                            protection.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else if (dmarcRecord.policy) {
				$$renderer.push(`<!--[1--><div class="mb-3">`);
				push_element($$renderer, "div", 207, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 208, 20);
				$$renderer.push(`Subdomain Policy:</strong>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-info">`);
				push_element($$renderer, "span", 209, 20);
				$$renderer.push(`Inherits main policy</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-success mt-2 mb-0 small">`);
				push_element($$renderer, "div", 210, 20);
				$$renderer.push(`<i class="bi bi-check-circle me-1">`);
				push_element($$renderer, "i", 211, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 212, 24);
				$$renderer.push(`Good default</strong>`);
				pop_element();
				$$renderer.push(` — subdomains inherit the main policy (<code>`);
				push_element($$renderer, "code", 212, 92);
				$$renderer.push(`${escape_html(dmarcRecord.policy)}</code>`);
				pop_element();
				$$renderer.push(`) which provides consistent protection.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.nonexistent_subdomain_policy) {
				$$renderer.push("<!--[0-->");
				const effectiveSubStrength = policyStrength(dmarcRecord.subdomain_policy ?? dmarcRecord.policy);
				const npStrength = policyStrength(dmarcRecord.nonexistent_subdomain_policy);
				$$renderer.push(`<div class="mb-3">`);
				push_element($$renderer, "div", 225, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 226, 20);
				$$renderer.push(`Non-Existent Subdomain Policy:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.nonexistent_subdomain_policy === "reject" ? "bg-success" : dmarcRecord.nonexistent_subdomain_policy === "quarantine" ? "bg-warning" : "bg-secondary"}`)}>`);
				push_element($$renderer, "span", 227, 20);
				$$renderer.push(`${escape_html(dmarcRecord.nonexistent_subdomain_policy)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (npStrength >= effectiveSubStrength) {
					$$renderer.push(`<!--[0--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 237, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 238, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 239, 28);
					$$renderer.push(`Good configuration</strong>`);
					pop_element();
					$$renderer.push(` — non-existent subdomain policy is equal
                            to or stricter than the effective subdomain policy.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-warning mt-2 mb-0 small">`);
					push_element($$renderer, "div", 243, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 244, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 245, 28);
					$$renderer.push(`Weaker protection for non-existent subdomains</strong>`);
					pop_element();
					$$renderer.push(` —
                            consider setting <code>`);
					push_element($$renderer, "code", 247, 28);
					$$renderer.push(`np=${escape_html(dmarcRecord.subdomain_policy ?? dmarcRecord.policy)}</code>`);
					pop_element();
					$$renderer.push(` to match
                            your subdomain policy.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--> <div class="alert alert-info mt-2 mb-0 small">`);
				push_element($$renderer, "div", 251, 20);
				$$renderer.push(`<i class="bi bi-info-circle me-1">`);
				push_element($$renderer, "i", 252, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` The <code>`);
				push_element($$renderer, "code", 253, 28);
				$$renderer.push(`np=</code>`);
				pop_element();
				$$renderer.push(` tag is introduced by <strong>`);
				push_element($$renderer, "strong", 253, 66);
				$$renderer.push(`DMARCbis</strong>`);
				pop_element();
				$$renderer.push(` (draft-ietf-dmarc-dmarcbis),
                        a draft RFC updating RFC 7489. Support may vary across mail receivers.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.percentage !== void 0) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 261, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 262, 20);
				$$renderer.push(`Enforcement Percentage:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.percentage === 100 ? "bg-success" : dmarcRecord.percentage >= 50 ? "bg-warning" : "bg-danger"}`)}>`);
				push_element($$renderer, "span", 263, 20);
				$$renderer.push(`${escape_html(dmarcRecord.percentage)}%</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-warning mt-2 mb-0 small">`);
				push_element($$renderer, "div", 272, 20);
				$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
				push_element($$renderer, "i", 273, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 274, 24);
				$$renderer.push(`Deprecated tag</strong>`);
				pop_element();
				$$renderer.push(` — the <code>`);
				push_element($$renderer, "code", 274, 62);
				$$renderer.push(`pct=</code>`);
				pop_element();
				$$renderer.push(` tag is removed in
                        DMARCbis. Many receivers already ignore it. For gradual rollout, replace it
                        with <code>`);
				push_element($$renderer, "code", 276, 29);
				$$renderer.push(`t=y</code>`);
				pop_element();
				$$renderer.push(` (test mode); for full enforcement, simply remove <code>`);
				push_element($$renderer, "code", 277, 24);
				$$renderer.push(`pct=</code>`);
				pop_element();
				$$renderer.push(` from your record. `);
				if (dmarcRecord.percentage === 0) {
					$$renderer.push(`<!--[0--><br/>`);
					push_element($$renderer, "br", 279, 28);
					pop_element();
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 279, 34);
					$$renderer.push(`pct=0 is an anti-pattern</strong>`);
					pop_element();
					$$renderer.push(` — it was widely misused
                            as a signal to bypass DMARC entirely, which is one reason the tag was
                            removed. Use <code>`);
					push_element($$renderer, "code", 281, 41);
					$$renderer.push(`t=y</code>`);
					pop_element();
					$$renderer.push(` instead.`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` `);
				if (dmarcRecord.percentage === 100) {
					$$renderer.push(`<!--[0--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 285, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 286, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 287, 28);
					$$renderer.push(`Full enforcement</strong>`);
					pop_element();
					$$renderer.push(` — all messages are subject to DMARC policy.</div>`);
					pop_element();
				} else if (dmarcRecord.percentage > 0 && dmarcRecord.percentage >= 50) {
					$$renderer.push(`<!--[1--><div class="alert alert-warning mt-2 mb-0 small">`);
					push_element($$renderer, "div", 290, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 291, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 292, 28);
					$$renderer.push(`Partial enforcement</strong>`);
					pop_element();
					$$renderer.push(` — only ${escape_html(dmarcRecord.percentage)}% of
                            messages are subject to DMARC policy. Receivers ignoring pct= will apply
                            the full policy regardless.</div>`);
					pop_element();
				} else if (dmarcRecord.percentage > 0) {
					$$renderer.push(`<!--[2--><div class="alert alert-danger mt-2 mb-0 small">`);
					push_element($$renderer, "div", 297, 24);
					$$renderer.push(`<i class="bi bi-x-circle me-1">`);
					push_element($$renderer, "i", 298, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 299, 28);
					$$renderer.push(`Low enforcement</strong>`);
					pop_element();
					$$renderer.push(` — only ${escape_html(dmarcRecord.percentage)}% of
                            messages are protected. Receivers ignoring pct= will apply full policy.</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else if (dmarcRecord.policy) {
				$$renderer.push(`<!--[1--><div class="mb-3">`);
				push_element($$renderer, "div", 305, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 306, 20);
				$$renderer.push(`Enforcement Percentage:</strong>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-success">`);
				push_element($$renderer, "span", 307, 20);
				$$renderer.push(`100% (default)</span>`);
				pop_element();
				$$renderer.push(` <div class="alert alert-success mt-2 mb-0 small">`);
				push_element($$renderer, "div", 308, 20);
				$$renderer.push(`<i class="bi bi-check-circle me-1">`);
				push_element($$renderer, "i", 309, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 310, 24);
				$$renderer.push(`Full enforcement</strong>`);
				pop_element();
				$$renderer.push(` — all messages are subject to DMARC policy
                        by default.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.spf_alignment) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 318, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 319, 20);
				$$renderer.push(`SPF Alignment:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.spf_alignment === "strict" ? "bg-success" : "bg-info"}`)}>`);
				push_element($$renderer, "span", 320, 20);
				$$renderer.push(`${escape_html(dmarcRecord.spf_alignment)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (dmarcRecord.spf_alignment === "relaxed") {
					$$renderer.push(`<!--[0--><div class="alert alert-info mt-2 mb-0 small">`);
					push_element($$renderer, "div", 328, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 329, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 330, 28);
					$$renderer.push(`Recommended for most senders</strong>`);
					pop_element();
					$$renderer.push(` — ensures legitimate
                            subdomain mail passes.<br/>`);
					push_element($$renderer, "br", 331, 50);
					pop_element();
					$$renderer.push(` <i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 332, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` For maximum brand protection, consider strict alignment (<code>`);
					push_element($$renderer, "code", 333, 85);
					$$renderer.push(`aspf=s</code>`);
					pop_element();
					$$renderer.push(`) once your sending domains are standardized.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 338, 24);
					$$renderer.push(`<i class="bi bi-shield-check me-1">`);
					push_element($$renderer, "i", 339, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 340, 28);
					$$renderer.push(`Maximum brand protection</strong>`);
					pop_element();
					$$renderer.push(` — only exact domain matches are
                            accepted. Ensure all legitimate mail comes from the exact From domain.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.dkim_alignment) {
				$$renderer.push(`<!--[0--><div class="mb-3">`);
				push_element($$renderer, "div", 349, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 350, 20);
				$$renderer.push(`DKIM Alignment:</strong>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${dmarcRecord.dkim_alignment === "strict" ? "bg-success" : "bg-info"}`)}>`);
				push_element($$renderer, "span", 351, 20);
				$$renderer.push(`${escape_html(dmarcRecord.dkim_alignment)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (dmarcRecord.dkim_alignment === "relaxed") {
					$$renderer.push(`<!--[0--><div class="alert alert-info mt-2 mb-0 small">`);
					push_element($$renderer, "div", 359, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 360, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 361, 28);
					$$renderer.push(`Recommended for most senders</strong>`);
					pop_element();
					$$renderer.push(` — ensures legitimate
                            subdomain mail passes.<br/>`);
					push_element($$renderer, "br", 362, 50);
					pop_element();
					$$renderer.push(` <i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 363, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` For maximum brand protection, consider strict alignment (<code>`);
					push_element($$renderer, "code", 364, 85);
					$$renderer.push(`adkim=s</code>`);
					pop_element();
					$$renderer.push(`) once your sending domains are standardized.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-success mt-2 mb-0 small">`);
					push_element($$renderer, "div", 369, 24);
					$$renderer.push(`<i class="bi bi-shield-check me-1">`);
					push_element($$renderer, "i", 370, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 371, 28);
					$$renderer.push(`Maximum brand protection</strong>`);
					pop_element();
					$$renderer.push(` — only exact domain matches are
                            accepted. Ensure all DKIM signatures use the exact From domain.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.record) {
				$$renderer.push(`<!--[0--><div class="mb-2">`);
				push_element($$renderer, "div", 380, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 381, 20);
				$$renderer.push(`Record:</strong>`);
				pop_element();
				$$renderer.push(`<br/>`);
				push_element($$renderer, "br", 381, 44);
				pop_element();
				$$renderer.push(` <code class="d-block mt-1 text-break">`);
				push_element($$renderer, "code", 382, 20);
				$$renderer.push(`${escape_html(dmarcRecord.record)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.deprecated_rf || dmarcRecord.deprecated_ri) {
				$$renderer.push(`<!--[0--><div class="alert alert-warning mt-2 mb-3 small">`);
				push_element($$renderer, "div", 388, 16);
				$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
				push_element($$renderer, "i", 389, 20);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 390, 20);
				$$renderer.push(`Deprecated tags detected</strong>`);
				pop_element();
				$$renderer.push(` — your record contains `);
				if (dmarcRecord.deprecated_rf && dmarcRecord.deprecated_ri) {
					$$renderer.push(`<!--[0--><code>`);
					push_element($$renderer, "code", 392, 24);
					$$renderer.push(`rf=</code>`);
					pop_element();
					$$renderer.push(` and <code>`);
					push_element($$renderer, "code", 392, 45);
					$$renderer.push(`ri=</code>`);
					pop_element();
					$$renderer.push(` tags that are`);
				} else if (dmarcRecord.deprecated_rf) {
					$$renderer.push(`<!--[1-->the <code>`);
					push_element($$renderer, "code", 394, 28);
					$$renderer.push(`rf=</code>`);
					pop_element();
					$$renderer.push(` tag that is`);
				} else {
					$$renderer.push(`<!--[-1-->the <code>`);
					push_element($$renderer, "code", 396, 28);
					$$renderer.push(`ri=</code>`);
					pop_element();
					$$renderer.push(` tag that is`);
				}
				$$renderer.push(`<!--]--> removed in DMARCbis. Modern receivers will ignore
                    ${escape_html(dmarcRecord.deprecated_rf && dmarcRecord.deprecated_ri ? "them" : "it")}. `);
				if (dmarcRecord.deprecated_ri) {
					$$renderer.push(`<!--[0-->Aggregate reporting interval is now fixed at ≥ 24 hours regardless of <code>`);
					push_element($$renderer, "code", 402, 24);
					$$renderer.push(`ri=</code>`);
					pop_element();
					$$renderer.push(`.`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> You can safely remove
                    ${escape_html(dmarcRecord.deprecated_rf && dmarcRecord.deprecated_ri ? "these tags" : "this tag")}
                    from your DMARC record.</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dmarcRecord.error) {
				$$renderer.push(`<!--[0--><div class="text-danger">`);
				push_element($$renderer, "div", 414, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 415, 20);
				$$renderer.push(`Error:</strong>`);
				pop_element();
				$$renderer.push(` ${escape_html(dmarcRecord.error)}</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, DmarcRecordDisplay);
}
DmarcRecordDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/HeloPtrMatchDisplay.svelte
HeloPtrMatchDisplay[FILENAME] = "src/lib/components/HeloPtrMatchDisplay.svelte";
function HeloPtrMatchDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { heloHostname, ptrRecords, heloPtrMatch } = $$props;
		const normalize = (host) => host.replace(/\.$/, "").trim().toLowerCase();
		const localMatch = derived(() => !!heloHostname && !!ptrRecords && ptrRecords.some((ptr) => normalize(heloHostname) === normalize(ptr)));
		const isMatch = derived(() => heloPtrMatch ?? localMatch());
		if (heloHostname) {
			$$renderer.push(`<!--[0--><div class="card mb-4">`);
			push_element($$renderer, "div", 26, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 27, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 28, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": isMatch(),
				"text-success": isMatch(),
				"bi-x-circle-fill": !isMatch(),
				"text-danger": !isMatch()
			})}>`);
			push_element($$renderer, "i", 29, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` HELO / PTR Consistency</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 38, 12);
			$$renderer.push(`HELO</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 40, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 41, 12);
			$$renderer.push(`The HELO/EHLO hostname is the name the sending server announces when it connects.
                Many mail servers check that this name matches the sender IP's reverse DNS (PTR)
                record. A mismatch is a common spam signal and can hurt deliverability.</p>`);
			pop_element();
			$$renderer.push(` <div class="mt-2">`);
			push_element($$renderer, "div", 46, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 47, 16);
			$$renderer.push(`Announced HELO:</strong>`);
			pop_element();
			$$renderer.push(` <code>`);
			push_element($$renderer, "code", 47, 49);
			$$renderer.push(`${escape_html(heloHostname)}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (ptrRecords && ptrRecords.length > 0) {
				$$renderer.push(`<!--[0--><div class="mt-1">`);
				push_element($$renderer, "div", 50, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 51, 20);
				$$renderer.push(`PTR Hostname(s):</strong>`);
				pop_element();
				$$renderer.push(` <!--[-->`);
				const each_array = ensure_array_like(ptrRecords);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let ptr = each_array[i];
					$$renderer.push(`<div class="d-flex gap-2 align-items-center mt-1">`);
					push_element($$renderer, "div", 53, 24);
					if (normalize(heloHostname) === normalize(ptr)) {
						$$renderer.push(`<!--[0--><span class="badge bg-success">`);
						push_element($$renderer, "span", 55, 32);
						$$renderer.push(`Match</span>`);
						pop_element();
					} else {
						$$renderer.push(`<!--[-1--><span class="badge bg-secondary">`);
						push_element($$renderer, "span", 57, 32);
						$$renderer.push(`Different</span>`);
						pop_element();
					}
					$$renderer.push(`<!--]--> <code>`);
					push_element($$renderer, "code", 59, 28);
					$$renderer.push(`${escape_html(ptr)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` `);
			if (!isMatch()) {
				$$renderer.push(`<!--[0--><div class="list-group list-group-flush">`);
				push_element($$renderer, "div", 66, 12);
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 67, 16);
				$$renderer.push(`<div class="alert alert-warning mb-0">`);
				push_element($$renderer, "div", 68, 20);
				$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
				push_element($$renderer, "i", 69, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 70, 24);
				$$renderer.push(`Warning:</strong>`);
				pop_element();
				$$renderer.push(` The announced HELO hostname <code>`);
				push_element($$renderer, "code", 71, 24);
				$$renderer.push(`${escape_html(heloHostname)}</code>`);
				pop_element();
				$$renderer.push(` `);
				if (ptrRecords && ptrRecords.length > 0) {
					$$renderer.push(`<!--[0-->does not match the sender's PTR record${escape_html(ptrRecords.length > 1 ? "s" : "")}
                            (<!--[-->`);
					const each_array_1 = ensure_array_like(ptrRecords);
					for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
						let ptr = each_array_1[i];
						$$renderer.push(`<code>`);
						push_element($$renderer, "code", 74, 61);
						$$renderer.push(`${escape_html(ptr)}</code>`);
						pop_element();
						$$renderer.push(`${escape_html(i < ptrRecords.length - 1 ? ", " : "")}`);
					}
					$$renderer.push(`<!--]-->).`);
				} else $$renderer.push(`<!--[-1-->could not be matched against a PTR record.`);
				$$renderer.push(`<!--]--> Configuring the HELO name to match reverse DNS improves deliverability.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, HeloPtrMatchDisplay);
}
HeloPtrMatchDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/HeloSpfRecordDisplay.svelte
HeloSpfRecordDisplay[FILENAME] = "src/lib/components/HeloSpfRecordDisplay.svelte";
function HeloSpfRecordDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { heloSpfRecord, senderDomain, senderOrgDomain } = $$props;
		const hasPolicy = derived(() => !!heloSpfRecord?.valid);
		const normalize = (host) => host.replace(/\.$/, "").trim().toLowerCase();
		const ownInfrastructure = derived(() => {
			const helo = heloSpfRecord?.domain;
			if (!helo) return false;
			const announced = normalize(helo);
			return [senderDomain, senderOrgDomain].filter((domain) => !!domain).map(normalize).some((domain) => announced === domain || announced.endsWith(`.${domain}`));
		});
		const suggestedRecord = derived(() => `${heloSpfRecord?.domain}. IN TXT "v=spf1 a -all"`);
		if (heloSpfRecord) {
			$$renderer.push(`<!--[0--><div class="card mb-4" id="dns-helo-spf">`);
			push_element($$renderer, "div", 42, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 43, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 44, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": hasPolicy(),
				"text-success": hasPolicy(),
				"bi-info-circle-fill": !hasPolicy(),
				"text-info": !hasPolicy()
			})}>`);
			push_element($$renderer, "i", 45, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` SPF for the HELO Hostname</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 54, 12);
			$$renderer.push(`SPF</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 56, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 57, 12);
			$$renderer.push(`SPF can authenticate, in addition to the envelope sender, the hostname the sending
                server announces at HELO. <a href="https://www.rfc-editor.org/rfc/rfc7208.html#section-2.3" target="_blank" rel="noreferrer">`);
			push_element($$renderer, "a", 60, 16);
			$$renderer.push(`RFC 7208, section 2.3</a>`);
			pop_element();
			$$renderer.push(` recommends that receivers check that identity, and notes that records published for it <q>`);
			push_element($$renderer, "q", 66, 16);
			$$renderer.push(`refer to a single host</q>`);
			pop_element();
			$$renderer.push(` and are therefore <q>`);
			push_element($$renderer, "q", 68, 16);
			$$renderer.push(`a very reliable source of host authorization status</q>`);
			pop_element();
			$$renderer.push(`. It also matters for
                bounce messages: their envelope sender is empty, so <a href="https://www.rfc-editor.org/rfc/rfc7208.html#section-2.4" target="_blank" rel="noreferrer">`);
			push_element($$renderer, "a", 70, 16);
			$$renderer.push(`section 2.4</a>`);
			pop_element();
			$$renderer.push(` has receivers check <code>`);
			push_element($$renderer, "code", 75, 36);
			$$renderer.push(`postmaster@</code>`);
			pop_element();
			$$renderer.push(` the HELO name instead, making it the only
                identity SPF can evaluate there. Publishing such a policy stays optional: this check never
                affects your score.</p>`);
			pop_element();
			$$renderer.push(` `);
			if (heloSpfRecord.domain) {
				$$renderer.push(`<!--[0--><div class="mt-2">`);
				push_element($$renderer, "div", 80, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 81, 20);
				$$renderer.push(`Announced HELO:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 81, 53);
				$$renderer.push(`${escape_html(heloSpfRecord.domain)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="mt-1">`);
			push_element($$renderer, "div", 84, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 85, 16);
			$$renderer.push(`Record:</strong>`);
			pop_element();
			$$renderer.push(` `);
			if (heloSpfRecord.record) {
				$$renderer.push(`<!--[0--><code class="text-break">`);
				push_element($$renderer, "code", 87, 20);
				$$renderer.push(`${escape_html(heloSpfRecord.record)}</code>`);
				pop_element();
			} else $$renderer.push(`<!--[-1-->${escape_html(heloSpfRecord.error ?? "no record published")}`);
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 95, 8);
			$$renderer.push(`<div class="list-group-item">`);
			push_element($$renderer, "div", 96, 12);
			if (hasPolicy()) {
				$$renderer.push(`<!--[0--><div class="alert alert-success mb-0">`);
				push_element($$renderer, "div", 98, 20);
				$$renderer.push(`<i class="bi bi-check-circle me-1">`);
				push_element($$renderer, "i", 99, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` This hostname publishes its own SPF policy, so receivers can authenticate the
                        HELO identity as well as the envelope sender.</div>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><div class="alert alert-info mb-0">`);
				push_element($$renderer, "div", 104, 20);
				$$renderer.push(`<i class="bi bi-info-circle me-1">`);
				push_element($$renderer, "i", 105, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 106, 24);
				$$renderer.push(`Recommendation:</strong>`);
				pop_element();
				$$renderer.push(` `);
				if (heloSpfRecord.record && ownInfrastructure()) {
					$$renderer.push(`<!--[0-->fix the policy published for <code>`);
					push_element($$renderer, "code", 108, 57);
					$$renderer.push(`${escape_html(heloSpfRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(`, which
                            could not be validated (${escape_html(heloSpfRecord.error)}). Receivers could then
                            authenticate the HELO identity as well as the envelope sender.`);
				} else if (heloSpfRecord.record) {
					$$renderer.push(`<!--[1-->report to your email provider that the policy published for <code>`);
					push_element($$renderer, "code", 113, 28);
					$$renderer.push(`${escape_html(heloSpfRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(` could not be validated (${escape_html(heloSpfRecord.error)}). That hostname belongs to
                            the infrastructure that relayed your message, so only its operator can
                            fix it.`);
				} else if (ownInfrastructure()) {
					$$renderer.push(`<!--[2-->publish a policy for <code>`);
					push_element($$renderer, "code", 118, 49);
					$$renderer.push(`${escape_html(heloSpfRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(` too. That hostname
                            is part of your own domain, so you can add the record yourself:`);
				} else {
					$$renderer.push(`<!--[-1-->ask your email provider to publish a policy for <code>`);
					push_element($$renderer, "code", 122, 28);
					$$renderer.push(`${escape_html(heloSpfRecord.domain)}</code>`);
					pop_element();
					$$renderer.push(`. That hostname belongs to the
                            infrastructure that relayed your message, not to your domain, so only
                            its operator can add the record:`);
				}
				$$renderer.push(`<!--]--> `);
				if (!heloSpfRecord.record) {
					$$renderer.push(`<!--[0--><pre class="mb-0 mt-2">`);
					push_element($$renderer, "pre", 127, 28);
					$$renderer.push(`<code class="text-break">`);
					push_element($$renderer, "code", 127, 51);
					$$renderer.push(`${escape_html(suggestedRecord())}</code>`);
					pop_element();
					$$renderer.push(`</pre>`);
					pop_element();
					$$renderer.push(` <div class="small mt-2">`);
					push_element($$renderer, "div", 129, 28);
					$$renderer.push(`The <code>`);
					push_element($$renderer, "code", 130, 36);
					$$renderer.push(`a</code>`);
					pop_element();
					$$renderer.push(` mechanism authorizes the address the hostname
                                itself resolves to, so the record stays correct if the server
                                changes IP. It assumes that hostname resolves: if the lookup above
                                failed instead of reporting no policy, the missing A/AAAA record is
                                what to publish first, as <code>`);
					push_element($$renderer, "code", 134, 58);
					$$renderer.push(`a</code>`);
					pop_element();
					$$renderer.push(` would otherwise match nothing.</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, HeloSpfRecordDisplay);
}
HeloSpfRecordDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/MxRecordsDisplay.svelte
MxRecordsDisplay[FILENAME] = "src/lib/components/MxRecordsDisplay.svelte";
function MxRecordsDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { class: className, mxRecords, title, description } = $$props;
		let mxsAreValids = derived(() => mxRecords.reduce((acc, r) => acc && r.valid, true));
		$$renderer.push(`<div${attr_class(`card ${stringify(className)}`)}>`);
		push_element($$renderer, "div", 18, 0);
		$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "div", 19, 4);
		$$renderer.push(`<h5 class="text-muted mb-0">`);
		push_element($$renderer, "h5", 20, 8);
		$$renderer.push(`<i${attr_class("bi", void 0, {
			"bi-check-circle-fill": mxsAreValids(),
			"text-success": mxsAreValids(),
			"bi-x-circle-fill": !mxsAreValids(),
			"text-danger": !mxsAreValids()
		})}>`);
		push_element($$renderer, "i", 21, 12);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` ${escape_html(title)}</h5>`);
		pop_element();
		$$renderer.push(` <span class="badge bg-secondary">`);
		push_element($$renderer, "span", 30, 8);
		$$renderer.push(`MX</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 32, 4);
		if (description) {
			$$renderer.push(`<!--[0--><p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 34, 12);
			$$renderer.push(`${escape_html(description)}</p>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <div class="list-group list-group-flush">`);
		push_element($$renderer, "div", 37, 4);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(mxRecords);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let mx = each_array[i];
			$$renderer.push(`<div class="list-group-item">`);
			push_element($$renderer, "div", 39, 12);
			$$renderer.push(`<div class="d-flex gap-2 align-items-center">`);
			push_element($$renderer, "div", 40, 16);
			if (mx.valid) {
				$$renderer.push(`<!--[0--><span class="badge bg-success">`);
				push_element($$renderer, "span", 42, 24);
				$$renderer.push(`Valid</span>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
				push_element($$renderer, "span", 44, 24);
				$$renderer.push(`Invalid</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--> <div>`);
			push_element($$renderer, "div", 46, 20);
			$$renderer.push(`Host: <code>`);
			push_element($$renderer, "code", 46, 31);
			$$renderer.push(`${escape_html(mx.host)}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 47, 20);
			$$renderer.push(`Priority: <strong>`);
			push_element($$renderer, "strong", 47, 35);
			$$renderer.push(`${escape_html(mx.priority)}</strong>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (mx.error) {
				$$renderer.push(`<!--[0--><small class="text-danger">`);
				push_element($$renderer, "small", 50, 20);
				$$renderer.push(`${escape_html(mx.error)}</small>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, MxRecordsDisplay);
}
MxRecordsDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/PtrForwardRecordsDisplay.svelte
PtrForwardRecordsDisplay[FILENAME] = "src/lib/components/PtrForwardRecordsDisplay.svelte";
function PtrForwardRecordsDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ptrRecords, ptrForwardRecords, senderIp } = $$props;
		const fcrDnsIsValid = derived(() => ptrRecords && ptrRecords.length > 0 && ptrForwardRecords && ptrForwardRecords.length > 0 && senderIp && ptrForwardRecords.includes(senderIp));
		const hasForwardRecords = derived(() => ptrForwardRecords && ptrForwardRecords.length > 0);
		let showDifferent = false;
		const differentCount = derived(() => ptrForwardRecords ? ptrForwardRecords.filter((ip) => ip !== senderIp).length : 0);
		if (ptrRecords && ptrRecords.length > 0) {
			$$renderer.push(`<!--[0--><div class="card mb-4">`);
			push_element($$renderer, "div", 32, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 33, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 34, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": fcrDnsIsValid(),
				"text-success": fcrDnsIsValid(),
				"bi-x-circle-fill": !fcrDnsIsValid(),
				"text-danger": !fcrDnsIsValid()
			})}>`);
			push_element($$renderer, "i", 35, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Forward-Confirmed Reverse DNS</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 44, 12);
			$$renderer.push(`FCrDNS</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 46, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 47, 12);
			$$renderer.push(`Forward-confirmed reverse DNS (FCrDNS) verifies that the PTR hostname resolves back
                to the original sender IP. This double-check helps establish sender legitimacy.</p>`);
			pop_element();
			$$renderer.push(` `);
			if (senderIp) {
				$$renderer.push(`<!--[0--><div class="mt-2">`);
				push_element($$renderer, "div", 52, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 53, 20);
				$$renderer.push(`Original Sender IP:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 53, 57);
				$$renderer.push(`${escape_html(senderIp)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` `);
			if (hasForwardRecords()) {
				$$renderer.push(`<!--[0--><div class="list-group list-group-flush">`);
				push_element($$renderer, "div", 58, 12);
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 59, 16);
				$$renderer.push(`<div class="mb-2">`);
				push_element($$renderer, "div", 60, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 61, 24);
				$$renderer.push(`PTR Hostname(s):</strong>`);
				pop_element();
				$$renderer.push(` <!--[-->`);
				const each_array = ensure_array_like(ptrRecords);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let ptr = each_array[i];
					$$renderer.push(`<div class="mt-1">`);
					push_element($$renderer, "div", 63, 28);
					$$renderer.push(`<code>`);
					push_element($$renderer, "code", 64, 32);
					$$renderer.push(`${escape_html(ptr)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` <div class="mb-2">`);
				push_element($$renderer, "div", 68, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 69, 24);
				$$renderer.push(`Forward Resolution (A/AAAA):</strong>`);
				pop_element();
				$$renderer.push(` <!--[-->`);
				const each_array_1 = ensure_array_like(ptrForwardRecords);
				for (let j = 0, $$length = each_array_1.length; j < $$length; j++) {
					let ip = each_array_1[j];
					if (ip === senderIp || !fcrDnsIsValid() || showDifferent) {
						$$renderer.push(`<!--[0--><div class="d-flex gap-2 align-items-center mt-1">`);
						push_element($$renderer, "div", 72, 32);
						if (senderIp && ip === senderIp) {
							$$renderer.push(`<!--[0--><span class="badge bg-success">`);
							push_element($$renderer, "span", 74, 40);
							$$renderer.push(`Match</span>`);
							pop_element();
						} else {
							$$renderer.push(`<!--[-1--><span class="badge bg-secondary">`);
							push_element($$renderer, "span", 76, 40);
							$$renderer.push(`Different</span>`);
							pop_element();
						}
						$$renderer.push(`<!--]--> <code>`);
						push_element($$renderer, "code", 78, 36);
						$$renderer.push(`${escape_html(ip)}</code>`);
						pop_element();
						$$renderer.push(`</div>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--> `);
				if (fcrDnsIsValid() && differentCount() > 0) {
					$$renderer.push(`<!--[0--><div class="mt-1">`);
					push_element($$renderer, "div", 83, 28);
					$$renderer.push(`<button class="btn btn-link btn-sm p-0 text-muted">`);
					push_element($$renderer, "button", 84, 32);
					$$renderer.push(`<!--[-1-->Show ${escape_html(differentCount())} other IP${escape_html(differentCount() > 1 ? "s" : "")} (not the sender)`);
					$$renderer.push(`<!--]--></button>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` `);
				if (fcrDnsIsValid()) {
					$$renderer.push(`<!--[0--><div class="alert alert-success mb-0 mt-2">`);
					push_element($$renderer, "div", 100, 24);
					$$renderer.push(`<i class="bi bi-check-circle me-1">`);
					push_element($$renderer, "i", 101, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 102, 28);
					$$renderer.push(`Success:</strong>`);
					pop_element();
					$$renderer.push(` Forward-confirmed reverse DNS is properly configured.
                            The PTR hostname resolves back to the sender IP.</div>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><div class="alert alert-warning mb-0 mt-2">`);
					push_element($$renderer, "div", 106, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 107, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 108, 28);
					$$renderer.push(`Warning:</strong>`);
					pop_element();
					$$renderer.push(` The PTR hostname does not resolve back to the sender
                            IP. This may impact deliverability.</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><div class="list-group list-group-flush">`);
				push_element($$renderer, "div", 115, 12);
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 116, 16);
				$$renderer.push(`<div class="alert alert-danger mb-0">`);
				push_element($$renderer, "div", 117, 20);
				$$renderer.push(`<i class="bi bi-x-circle me-1">`);
				push_element($$renderer, "i", 118, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 119, 24);
				$$renderer.push(`Error:</strong>`);
				pop_element();
				$$renderer.push(` PTR hostname(s) found but could not resolve to any IP
                        addresses. Check your DNS configuration.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, PtrForwardRecordsDisplay);
}
PtrForwardRecordsDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/PtrRecordsDisplay.svelte
PtrRecordsDisplay[FILENAME] = "src/lib/components/PtrRecordsDisplay.svelte";
function PtrRecordsDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ptrRecords, senderIp } = $$props;
		const ptrIsValid = derived(() => ptrRecords && ptrRecords.length > 0);
		if (ptrRecords && ptrRecords.length > 0) {
			$$renderer.push(`<!--[0--><div class="card mb-4" id="dns-ptr">`);
			push_element($$renderer, "div", 14, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 15, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 16, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": ptrIsValid(),
				"text-success": ptrIsValid(),
				"bi-x-circle-fill": !ptrIsValid(),
				"text-danger": !ptrIsValid()
			})}>`);
			push_element($$renderer, "i", 17, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Reverse DNS</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 26, 12);
			$$renderer.push(`PTR</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 28, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 29, 12);
			$$renderer.push(`PTR (pointer record), also known as reverse DNS maps IP addresses back to hostnames.
                Having proper PTR records is important as many mail servers verify that the sending
                IP has a valid reverse DNS entry.</p>`);
			pop_element();
			$$renderer.push(` `);
			if (senderIp) {
				$$renderer.push(`<!--[0--><div class="mt-2">`);
				push_element($$renderer, "div", 35, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 36, 20);
				$$renderer.push(`Sender IP:</strong>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 36, 48);
				$$renderer.push(`${escape_html(senderIp)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 40, 8);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(ptrRecords);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let ptr = each_array[i];
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 42, 16);
				$$renderer.push(`<div class="d-flex gap-2 align-items-center">`);
				push_element($$renderer, "div", 43, 20);
				$$renderer.push(`<span class="badge bg-success">`);
				push_element($$renderer, "span", 44, 24);
				$$renderer.push(`Found</span>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 45, 24);
				$$renderer.push(`${escape_html(ptr)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--> `);
			if (ptrRecords.length > 1) {
				$$renderer.push(`<!--[0--><div class="list-group-item">`);
				push_element($$renderer, "div", 50, 16);
				$$renderer.push(`<div class="alert alert-warning mb-0">`);
				push_element($$renderer, "div", 51, 20);
				$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
				push_element($$renderer, "i", 52, 24);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 53, 24);
				$$renderer.push(`Warning:</strong>`);
				pop_element();
				$$renderer.push(` Multiple PTR records found. While not strictly an error,
                        having multiple PTR records can cause issues with some mail servers. It's recommended
                        to have exactly one PTR record per IP address.</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else if (senderIp) {
			$$renderer.push(`<!--[1--><div class="card mb-4">`);
			push_element($$renderer, "div", 62, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 63, 8);
			$$renderer.push(`<h5 class="text-muted mb-2">`);
			push_element($$renderer, "h5", 64, 12);
			$$renderer.push(`<i class="bi bi-x-circle-fill text-danger">`);
			push_element($$renderer, "i", 65, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Reverse DNS (PTR)</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 68, 12);
			$$renderer.push(`PTR</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 70, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 71, 12);
			$$renderer.push(`PTR records (reverse DNS) map IP addresses back to hostnames. Having proper PTR
                records is important for email deliverability.</p>`);
			pop_element();
			$$renderer.push(` <div class="mt-2">`);
			push_element($$renderer, "div", 75, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 76, 16);
			$$renderer.push(`Sender IP:</strong>`);
			pop_element();
			$$renderer.push(` <code>`);
			push_element($$renderer, "code", 76, 44);
			$$renderer.push(`${escape_html(senderIp)}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="alert alert-danger mb-0 mt-2">`);
			push_element($$renderer, "div", 78, 12);
			$$renderer.push(`<i class="bi bi-x-circle me-1">`);
			push_element($$renderer, "i", 79, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 80, 16);
			$$renderer.push(`Error:</strong>`);
			pop_element();
			$$renderer.push(` No PTR records found for the sender IP. Contact your email service
                provider to configure reverse DNS.</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, PtrRecordsDisplay);
}
PtrRecordsDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/ReturnOkDisplay.svelte
ReturnOkDisplay[FILENAME] = "src/lib/components/ReturnOkDisplay.svelte";
function ReturnOkDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { returnOk } = $$props;
		const rows = derived(() => [returnOk?.from ? {
			label: "From",
			entry: returnOk.from
		} : void 0, returnOk?.return_path ? {
			label: "Return-Path",
			entry: returnOk.return_path
		} : void 0].filter((r) => r !== void 0));
		const hasFail = derived(() => rows().some((r) => r.entry.status === "fail"));
		const hasWarn = derived(() => rows().some((r) => r.entry.status === "warn"));
		const allPass = derived(() => rows().length > 0 && rows().every((r) => r.entry.status === "pass"));
		const headerOk = derived(allPass);
		function badgeClass(status) {
			if (status === "pass") return "bg-success";
			if (status === "warn") return "bg-warning text-dark";
			return "bg-danger";
		}
		function badgeLabel(status) {
			if (status === "pass") return "MX";
			if (status === "warn") return "A/AAAA only";
			return "Unreachable";
		}
		if (rows().length > 0) {
			$$renderer.push(`<!--[0--><div class="card mb-4">`);
			push_element($$renderer, "div", 42, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 43, 8);
			$$renderer.push(`<h5 class="text-muted mb-0">`);
			push_element($$renderer, "h5", 44, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": headerOk(),
				"text-success": headerOk(),
				"bi-exclamation-triangle-fill": !headerOk() && !hasFail(),
				"text-warning": !headerOk() && !hasFail(),
				"bi-x-circle-fill": hasFail(),
				"text-danger": hasFail()
			})}>`);
			push_element($$renderer, "i", 45, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Return Address Reachability</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 56, 12);
			$$renderer.push(`RETURN-OK</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 58, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 59, 12);
			$$renderer.push(`Replies (to the From address) and bounces (to the Return-Path) can only be delivered
                if the sender's domains accept mail. A domain should publish MX records; an A/AAAA
                record works as an implicit fallback but is not recommended. A domain with neither
                is unreachable and silently drops replies and bounces.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 66, 8);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(rows());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let { label, entry } = each_array[$$index];
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 68, 16);
				$$renderer.push(`<div class="d-flex align-items-center gap-2 flex-wrap">`);
				push_element($$renderer, "div", 69, 20);
				$$renderer.push(`<span class="text-muted" style="min-width: 6.5rem">`);
				push_element($$renderer, "span", 70, 24);
				$$renderer.push(`${escape_html(label)} domain:</span>`);
				pop_element();
				$$renderer.push(` <code>`);
				push_element($$renderer, "code", 71, 24);
				$$renderer.push(`${escape_html(entry.domain)}</code>`);
				pop_element();
				$$renderer.push(` <span${attr_class(`badge ${stringify(badgeClass(entry.status))}`)}>`);
				push_element($$renderer, "span", 72, 24);
				$$renderer.push(`${escape_html(badgeLabel(entry.status))}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (entry.org_domain) {
					$$renderer.push(`<!--[0--><small class="text-muted">`);
					push_element($$renderer, "small", 76, 28);
					$$renderer.push(`via organizational domain <code>`);
					push_element($$renderer, "code", 77, 58);
					$$renderer.push(`${escape_html(entry.org_domain)}</code>`);
					pop_element();
					$$renderer.push(`</small>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` `);
			if (hasFail() || hasWarn()) {
				$$renderer.push(`<!--[0--><div class="list-group list-group-flush">`);
				push_element($$renderer, "div", 85, 12);
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 86, 16);
				if (hasFail()) {
					$$renderer.push(`<!--[0--><div class="alert alert-danger mb-0">`);
					push_element($$renderer, "div", 88, 24);
					$$renderer.push(`<i class="bi bi-x-circle me-1">`);
					push_element($$renderer, "i", 89, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 90, 28);
					$$renderer.push(`Error:</strong>`);
					pop_element();
					$$renderer.push(` At least one sender domain has no MX and no A/AAAA
                            record. Replies or bounce messages to that domain will be lost. Publish an
                            MX record pointing to a mail server that accepts mail.</div>`);
					pop_element();
				} else if (hasWarn()) {
					$$renderer.push(`<!--[1--><div class="alert alert-warning mb-0">`);
					push_element($$renderer, "div", 95, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 96, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 97, 28);
					$$renderer.push(`Warning:</strong>`);
					pop_element();
					$$renderer.push(` A sender domain has no MX record and relies on
                            its A/AAAA record (implicit MX). Mail is still deliverable, but publishing
                            an explicit MX record is recommended.</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, ReturnOkDisplay);
}
ReturnOkDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/SpfRecordsDisplay.svelte
SpfRecordsDisplay[FILENAME] = "src/lib/components/SpfRecordsDisplay.svelte";
function SpfRecordsDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { spfRecords, dmarcRecord } = $$props;
		const dmarcStrict = derived(() => dmarcRecord?.valid && dmarcRecord?.policy && (dmarcRecord.policy === "quarantine" || dmarcRecord.policy === "reject"));
		const spfIsValid = derived(() => spfRecords?.reduce((acc, r) => acc && r.valid, true) ?? false);
		const spfCanBeImprove = derived(() => spfRecords && spfRecords.length > 0 && spfRecords.filter((r) => !r.record?.includes(" redirect="))[0]?.all_qualifier != "-" && !dmarcStrict());
		if (spfRecords && spfRecords.length > 0) {
			$$renderer.push(`<!--[0--><div class="card mb-4" id="dns-spf">`);
			push_element($$renderer, "div", 29, 4);
			$$renderer.push(`<div class="card-header d-flex justify-content-between align-items-center">`);
			push_element($$renderer, "div", 30, 8);
			$$renderer.push(`<h5 class="text-muted mb-2">`);
			push_element($$renderer, "h5", 31, 12);
			$$renderer.push(`<i${attr_class("bi", void 0, {
				"bi-check-circle-fill": spfIsValid() && !spfCanBeImprove(),
				"text-success": spfIsValid() && !spfCanBeImprove(),
				"bi-arrow-up-circle-fill": spfIsValid() && spfCanBeImprove(),
				"text-warning": spfIsValid() && spfCanBeImprove(),
				"bi-x-circle-fill": !spfIsValid(),
				"text-danger": !spfIsValid()
			})}>`);
			push_element($$renderer, "i", 32, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Sender Policy Framework</h5>`);
			pop_element();
			$$renderer.push(` <span class="badge bg-secondary">`);
			push_element($$renderer, "span", 43, 12);
			$$renderer.push(`SPF</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 45, 8);
			$$renderer.push(`<p class="card-text small text-muted mb-0">`);
			push_element($$renderer, "p", 46, 12);
			$$renderer.push(`SPF specifies which mail servers are authorized to send emails on behalf of your
                domain. Receiving servers check the sender's IP address against your SPF record to
                prevent email spoofing.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 52, 8);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(spfRecords);
			for (let index = 0, $$length = each_array.length; index < $$length; index++) {
				let spf = each_array[index];
				$$renderer.push(`<div class="list-group-item">`);
				push_element($$renderer, "div", 54, 16);
				if (spf.domain) {
					$$renderer.push(`<!--[0--><div class="mb-2">`);
					push_element($$renderer, "div", 56, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 57, 28);
					$$renderer.push(`Domain:</strong>`);
					pop_element();
					$$renderer.push(` <code>`);
					push_element($$renderer, "code", 57, 53);
					$$renderer.push(`${escape_html(spf.domain)}</code>`);
					pop_element();
					$$renderer.push(` `);
					if (index > 0) {
						$$renderer.push(`<!--[0--><span class="badge bg-info ms-2">`);
						push_element($$renderer, "span", 59, 32);
						$$renderer.push(`Included</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="mb-2">`);
				push_element($$renderer, "div", 63, 20);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 64, 24);
				$$renderer.push(`Status:</strong>`);
				pop_element();
				$$renderer.push(` `);
				if (spf.valid) {
					$$renderer.push(`<!--[0--><span class="badge bg-success">`);
					push_element($$renderer, "span", 66, 28);
					$$renderer.push(`Valid</span>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><span class="badge bg-danger">`);
					push_element($$renderer, "span", 68, 28);
					$$renderer.push(`Invalid</span>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` `);
				if (spf.all_qualifier) {
					$$renderer.push(`<!--[0--><div class="mb-2">`);
					push_element($$renderer, "div", 72, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 73, 28);
					$$renderer.push(`All Mechanism Policy:</strong>`);
					pop_element();
					$$renderer.push(` `);
					if (spf.all_qualifier === "-") {
						$$renderer.push(`<!--[0--><span class="badge bg-success">`);
						push_element($$renderer, "span", 75, 32);
						$$renderer.push(`Strict (-all)</span>`);
						pop_element();
					} else if (spf.all_qualifier === "~") {
						$$renderer.push(`<!--[1--><span class="badge bg-warning">`);
						push_element($$renderer, "span", 77, 32);
						$$renderer.push(`Softfail (~all)</span>`);
						pop_element();
					} else if (spf.all_qualifier === "+") {
						$$renderer.push(`<!--[2--><span class="badge bg-danger">`);
						push_element($$renderer, "span", 79, 32);
						$$renderer.push(`Pass (+all)</span>`);
						pop_element();
					} else if (spf.all_qualifier === "?") {
						$$renderer.push(`<!--[3--><span class="badge bg-warning">`);
						push_element($$renderer, "span", 81, 32);
						$$renderer.push(`Neutral (?all)</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (index === 0 || index === 1 && spfRecords[0].record?.includes("redirect=")) {
						$$renderer.push(`<!--[0--><div${attr_class("alert small mt-2", void 0, {
							"alert-warning": spf.all_qualifier !== "-",
							"alert-success": spf.all_qualifier === "-"
						})}>`);
						push_element($$renderer, "div", 84, 32);
						if (spf.all_qualifier === "-") $$renderer.push(`<!--[0-->All unauthorized servers will be rejected. This is the
                                        recommended strict policy.`);
						else if (dmarcStrict()) {
							$$renderer.push(`<!--[1-->While your DMARC ${escape_html(dmarcRecord?.policy)} policy provides some protection,
                                        consider using <code>`);
							push_element($$renderer, "code", 94, 55);
							$$renderer.push(`-all</code>`);
							pop_element();
							$$renderer.push(` for better security with some
                                        old mailbox providers.`);
						} else if (spf.all_qualifier === "~") {
							$$renderer.push(`<!--[2-->Unauthorized servers will softfail. Consider using <code>`);
							push_element($$renderer, "code", 97, 91);
							$$renderer.push(`-all</code>`);
							pop_element();
							$$renderer.push(` for stricter policy, though this rarely affects legitimate
                                        email deliverability.`);
						} else if (spf.all_qualifier === "+") {
							$$renderer.push(`<!--[3-->All servers are allowed to send email. This severely weakens
                                        email authentication. Use <code>`);
							push_element($$renderer, "code", 103, 66);
							$$renderer.push(`-all</code>`);
							pop_element();
							$$renderer.push(` for strict policy.`);
						} else if (spf.all_qualifier === "?") {
							$$renderer.push(`<!--[4-->No statement about unauthorized servers. Use <code>`);
							push_element($$renderer, "code", 105, 85);
							$$renderer.push(`-all</code>`);
							pop_element();
							$$renderer.push(` for strict policy to prevent spoofing.`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (spf.record) {
					$$renderer.push(`<!--[0--><div class="mb-2">`);
					push_element($$renderer, "div", 114, 24);
					$$renderer.push(`<strong>`);
					push_element($$renderer, "strong", 115, 28);
					$$renderer.push(`Record:</strong>`);
					pop_element();
					$$renderer.push(`<br/>`);
					push_element($$renderer, "br", 115, 52);
					pop_element();
					$$renderer.push(` <code class="d-block mt-1 text-break">`);
					push_element($$renderer, "code", 116, 28);
					$$renderer.push(`${escape_html(spf.record)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (spf.error) {
					$$renderer.push(`<!--[0--><div${attr_class(`alert alert-${spf.valid ? "warning" : "danger"} mb-0 mt-2`)}>`);
					push_element($$renderer, "div", 120, 24);
					$$renderer.push(`<i${attr_class(`bi bi-${spf.valid ? "exclamation-triangle" : "x-circle"} me-1`)}>`);
					push_element($$renderer, "i", 121, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 123, 28);
					$$renderer.push(`${escape_html(spf.valid ? "Warning:" : "Error:")}</strong>`);
					pop_element();
					$$renderer.push(` ${escape_html(spf.error)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	}, SpfRecordsDisplay);
}
SpfRecordsDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/DnsRecordsCard.svelte
DnsRecordsCard[FILENAME] = "src/lib/components/DnsRecordsCard.svelte";
function DnsRecordsCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { domainAlignment, dnsResults, dnsGrade, dnsScore, domainOnly = false } = $$props;
		const senderIp = derived(() => dnsResults?.sender_ip);
		const heloHostname = derived(() => dnsResults?.helo_hostname);
		$$renderer.push(`<div class="card shadow-sm" id="dns-details">`);
		push_element($$renderer, "div", 32, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 33, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 34, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 35, 12);
		$$renderer.push(`<i class="bi bi-diagram-3 me-2">`);
		push_element($$renderer, "i", 36, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` DNS Records</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 39, 12);
		if (dnsScore !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(dnsScore))}`)}>`);
			push_element($$renderer, "span", 41, 20);
			$$renderer.push(`${escape_html(dnsScore)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (dnsGrade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: dnsGrade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 51, 4);
		if (!dnsResults) {
			$$renderer.push(`<!--[0--><p class="text-muted mb-0">`);
			push_element($$renderer, "p", 53, 12);
			$$renderer.push(`No DNS results available</p>`);
			pop_element();
		} else {
			$$renderer.push("<!--[-1-->");
			if (dnsResults.errors && dnsResults.errors.length > 0) {
				$$renderer.push(`<!--[0--><div class="alert alert-warning mb-3">`);
				push_element($$renderer, "div", 56, 16);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 57, 20);
				$$renderer.push(`Errors:</strong>`);
				pop_element();
				$$renderer.push(` <ul class="mb-0">`);
				push_element($$renderer, "ul", 58, 20);
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(dnsResults.errors);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let error = each_array[i];
					$$renderer.push(`<li>`);
					push_element($$renderer, "li", 60, 28);
					$$renderer.push(`${escape_html(error)}</li>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></ul>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (!domainOnly) {
				$$renderer.push("<!--[0-->");
				if (senderIp()) {
					$$renderer.push(`<!--[0--><div class="mb-3 d-flex align-items-center gap-2">`);
					push_element($$renderer, "div", 69, 20);
					$$renderer.push(`<h4 class="mb-0 text-truncate">`);
					push_element($$renderer, "h4", 70, 24);
					$$renderer.push(`Received from: <code>`);
					push_element($$renderer, "code", 71, 43);
					$$renderer.push(`${escape_html(heloHostname())} (${escape_html(dnsResults.ptr_records?.[0] || "Unknown")} [${escape_html(senderIp())}])</code>`);
					pop_element();
					$$renderer.push(`</h4>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				PtrRecordsDisplay($$renderer, {
					ptrRecords: dnsResults.ptr_records,
					senderIp: senderIp()
				});
				$$renderer.push(`<!----> `);
				PtrForwardRecordsDisplay($$renderer, {
					ptrRecords: dnsResults.ptr_records,
					ptrForwardRecords: dnsResults.ptr_forward_records,
					senderIp: senderIp()
				});
				$$renderer.push(`<!----> `);
				HeloPtrMatchDisplay($$renderer, {
					heloHostname: heloHostname(),
					ptrRecords: dnsResults.ptr_records,
					heloPtrMatch: dnsResults.helo_ptr_match
				});
				$$renderer.push(`<!----> `);
				HeloSpfRecordDisplay($$renderer, {
					heloSpfRecord: dnsResults.helo_spf_record,
					senderDomain: dnsResults.rp_domain ?? dnsResults.from_domain,
					senderOrgDomain: domainAlignment?.return_path_org_domain ?? domainAlignment?.from_org_domain
				});
				$$renderer.push(`<!----> `);
				ReturnOkDisplay($$renderer, { returnOk: dnsResults.return_ok });
				$$renderer.push(`<!----> <hr class="my-4"/>`);
				push_element($$renderer, "hr", 106, 16);
				pop_element();
				$$renderer.push(` <div class="mb-3">`);
				push_element($$renderer, "div", 109, 16);
				$$renderer.push(`<div class="d-flex align-items-center gap-2 flex-wrap">`);
				push_element($$renderer, "div", 110, 20);
				$$renderer.push(`<h4 class="mb-0 text-truncate">`);
				push_element($$renderer, "h4", 111, 24);
				$$renderer.push(`Return-Path Domain: <code>`);
				push_element($$renderer, "code", 113, 28);
				$$renderer.push(`${escape_html(dnsResults.rp_domain || dnsResults.from_domain)}</code>`);
				pop_element();
				$$renderer.push(`</h4>`);
				pop_element();
				$$renderer.push(` `);
				if (domainAlignment && !domainAlignment.aligned && !domainAlignment.relaxed_aligned || domainAlignment && !domainAlignment.aligned && domainAlignment.relaxed_aligned && dnsResults.dmarc_record && dnsResults.dmarc_record.spf_alignment === "strict" || !domainAlignment && dnsResults.rp_domain && dnsResults.rp_domain !== dnsResults.from_domain) {
					$$renderer.push(`<!--[0--><span class="badge bg-danger ms-2">`);
					push_element($$renderer, "span", 116, 28);
					$$renderer.push(`<i class="bi bi-exclamation-triangle-fill">`);
					push_element($$renderer, "i", 117, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` Differs from From domain</span>`);
					pop_element();
					$$renderer.push(` <small>`);
					push_element($$renderer, "small", 119, 28);
					$$renderer.push(`<i class="bi bi-chevron-right">`);
					push_element($$renderer, "i", 120, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <a href="#domain-alignment">`);
					push_element($$renderer, "a", 121, 32);
					$$renderer.push(`See domain alignment</a>`);
					pop_element();
					$$renderer.push(`</small>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><span class="badge bg-success ms-2">`);
					push_element($$renderer, "span", 124, 28);
					$$renderer.push(`Same as From domain</span>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` `);
				if (dnsResults.rp_mx_records && dnsResults.rp_mx_records.length > 0) {
					$$renderer.push("<!--[0-->");
					MxRecordsDisplay($$renderer, {
						class: "mb-4",
						mxRecords: dnsResults.rp_mx_records,
						title: "Mail Exchange Records for Return-Path Domain",
						description: "These MX records handle bounce messages and non-delivery reports."
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			SpfRecordsDisplay($$renderer, {
				spfRecords: dnsResults.spf_records,
				dmarcRecord: dnsResults.dmarc_record
			});
			$$renderer.push(`<!----> `);
			if (!domainOnly) {
				$$renderer.push(`<!--[0--><hr class="my-4"/>`);
				push_element($$renderer, "hr", 147, 16);
				pop_element();
				$$renderer.push(` <div class="mb-3 d-flex align-items-center gap-2">`);
				push_element($$renderer, "div", 150, 16);
				$$renderer.push(`<h4 class="mb-0 text-truncate">`);
				push_element($$renderer, "h4", 151, 20);
				$$renderer.push(`From Domain: <code>`);
				push_element($$renderer, "code", 152, 37);
				$$renderer.push(`${escape_html(dnsResults.from_domain)}</code>`);
				pop_element();
				$$renderer.push(`</h4>`);
				pop_element();
				$$renderer.push(` `);
				if (dnsResults.rp_domain && dnsResults.rp_domain !== dnsResults.from_domain) {
					$$renderer.push(`<!--[0--><span class="badge bg-danger ms-2">`);
					push_element($$renderer, "span", 155, 24);
					$$renderer.push(`<i class="bi bi-exclamation-triangle-fill">`);
					push_element($$renderer, "i", 156, 28);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` Differs from Return-Path domain</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (dnsResults.from_mx_records && dnsResults.from_mx_records.length > 0) {
				$$renderer.push("<!--[0-->");
				MxRecordsDisplay($$renderer, {
					class: "mb-4",
					mxRecords: dnsResults.from_mx_records,
					title: "Mail Exchange Records for From Domain",
					description: "These MX records handle replies to emails sent from this domain."
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (!domainOnly) {
				$$renderer.push("<!--[0-->");
				DkimRecordsDisplay($$renderer, { dkimRecords: dnsResults.dkim_records });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			DmarcRecordDisplay($$renderer, {
				dmarcRecord: dnsResults.dmarc_record,
				fromDomain: dnsResults.from_domain
			});
			$$renderer.push(`<!----> `);
			BimiRecordDisplay($$renderer, {
				bimiRecord: dnsResults.bimi_record,
				dmarcRecord: dnsResults.dmarc_record
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, DnsRecordsCard);
}
DnsRecordsCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/EmailAddressDisplay.svelte
EmailAddressDisplay[FILENAME] = "src/lib/components/EmailAddressDisplay.svelte";
function EmailAddressDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { email } = $$props;
		$$renderer.push(`<div${attr_class("rounded rounded-4 p-4", void 0, {
			"bg-light": store_get($$store_subs ??= {}, "$theme", theme) === "light",
			"bg-secondary": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
		})}>`);
		push_element($$renderer, "div", 29, 0);
		$$renderer.push(`<div class="input-group">`);
		push_element($$renderer, "div", 34, 4);
		$$renderer.push(`<input type="text" class="form-control text-center fs-5 text-primary fw-bold font-monospace"${attr("value", email)} readonly=""/>`);
		push_element($$renderer, "input", 35, 8);
		pop_element();
		$$renderer.push(` <button${attr_class("btn btn-outline-primary clipboard-btn svelte-1ploha2", void 0, {
			"btn-outline-primary": store_get($$store_subs ??= {}, "$theme", theme) === "light",
			"btn-primary": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
		})} title="Copy to clipboard">`);
		push_element($$renderer, "button", 43, 8);
		$$renderer.push(`<i${attr_class(clsx("bi bi-clipboard"))}>`);
		push_element($$renderer, "i", 50, 12);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`</button>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, EmailAddressDisplay);
}
EmailAddressDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/EmailPathCard.svelte
EmailPathCard[FILENAME] = "src/lib/components/EmailPathCard.svelte";
function EmailPathCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { receivedChain } = $$props;
		const entryIndex = derived(() => receivedChain.findIndex((hop) => hop.inbound));
		function protocolIndicatesTLS(withProto) {
			if (!withProto) return false;
			const p = withProto.trim().toUpperCase();
			return p.endsWith("S") || p.endsWith("SA");
		}
		function protocolIndicatesAuth(withProto) {
			if (!withProto) return false;
			return withProto.trim().toUpperCase().endsWith("A");
		}
		if (receivedChain && receivedChain.length > 0) {
			$$renderer.push(`<!--[0--><div class="card shadow-sm" id="email-path">`);
			push_element($$renderer, "div", 32, 4);
			$$renderer.push(`<div${attr_class("card-header", void 0, {
				"bg-white": store_get($$store_subs ??= {}, "$theme", theme) === "light",
				"bg-dark": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
			})}>`);
			push_element($$renderer, "div", 33, 8);
			$$renderer.push(`<h4 class="mb-0">`);
			push_element($$renderer, "h4", 38, 12);
			$$renderer.push(`<i class="bi bi-pin-map me-2">`);
			push_element($$renderer, "i", 39, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Email Path</h4>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 43, 8);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(receivedChain);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let hop = each_array[i];
				$$renderer.push(`<div${attr_class("list-group-item", void 0, {
					"bg-light": i < entryIndex() && store_get($$store_subs ??= {}, "$theme", theme) === "light",
					"bg-secondary": i < entryIndex() && store_get($$store_subs ??= {}, "$theme", theme) !== "light"
				})}>`);
				push_element($$renderer, "div", 45, 16);
				$$renderer.push(`<div class="d-flex w-100 justify-content-between">`);
				push_element($$renderer, "div", 50, 20);
				$$renderer.push(`<h6 class="mb-1">`);
				push_element($$renderer, "h6", 51, 24);
				$$renderer.push(`<span class="badge bg-primary me-2">`);
				push_element($$renderer, "span", 52, 28);
				$$renderer.push(`${escape_html(receivedChain.length - i)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (i < entryIndex()) {
					$$renderer.push(`<!--[0--><span class="badge bg-secondary me-2">`);
					push_element($$renderer, "span", 54, 32);
					$$renderer.push(`Internal</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> ${escape_html(hop.reverse || "-")} `);
				if (hop.ip) {
					$$renderer.push(`<!--[0--><span class="text-muted">`);
					push_element($$renderer, "span", 57, 40);
					$$renderer.push(`(${escape_html(hop.ip)})</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> → ${escape_html(hop.by || "Unknown")}</h6>`);
				pop_element();
				$$renderer.push(` <small class="text-muted"${attr("title", hop.timestamp)}>`);
				push_element($$renderer, "small", 60, 24);
				$$renderer.push(`${escape_html(hop.timestamp ? new Intl.DateTimeFormat("default", {
					dateStyle: "long",
					timeStyle: "short"
				}).format(new Date(hop.timestamp)) : "-")}</small>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` `);
				if (hop.with || hop.id || hop.from) {
					$$renderer.push(`<!--[0--><p class="mb-1 small d-flex gap-3">`);
					push_element($$renderer, "p", 70, 24);
					if (hop.with) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 72, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 73, 36);
						$$renderer.push(`Protocol:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 74, 36);
						$$renderer.push(`${escape_html(hop.with)}</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (hop.id) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 78, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 79, 36);
						$$renderer.push(`ID:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 79, 72);
						$$renderer.push(`${escape_html(hop.id)}</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (hop.from) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 83, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 84, 36);
						$$renderer.push(`Helo:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 84, 74);
						$$renderer.push(`${escape_html(hop.from)}</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></p>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <p class="mb-0 small d-flex flex-wrap align-items-center gap-3">`);
				push_element($$renderer, "p", 89, 20);
				if (hop.tls) {
					$$renderer.push(`<!--[0--><span class="badge bg-success">`);
					push_element($$renderer, "span", 91, 28);
					$$renderer.push(`<i class="bi bi-lock-fill me-1">`);
					push_element($$renderer, "i", 92, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`TLS</span>`);
					pop_element();
					$$renderer.push(` `);
					if (hop.tls.version) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 95, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 96, 36);
						$$renderer.push(`Version:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 97, 36);
						$$renderer.push(`${escape_html(hop.tls.version)}</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (hop.tls.cipher) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 101, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 102, 36);
						$$renderer.push(`Cipher:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 103, 36);
						$$renderer.push(`${escape_html(hop.tls.cipher)}</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (hop.tls.bits) {
						$$renderer.push(`<!--[0--><span>`);
						push_element($$renderer, "span", 107, 32);
						$$renderer.push(`<span class="text-muted">`);
						push_element($$renderer, "span", 108, 36);
						$$renderer.push(`Strength:</span>`);
						pop_element();
						$$renderer.push(` <code>`);
						push_element($$renderer, "code", 109, 36);
						$$renderer.push(`${escape_html(hop.tls.bits)} bits</code>`);
						pop_element();
						$$renderer.push(`</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (hop.tls.verified !== void 0) {
						$$renderer.push(`<!--[0--><span${attr_class("", void 0, {
							"text-success": hop.tls.verified,
							"text-warning": !hop.tls.verified
						})}>`);
						push_element($$renderer, "span", 113, 32);
						$$renderer.push(`<i${attr_class(`bi ${hop.tls.verified ? "bi-patch-check-fill" : "bi-patch-exclamation-fill"} me-1`)}>`);
						push_element($$renderer, "i", 117, 36);
						$$renderer.push(`</i>`);
						pop_element();
						$$renderer.push(` ${escape_html(hop.tls.verified ? "Certificate trusted" : "Certificate not trusted")}</span>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else if (protocolIndicatesTLS(hop.with)) {
					$$renderer.push(`<!--[1--><span class="badge bg-success">`);
					push_element($$renderer, "span", 128, 28);
					$$renderer.push(`<i class="bi bi-lock-fill me-1">`);
					push_element($$renderer, "i", 129, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`TLS</span>`);
					pop_element();
				} else if (hop.with) {
					$$renderer.push(`<!--[2--><span class="badge bg-secondary">`);
					push_element($$renderer, "span", 132, 28);
					$$renderer.push(`<i class="bi bi-unlock me-1">`);
					push_element($$renderer, "i", 133, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`No TLS</span>`);
					pop_element();
				} else {
					$$renderer.push(`<!--[-1--><span class="badge bg-light text-muted border">`);
					push_element($$renderer, "span", 136, 28);
					$$renderer.push(`<i class="bi bi-question-circle me-1">`);
					push_element($$renderer, "i", 137, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`TLS unknown</span>`);
					pop_element();
				}
				$$renderer.push(`<!--]--> `);
				if (protocolIndicatesAuth(hop.with)) {
					$$renderer.push(`<!--[0--><span class="badge bg-info">`);
					push_element($$renderer, "span", 141, 28);
					$$renderer.push(`<i class="bi bi-person-check-fill me-1">`);
					push_element($$renderer, "i", 142, 32);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`Authenticated</span>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></p>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, EmailPathCard);
}
EmailPathCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/ErrorDisplay.svelte
ErrorDisplay[FILENAME] = "src/lib/components/ErrorDisplay.svelte";
function ErrorDisplay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { status, message, showActions = true } = $$props;
		function getErrorTitle(status) {
			switch (status) {
				case 404: return "Page Not Found";
				case 403: return "Access Denied";
				case 429: return "Too Many Requests";
				case 500: return "Server Error";
				case 503: return "Service Unavailable";
				default: return "Something Went Wrong";
			}
		}
		function getErrorDescription(status) {
			switch (status) {
				case 404: return "The page you're looking for doesn't exist or has been moved.";
				case 403: return "You don't have permission to access this resource.";
				case 429: return "You've made too many requests. Please wait a moment and try again.";
				case 500: return "Our server encountered an error while processing your request.";
				case 503: return "The service is temporarily unavailable. Please try again later.";
				default: return "An unexpected error occurred. Please try again.";
			}
		}
		function getErrorIcon(status) {
			switch (status) {
				case 404: return "bi-search";
				case 403: return "bi-shield-lock";
				case 429: return "bi-hourglass-split";
				case 500: return "bi-exclamation-triangle";
				case 503: return "bi-clock-history";
				default: return "bi-exclamation-circle";
			}
		}
		let defaultDescription = derived(() => getErrorDescription(status));
		$$renderer.push(`<div class="row justify-content-center">`);
		push_element($$renderer, "div", 66, 0);
		$$renderer.push(`<div class="col-lg-6 text-center fade-in svelte-95fokg">`);
		push_element($$renderer, "div", 67, 4);
		$$renderer.push(`<div class="error-icon-wrapper mb-4 svelte-95fokg">`);
		push_element($$renderer, "div", 69, 8);
		$$renderer.push(`<i${attr_class(`bi ${stringify(getErrorIcon(status))} text-danger`, "svelte-95fokg")}>`);
		push_element($$renderer, "i", 70, 12);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h1 class="display-1 fw-bold text-primary mb-3">`);
		push_element($$renderer, "h1", 74, 8);
		$$renderer.push(`${escape_html(status)}</h1>`);
		pop_element();
		$$renderer.push(` <h2 class="fw-bold mb-3">`);
		push_element($$renderer, "h2", 77, 8);
		$$renderer.push(`${escape_html(getErrorTitle(status))}</h2>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-4">`);
		push_element($$renderer, "p", 80, 8);
		$$renderer.push(`${escape_html(getErrorDescription(status))}</p>`);
		pop_element();
		$$renderer.push(` `);
		if (message && message !== defaultDescription()) {
			$$renderer.push(`<!--[0--><div class="alert alert-light border mb-4" role="alert">`);
			push_element($$renderer, "div", 84, 12);
			$$renderer.push(`<i class="bi bi-info-circle me-2">`);
			push_element($$renderer, "i", 85, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` ${escape_html(message)}</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (showActions) {
			$$renderer.push(`<!--[0--><div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">`);
			push_element($$renderer, "div", 92, 12);
			$$renderer.push(`<a${attr("href", resolve("/"))} class="btn btn-primary btn-lg px-4">`);
			push_element($$renderer, "a", 93, 16);
			$$renderer.push(`<i class="bi bi-house-door me-2">`);
			push_element($$renderer, "i", 94, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Go Home</a>`);
			pop_element();
			$$renderer.push(` <button class="btn btn-outline-primary btn-lg px-4">`);
			push_element($$renderer, "button", 97, 16);
			$$renderer.push(`<i class="bi bi-arrow-left me-2">`);
			push_element($$renderer, "i", 101, 20);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Go Back</button>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (status === 404 && showActions) {
			$$renderer.push(`<!--[0--><div class="mt-5">`);
			push_element($$renderer, "div", 109, 12);
			$$renderer.push(`<p class="text-muted small mb-2">`);
			push_element($$renderer, "p", 110, 16);
			$$renderer.push(`Looking for something specific?</p>`);
			pop_element();
			$$renderer.push(` <div class="d-flex flex-wrap gap-2 justify-content-center">`);
			push_element($$renderer, "div", 111, 16);
			$$renderer.push(`<a${attr("href", resolve("/"))} class="badge bg-light text-dark text-decoration-none svelte-95fokg">`);
			push_element($$renderer, "a", 112, 20);
			$$renderer.push(`Home</a>`);
			pop_element();
			$$renderer.push(` <a${attr("href", `${stringify(resolve("/"))}#features`)} class="badge bg-light text-dark text-decoration-none svelte-95fokg">`);
			push_element($$renderer, "a", 115, 20);
			$$renderer.push(`Features</a>`);
			pop_element();
			$$renderer.push(` <a href="https://github.com/happyDomain/happydeliver" class="badge bg-light text-dark text-decoration-none svelte-95fokg">`);
			push_element($$renderer, "a", 121, 20);
			$$renderer.push(`Documentation</a>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, ErrorDisplay);
}
ErrorDisplay.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/FeatureCard.svelte
FeatureCard[FILENAME] = "src/lib/components/FeatureCard.svelte";
function FeatureCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { icon, title, description, variant = "primary", href, linkLabel } = $$props;
		$$renderer.push(`<div class="card h-100 text-center p-4">`);
		push_element($$renderer, "div", 17, 0);
		$$renderer.push(`<div${attr_class(`feature-icon bg-${stringify(variant)} bg-opacity-10 text-${stringify(variant)} mx-auto`, "svelte-1tvhds4")}>`);
		push_element($$renderer, "div", 18, 4);
		$$renderer.push(`<i${attr_class(`bi ${stringify(icon)}`, "svelte-1tvhds4")}>`);
		push_element($$renderer, "i", 19, 8);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h5 class="fw-bold">`);
		push_element($$renderer, "h5", 21, 4);
		$$renderer.push(`${escape_html(title)}</h5>`);
		pop_element();
		$$renderer.push(` <p class="text-muted small">`);
		push_element($$renderer, "p", 22, 4);
		$$renderer.push(`${escape_html(description)}</p>`);
		pop_element();
		$$renderer.push(` `);
		if (href && linkLabel) {
			$$renderer.push(`<!--[0--><div class="mt-auto pt-2">`);
			push_element($$renderer, "div", 26, 8);
			$$renderer.push(`<a${attr("href", href)}${attr_class(`btn btn-sm btn-outline-${stringify(variant)}`, "svelte-1tvhds4")}>`);
			push_element($$renderer, "a", 28, 12);
			$$renderer.push(`${escape_html(linkLabel)} <i class="bi bi-arrow-right ms-1">`);
			push_element($$renderer, "i", 30, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(`</a>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
	}, FeatureCard);
}
FeatureCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/HeaderAnalysisCard.svelte
HeaderAnalysisCard[FILENAME] = "src/lib/components/HeaderAnalysisCard.svelte";
function HeaderAnalysisCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { dmarcRecord, headerAnalysis, headerGrade, headerScore } = $$props;
		$$renderer.push(`<div class="card shadow-sm" id="header-details">`);
		push_element($$renderer, "div", 17, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 18, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 19, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 20, 12);
		$$renderer.push(`<i class="bi bi-list-ul me-2">`);
		push_element($$renderer, "i", 21, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Header Analysis</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 24, 12);
		if (headerScore !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(headerScore))}`)}>`);
			push_element($$renderer, "span", 26, 20);
			$$renderer.push(`${escape_html(headerScore)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (headerGrade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: headerGrade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 36, 4);
		if (headerAnalysis.issues && headerAnalysis.issues.length > 0) {
			$$renderer.push(`<!--[0--><div class="mb-3">`);
			push_element($$renderer, "div", 38, 12);
			$$renderer.push(`<h5>`);
			push_element($$renderer, "h5", 39, 16);
			$$renderer.push(`Issues</h5>`);
			pop_element();
			$$renderer.push(` <!--[-->`);
			const each_array = ensure_array_like(headerAnalysis.issues);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let issue = each_array[i];
				$$renderer.push(`<div${attr_class(`alert alert-${issue.severity === "critical" || issue.severity === "high" ? "danger" : issue.severity === "medium" ? "warning" : "info"} py-2 px-3 mb-2`)}>`);
				push_element($$renderer, "div", 41, 20);
				$$renderer.push(`<div class="d-flex justify-content-between align-items-start">`);
				push_element($$renderer, "div", 49, 24);
				$$renderer.push(`<div>`);
				push_element($$renderer, "div", 50, 28);
				$$renderer.push(`<strong>`);
				push_element($$renderer, "strong", 51, 32);
				$$renderer.push(`${escape_html(issue.header)}</strong>`);
				pop_element();
				$$renderer.push(` <div class="small">`);
				push_element($$renderer, "div", 52, 32);
				$$renderer.push(`${escape_html(issue.message)}</div>`);
				pop_element();
				$$renderer.push(` `);
				if (issue.advice) {
					$$renderer.push(`<!--[0--><div class="small mt-1">`);
					push_element($$renderer, "div", 54, 36);
					$$renderer.push(`<i class="bi bi-lightbulb me-1">`);
					push_element($$renderer, "i", 55, 40);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` ${escape_html(issue.advice)}</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` <span class="badge bg-secondary">`);
				push_element($$renderer, "span", 60, 28);
				$$renderer.push(`${escape_html(issue.severity)}</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (headerAnalysis.domain_alignment) {
			$$renderer.push("<!--[0-->");
			const spfStrictAligned = headerAnalysis.domain_alignment.from_domain === headerAnalysis.domain_alignment.return_path_domain;
			const spfRelaxedAligned = headerAnalysis.domain_alignment.from_org_domain === headerAnalysis.domain_alignment.return_path_org_domain;
			$$renderer.push(`<div class="card mb-3" id="domain-alignment">`);
			push_element($$renderer, "div", 74, 12);
			$$renderer.push(`<div class="card-header">`);
			push_element($$renderer, "div", 75, 16);
			$$renderer.push(`<h5 class="mb-0">`);
			push_element($$renderer, "h5", 76, 20);
			$$renderer.push(`<i${attr_class(`bi ${headerAnalysis.domain_alignment.aligned ? "bi-check-circle-fill text-success" : headerAnalysis.domain_alignment.relaxed_aligned ? "bi-check-circle text-info" : "bi-x-circle-fill text-danger"}`)}>`);
			push_element($$renderer, "i", 77, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Domain Alignment</h5>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="card-body">`);
			push_element($$renderer, "div", 87, 16);
			$$renderer.push(`<p class="card-text small text-muted">`);
			push_element($$renderer, "p", 88, 20);
			$$renderer.push(`Domain alignment ensures that the visible "From" domain matches the domain
                        used for authentication (Return-Path or DKIM signature). Proper alignment is
                        crucial for DMARC compliance, regardless of the policy. It helps prevent
                        email spoofing by verifying that the sender domain is consistent across all
                        authentication layers. Only one of the following lines needs to pass.</p>`);
			pop_element();
			$$renderer.push(` `);
			if (headerAnalysis.domain_alignment.issues && headerAnalysis.domain_alignment.issues.length > 0) {
				$$renderer.push(`<!--[0--><div class="mt-3">`);
				push_element($$renderer, "div", 96, 24);
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(headerAnalysis.domain_alignment.issues);
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					let issue = each_array_1[i];
					$$renderer.push(`<div${attr_class(`alert alert-${headerAnalysis.domain_alignment.relaxed_aligned ? "info" : "warning"} py-2 small mb-2`)}>`);
					push_element($$renderer, "div", 98, 32);
					$$renderer.push(`<i${attr_class(`bi bi-${headerAnalysis.domain_alignment.relaxed_aligned ? "info-circle" : "exclamation-triangle"} me-1`)}>`);
					push_element($$renderer, "i", 104, 36);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` ${escape_html(issue)}</div>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` <div class="list-group list-group-flush">`);
			push_element($$renderer, "div", 116, 16);
			$$renderer.push(`<div class="list-group-item d-flex ps-0">`);
			push_element($$renderer, "div", 117, 20);
			$$renderer.push(`<div class="d-flex align-items-center justify-content-center" style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 1.5rem; font-weight: bold; min-width: 3rem;">`);
			push_element($$renderer, "div", 118, 24);
			$$renderer.push(`SPF</div>`);
			pop_element();
			$$renderer.push(` <div class="flex-fill">`);
			push_element($$renderer, "div", 124, 24);
			$$renderer.push(`<div class="row flex-grow-1">`);
			push_element($$renderer, "div", 125, 28);
			$$renderer.push(`<div class="col-md-3">`);
			push_element($$renderer, "div", 126, 32);
			$$renderer.push(`<small class="text-muted">`);
			push_element($$renderer, "small", 127, 36);
			$$renderer.push(`Strict Alignment</small>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 128, 36);
			$$renderer.push(`<span${attr_class("badge", void 0, {
				"bg-success": spfStrictAligned,
				"bg-danger": !spfStrictAligned
			})}>`);
			push_element($$renderer, "span", 129, 40);
			$$renderer.push(`<i${attr_class(`bi ${spfStrictAligned ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`)}>`);
			push_element($$renderer, "i", 134, 44);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 139, 44);
			$$renderer.push(`${escape_html(spfStrictAligned ? "Pass" : "Fail")}</strong>`);
			pop_element();
			$$renderer.push(`</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="small text-muted mt-1">`);
			push_element($$renderer, "div", 142, 36);
			$$renderer.push(`Exact domain match</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="col-md-3">`);
			push_element($$renderer, "div", 144, 32);
			$$renderer.push(`<small class="text-muted">`);
			push_element($$renderer, "small", 145, 36);
			$$renderer.push(`Relaxed Alignment</small>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 146, 36);
			$$renderer.push(`<span${attr_class("badge", void 0, {
				"bg-success": spfRelaxedAligned,
				"bg-danger": !spfRelaxedAligned
			})}>`);
			push_element($$renderer, "span", 147, 40);
			$$renderer.push(`<i${attr_class(`bi ${spfRelaxedAligned ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`)}>`);
			push_element($$renderer, "i", 152, 44);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 157, 44);
			$$renderer.push(`${escape_html(spfRelaxedAligned ? "Pass" : "Fail")}</strong>`);
			pop_element();
			$$renderer.push(`</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="small text-muted mt-1">`);
			push_element($$renderer, "div", 160, 36);
			$$renderer.push(`Organizational domain match</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <div class="col-md-3">`);
			push_element($$renderer, "div", 164, 32);
			$$renderer.push(`<small class="text-muted">`);
			push_element($$renderer, "small", 165, 36);
			$$renderer.push(`From Domain</small>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 166, 36);
			$$renderer.push(`<code>`);
			push_element($$renderer, "code", 167, 40);
			$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.from_domain || "-")}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (headerAnalysis.domain_alignment.from_org_domain && headerAnalysis.domain_alignment.from_org_domain !== headerAnalysis.domain_alignment.from_domain) {
				$$renderer.push(`<!--[0--><div class="small text-muted mt-1">`);
				push_element($$renderer, "div", 172, 40);
				$$renderer.push(`Org: <code>`);
				push_element($$renderer, "code", 174, 44);
				$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.from_org_domain)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(` <div class="col-md-3">`);
			push_element($$renderer, "div", 180, 32);
			$$renderer.push(`<small class="text-muted">`);
			push_element($$renderer, "small", 181, 36);
			$$renderer.push(`Return-Path Domain</small>`);
			pop_element();
			$$renderer.push(` <div>`);
			push_element($$renderer, "div", 182, 36);
			$$renderer.push(`<code>`);
			push_element($$renderer, "code", 183, 40);
			$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.return_path_domain || "-")}</code>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (headerAnalysis.domain_alignment.return_path_org_domain && headerAnalysis.domain_alignment.return_path_org_domain !== headerAnalysis.domain_alignment.return_path_domain) {
				$$renderer.push(`<!--[0--><div class="small text-muted mt-1">`);
				push_element($$renderer, "div", 189, 40);
				$$renderer.push(`Org: <code>`);
				push_element($$renderer, "code", 191, 44);
				$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.return_path_org_domain)}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` `);
			if (dmarcRecord && headerAnalysis.domain_alignment.return_path_domain && headerAnalysis.domain_alignment.return_path_domain !== headerAnalysis.domain_alignment.from_domain) {
				$$renderer.push(`<!--[0--><div${attr_class(`alert mt-2 mb-0 small py-2 ${dmarcRecord.spf_alignment === "strict" ? "alert-warning" : "alert-info"}`)}>`);
				push_element($$renderer, "div", 202, 32);
				if (dmarcRecord.spf_alignment === "strict") {
					$$renderer.push(`<!--[0--><i class="bi bi-exclamation-triangle me-1">`);
					push_element($$renderer, "i", 209, 40);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 210, 40);
					$$renderer.push(`Strict SPF alignment required</strong>`);
					pop_element();
					$$renderer.push(` — Your DMARC policy
                                        requires exact domain match. The Return-Path domain must exactly
                                        match the From domain for SPF to pass DMARC alignment.`);
				} else {
					$$renderer.push(`<!--[-1--><i class="bi bi-info-circle me-1">`);
					push_element($$renderer, "i", 214, 40);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(` <strong>`);
					push_element($$renderer, "strong", 215, 40);
					$$renderer.push(`Relaxed SPF alignment allowed</strong>`);
					pop_element();
					$$renderer.push(` — Your DMARC policy
                                        allows organizational domain matching. As long as both domains
                                        share the same organizational domain (e.g., mail.example.com
                                        and example.com), SPF alignment can pass.`);
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(` <!--[-->`);
			const each_array_2 = ensure_array_like(headerAnalysis.domain_alignment.dkim_domains);
			for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
				let dkim_domain = each_array_2[i];
				const dkim_aligned = dkim_domain.domain === headerAnalysis.domain_alignment.from_domain;
				const dkim_relaxed_aligned = dkim_domain.org_domain === headerAnalysis.domain_alignment.from_org_domain;
				$$renderer.push(`<div class="list-group-item d-flex ps-0">`);
				push_element($$renderer, "div", 231, 24);
				$$renderer.push(`<div class="d-flex align-items-center justify-content-center" style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 1.5rem; font-weight: bold; min-width: 3rem;">`);
				push_element($$renderer, "div", 232, 28);
				$$renderer.push(`DKIM</div>`);
				pop_element();
				$$renderer.push(` <div class="flex-fill">`);
				push_element($$renderer, "div", 238, 28);
				$$renderer.push(`<div class="flex-fill">`);
				push_element($$renderer, "div", 239, 32);
				$$renderer.push(`<div class="row flex-grow-1">`);
				push_element($$renderer, "div", 240, 36);
				$$renderer.push(`<div class="col-md-3">`);
				push_element($$renderer, "div", 241, 40);
				$$renderer.push(`<small class="text-muted">`);
				push_element($$renderer, "small", 242, 44);
				$$renderer.push(`Strict Alignment</small>`);
				pop_element();
				$$renderer.push(` <div>`);
				push_element($$renderer, "div", 243, 44);
				$$renderer.push(`<span${attr_class("badge", void 0, {
					"bg-success": dkim_aligned,
					"bg-danger": !dkim_aligned
				})}>`);
				push_element($$renderer, "span", 244, 48);
				$$renderer.push(`<i${attr_class(`bi ${dkim_aligned ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`)}>`);
				push_element($$renderer, "i", 249, 52);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 254, 52);
				$$renderer.push(`${escape_html(dkim_aligned ? "Pass" : "Fail")}</strong>`);
				pop_element();
				$$renderer.push(`</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` <div class="small text-muted mt-1">`);
				push_element($$renderer, "div", 258, 44);
				$$renderer.push(`Exact domain match</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` <div class="col-md-3">`);
				push_element($$renderer, "div", 262, 40);
				$$renderer.push(`<small class="text-muted">`);
				push_element($$renderer, "small", 263, 44);
				$$renderer.push(`Relaxed Alignment</small>`);
				pop_element();
				$$renderer.push(` <div>`);
				push_element($$renderer, "div", 264, 44);
				$$renderer.push(`<span${attr_class("badge", void 0, {
					"bg-success": dkim_relaxed_aligned,
					"bg-danger": !dkim_relaxed_aligned
				})}>`);
				push_element($$renderer, "span", 265, 48);
				$$renderer.push(`<i${attr_class(`bi ${dkim_relaxed_aligned ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`)}>`);
				push_element($$renderer, "i", 270, 52);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(` <strong>`);
				push_element($$renderer, "strong", 275, 52);
				$$renderer.push(`${escape_html(dkim_relaxed_aligned ? "Pass" : "Fail")}</strong>`);
				pop_element();
				$$renderer.push(`</span>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` <div class="small text-muted mt-1">`);
				push_element($$renderer, "div", 282, 44);
				$$renderer.push(`Organizational domain match</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` <div class="col-md-3">`);
				push_element($$renderer, "div", 286, 40);
				$$renderer.push(`<small class="text-muted">`);
				push_element($$renderer, "small", 287, 44);
				$$renderer.push(`From Domain</small>`);
				pop_element();
				$$renderer.push(` <div>`);
				push_element($$renderer, "div", 288, 44);
				$$renderer.push(`<code>`);
				push_element($$renderer, "code", 289, 48);
				$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.from_domain || "-")}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` `);
				if (headerAnalysis.domain_alignment.from_org_domain && headerAnalysis.domain_alignment.from_org_domain !== headerAnalysis.domain_alignment.from_domain) {
					$$renderer.push(`<!--[0--><div class="small text-muted mt-1">`);
					push_element($$renderer, "div", 295, 48);
					$$renderer.push(`Org: <code>`);
					push_element($$renderer, "code", 296, 57);
					$$renderer.push(`${escape_html(headerAnalysis.domain_alignment.from_org_domain)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(` <div class="col-md-3">`);
				push_element($$renderer, "div", 303, 40);
				$$renderer.push(`<small class="text-muted">`);
				push_element($$renderer, "small", 304, 44);
				$$renderer.push(`Signature Domain</small>`);
				pop_element();
				$$renderer.push(` <div>`);
				push_element($$renderer, "div", 305, 44);
				$$renderer.push(`<code>`);
				push_element($$renderer, "code", 305, 49);
				$$renderer.push(`${escape_html(dkim_domain.domain || "-")}</code>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` `);
				if (dkim_domain.domain !== dkim_domain.org_domain) {
					$$renderer.push(`<!--[0--><div class="small text-muted mt-1">`);
					push_element($$renderer, "div", 307, 48);
					$$renderer.push(`Org: <code>`);
					push_element($$renderer, "code", 308, 57);
					$$renderer.push(`${escape_html(dkim_domain.org_domain)}</code>`);
					pop_element();
					$$renderer.push(`</div>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(` `);
				if (dmarcRecord && dkim_domain.domain !== headerAnalysis.domain_alignment.from_domain) {
					$$renderer.push("<!--[0-->");
					if (dkim_domain.org_domain === headerAnalysis.domain_alignment.from_org_domain) {
						$$renderer.push(`<!--[0--><div${attr_class(`alert mt-2 mb-0 small py-2 ${dmarcRecord.dkim_alignment === "strict" ? "alert-warning" : "alert-info"}`)}>`);
						push_element($$renderer, "div", 317, 44);
						if (dmarcRecord.dkim_alignment === "strict") {
							$$renderer.push(`<!--[0--><i class="bi bi-exclamation-triangle me-1">`);
							push_element($$renderer, "i", 324, 52);
							$$renderer.push(`</i>`);
							pop_element();
							$$renderer.push(` <strong>`);
							push_element($$renderer, "strong", 325, 52);
							$$renderer.push(`Strict DKIM alignment required</strong>`);
							pop_element();
							$$renderer.push(` —
                                                    Your DMARC policy requires exact domain match. The
                                                    DKIM signature domain must exactly match the From
                                                    domain for DKIM to pass DMARC alignment.`);
						} else {
							$$renderer.push(`<!--[-1--><i class="bi bi-info-circle me-1">`);
							push_element($$renderer, "i", 330, 52);
							$$renderer.push(`</i>`);
							pop_element();
							$$renderer.push(` <strong>`);
							push_element($$renderer, "strong", 331, 52);
							$$renderer.push(`Relaxed DKIM alignment allowed</strong>`);
							pop_element();
							$$renderer.push(` —
                                                    Your DMARC policy allows organizational domain matching.
                                                    As long as both domains share the same organizational
                                                    domain (e.g., mail.example.com and example.com),
                                                    DKIM alignment can pass.`);
						}
						$$renderer.push(`<!--]--></div>`);
						pop_element();
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
				$$renderer.push(`</div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (headerAnalysis.headers && Object.keys(headerAnalysis.headers).length > 0) {
			$$renderer.push(`<!--[0--><div class="mt-3">`);
			push_element($$renderer, "div", 349, 12);
			$$renderer.push(`<h5 style="margin-bottom: -1.3em">`);
			push_element($$renderer, "h5", 350, 16);
			$$renderer.push(`Headers</h5>`);
			pop_element();
			$$renderer.push(` <div class="table-responsive">`);
			push_element($$renderer, "div", 351, 16);
			$$renderer.push(`<table class="table table-sm">`);
			push_element($$renderer, "table", 352, 20);
			$$renderer.push(`<thead>`);
			push_element($$renderer, "thead", 353, 24);
			$$renderer.push(`<tr>`);
			push_element($$renderer, "tr", 354, 28);
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 355, 32);
			$$renderer.push(`</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 356, 32);
			$$renderer.push(`When?</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 357, 32);
			$$renderer.push(`Present</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 358, 32);
			$$renderer.push(`Valid</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 359, 32);
			$$renderer.push(`Value</th>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
			$$renderer.push(`</thead>`);
			pop_element();
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 362, 24);
			$$renderer.push(`<!--[-->`);
			const each_array_3 = ensure_array_like(Object.entries(headerAnalysis.headers).sort((a, b) => {
				const importanceOrder = {
					required: 0,
					recommended: 1,
					optional: 2,
					newsletter: 3
				};
				return importanceOrder[a[1].importance || "optional"] - importanceOrder[b[1].importance || "optional"];
			}));
			for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
				let [name, check] = each_array_3[$$index_4];
				$$renderer.push(`<tr>`);
				push_element($$renderer, "tr", 369, 32);
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 370, 36);
				$$renderer.push(`<code>`);
				push_element($$renderer, "code", 371, 40);
				$$renderer.push(`${escape_html(name)}</code>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 373, 36);
				if (check.importance) {
					$$renderer.push(`<!--[0--><small${attr_class(`text-${check.importance === "required" ? "danger" : check.importance === "recommended" ? "warning" : "secondary"}`)}>`);
					push_element($$renderer, "small", 375, 44);
					$$renderer.push(`${escape_html(check.importance)}</small>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 386, 36);
				$$renderer.push(`<i${attr_class(`bi ${check.present ? "bi-check-circle text-success" : "bi-x-circle text-danger"}`)}>`);
				push_element($$renderer, "i", 387, 40);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 393, 36);
				if (check.present && check.valid !== void 0) {
					$$renderer.push(`<!--[0--><i${attr_class(`bi ${check.valid ? "bi-check-circle text-success" : "bi-x-circle text-warning"}`)}>`);
					push_element($$renderer, "i", 395, 44);
					$$renderer.push(`</i>`);
					pop_element();
				} else $$renderer.push(`<!--[-1-->-`);
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 404, 36);
				$$renderer.push(`<small class="text-muted text-truncate"${attr("title", check.value)}>`);
				push_element($$renderer, "small", 405, 40);
				$$renderer.push(`${escape_html(check.value || "-")}</small>`);
				pop_element();
				$$renderer.push(` `);
				if (check.issues && check.issues.length > 0) {
					$$renderer.push(`<!--[0--><!--[-->`);
					const each_array_4 = ensure_array_like(check.issues);
					for (let j = 0, $$length = each_array_4.length; j < $$length; j++) {
						let issue = each_array_4[j];
						$$renderer.push(`<div class="text-warning small">`);
						push_element($$renderer, "div", 410, 48);
						$$renderer.push(`<i class="bi bi-exclamation-triangle me-1">`);
						push_element($$renderer, "i", 411, 52);
						$$renderer.push(`</i>`);
						pop_element();
						$$renderer.push(` ${escape_html(issue)}</div>`);
						pop_element();
					}
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, HeaderAnalysisCard);
}
HeaderAnalysisCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/HowItWorksStep.svelte
HowItWorksStep[FILENAME] = "src/lib/components/HowItWorksStep.svelte";
function HowItWorksStep($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { step, title, description } = $$props;
		$$renderer.push(`<div class="card h-100 text-center p-4">`);
		push_element($$renderer, "div", 11, 0);
		$$renderer.push(`<div class="display-1 text-primary fw-bold opacity-25">`);
		push_element($$renderer, "div", 12, 4);
		$$renderer.push(`${escape_html(step)}</div>`);
		pop_element();
		$$renderer.push(` <h5 class="fw-bold mt-3">`);
		push_element($$renderer, "h5", 13, 4);
		$$renderer.push(`${escape_html(title)}</h5>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-0">`);
		push_element($$renderer, "p", 14, 4);
		$$renderer.push(`${escape_html(description)}</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, HowItWorksStep);
}
HowItWorksStep.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/PendingState.svelte
PendingState[FILENAME] = "src/lib/components/PendingState.svelte";
function PendingState($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		createEventDispatcher();
		let { test, nbfetch, nextfetch, fetching = false } = $$props;
		let lastForcedCheck = Date.now() - 12345;
		$$renderer.push(`<div class="row justify-content-center svelte-1xfy0ms">`);
		push_element($$renderer, "div", 25, 0);
		$$renderer.push(`<div class="col-lg-8 fade-in svelte-1xfy0ms">`);
		push_element($$renderer, "div", 26, 4);
		$$renderer.push(`<div class="card shadow-lg svelte-1xfy0ms">`);
		push_element($$renderer, "div", 27, 8);
		$$renderer.push(`<div class="card-body p-5 text-center svelte-1xfy0ms">`);
		push_element($$renderer, "div", 28, 12);
		$$renderer.push(`<div class="pulse mb-4 svelte-1xfy0ms">`);
		push_element($$renderer, "div", 29, 16);
		$$renderer.push(`<i class="bi bi-envelope-paper display-1 text-primary svelte-1xfy0ms">`);
		push_element($$renderer, "i", 30, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h2 class="fw-bold mb-3 svelte-1xfy0ms">`);
		push_element($$renderer, "h2", 33, 16);
		$$renderer.push(`Waiting for Your Email</h2>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-4 svelte-1xfy0ms">`);
		push_element($$renderer, "p", 34, 16);
		$$renderer.push(`Send your test email to the address below:</p>`);
		pop_element();
		$$renderer.push(` <div class="mb-4 svelte-1xfy0ms">`);
		push_element($$renderer, "div", 36, 16);
		EmailAddressDisplay($$renderer, { email: test.email });
		$$renderer.push(`<!----></div>`);
		pop_element();
		$$renderer.push(` <div class="alert alert-info mb-4 svelte-1xfy0ms" role="alert">`);
		push_element($$renderer, "div", 40, 16);
		$$renderer.push(`<i class="bi bi-lightbulb me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 41, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` `);
		if (nbfetch > 4) {
			$$renderer.push(`<!--[0--><strong class="svelte-1xfy0ms">`);
			push_element($$renderer, "strong", 43, 24);
			$$renderer.push(`Tip:</strong>`);
			pop_element();
			$$renderer.push(` Check your mail is not stuck in the sending box.`);
		} else {
			$$renderer.push(`<!--[-1--><strong class="svelte-1xfy0ms">`);
			push_element($$renderer, "strong", 45, 24);
			$$renderer.push(`Tip:</strong>`);
			pop_element();
			$$renderer.push(` Send an email that represents your actual use case (newsletters,
                        transactional emails, etc.) for the most accurate results.`);
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <div class="d-flex align-items-center justify-content-center gap-2 text-muted svelte-1xfy0ms">`);
		push_element($$renderer, "div", 50, 16);
		$$renderer.push(`<div class="spinner-border spinner-border-sm svelte-1xfy0ms" role="status">`);
		push_element($$renderer, "div", 51, 20);
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (fetching || nextfetch === 0) {
			$$renderer.push(`<!--[0--><small class="svelte-1xfy0ms">`);
			push_element($$renderer, "small", 53, 24);
			$$renderer.push(`Looking for new email...</small>`);
			pop_element();
		} else if (nextfetch) {
			$$renderer.push(`<!--[1--><div class="svelte-1xfy0ms">`);
			push_element($$renderer, "div", 55, 24);
			$$renderer.push(`<small class="svelte-1xfy0ms">`);
			push_element($$renderer, "small", 56, 28);
			$$renderer.push(`Next inbox check in ${escape_html(nextfetch)} second`);
			if (nextfetch > 1) $$renderer.push(`<!--[0-->s`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->...</small>`);
			pop_element();
			$$renderer.push(` `);
			if (nbfetch > 0) {
				$$renderer.push(`<!--[0--><button type="button" class="btn btn-sm btn-link svelte-1xfy0ms"${attr("disabled", nbfetch + Date.now() < lastForcedCheck + 1e4, true)}>`);
				push_element($$renderer, "button", 60, 32);
				$$renderer.push(`<i class="bi bi-mailbox me-1 svelte-1xfy0ms">`);
				push_element($$renderer, "i", 66, 36);
				$$renderer.push(`</i>`);
				pop_element();
				$$renderer.push(`Check now</button>`);
				pop_element();
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
			pop_element();
		} else {
			$$renderer.push(`<!--[-1--><small class="svelte-1xfy0ms">`);
			push_element($$renderer, "small", 71, 24);
			$$renderer.push(`Checking for email every 3 seconds...</small>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card mt-4 svelte-1xfy0ms">`);
		push_element($$renderer, "div", 78, 8);
		$$renderer.push(`<div class="card-body svelte-1xfy0ms">`);
		push_element($$renderer, "div", 79, 12);
		$$renderer.push(`<h5 class="fw-bold mb-3 svelte-1xfy0ms">`);
		push_element($$renderer, "h5", 80, 16);
		$$renderer.push(`<i class="bi bi-info-circle me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 81, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`What we'll check:</h5>`);
		pop_element();
		$$renderer.push(` <div class="row svelte-1xfy0ms">`);
		push_element($$renderer, "div", 83, 16);
		$$renderer.push(`<div class="col-md-6 svelte-1xfy0ms">`);
		push_element($$renderer, "div", 84, 20);
		$$renderer.push(`<ul class="list-unstyled mb-0 svelte-1xfy0ms">`);
		push_element($$renderer, "ul", 85, 24);
		$$renderer.push(`<li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 86, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 87, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` SPF, DKIM, DMARC, BIMI</li>`);
		pop_element();
		$$renderer.push(` <li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 89, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 90, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` DNS Records</li>`);
		pop_element();
		$$renderer.push(` <li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 92, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 93, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` SpamAssassin Score</li>`);
		pop_element();
		$$renderer.push(`</ul>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="col-md-6 svelte-1xfy0ms">`);
		push_element($$renderer, "div", 97, 20);
		$$renderer.push(`<ul class="list-unstyled mb-0 svelte-1xfy0ms">`);
		push_element($$renderer, "ul", 98, 24);
		$$renderer.push(`<li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 99, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 100, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Blacklist Status</li>`);
		pop_element();
		$$renderer.push(` <li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 102, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 103, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Content Quality</li>`);
		pop_element();
		$$renderer.push(` <li class="mb-2 svelte-1xfy0ms">`);
		push_element($$renderer, "li", 105, 28);
		$$renderer.push(`<i class="bi bi-check2 text-success me-2 svelte-1xfy0ms">`);
		push_element($$renderer, "i", 106, 32);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Header Validation</li>`);
		pop_element();
		$$renderer.push(`</ul>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, PendingState);
}
PendingState.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/blacklist.ts
/**
* True when no IP address could be extracted from the message to check against DNS
* blacklists.
*
* This is not a sender problem: without a usable IP in the `Received` headers there is
* nothing to look up, so the reported 100%/A+ would otherwise misleadingly read as "clean"
* rather than "unchecked".
*/
function hasNoBlacklistResults(report) {
	if (!report) return true;
	return !report.blacklists || Object.keys(report.blacklists).length === 0;
}
/**
* Short explanation of why no blacklist grade can be shown, suitable for a tooltip.
*/
function noBlacklistResultsTitle() {
	return "No IP address could be extracted from this message to check against DNS blacklists, so no grade can be computed.";
}
//#endregion
//#region src/lib/spam.ts
/**
* True when no spam filter (SpamAssassin nor rspamd) produced a result for this message.
*
* This is not a sender problem: some receivers (Gmail, for instance) never run
* SpamAssassin/rspamd directly, so there is nothing to grade. Whether these run depends on
* this instance's mail infrastructure, not on the analysed email.
*/
function hasNoSpamResults(report) {
	if (!report) return true;
	return !report.spamassassin && !report.rspamd;
}
/**
* Short explanation of why no spam grade can be shown, suitable for a tooltip.
*/
function noSpamResultsTitle() {
	return "Neither SpamAssassin nor rspamd produced a result for this message, so no spam grade can be computed. This depends on this instance's mail infrastructure, not on the analysed email.";
}
//#endregion
//#region src/lib/components/ScoreCard.svelte
ScoreCard[FILENAME] = "src/lib/components/ScoreCard.svelte";
function ScoreCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { grade, score, reanalyzing, summary, authentication, source, spamFilters, blacklists } = $$props;
		let authenticationUnavailable = derived(() => hasNoAuthenticationResults(authentication));
		let spamUnavailable = derived(() => hasNoSpamResults(spamFilters));
		let blacklistUnavailable = derived(() => hasNoBlacklistResults(blacklists));
		function getScoreLabel(grade) {
			switch (grade) {
				case "A+": return "Excellent Deliverability";
				case "A": return "Good Deliverability";
				case "B": return "Fair Deliverability";
				case "C": return "Moderate Issues";
				case "D": return "Poor Deliverability";
				case "E": return "Critical Issues";
				case "F": return "Severe Problems";
				default: return "Unknown Status";
			}
		}
		prevent_snippet_stringification(scoreLink);
		function scoreLink($$renderer, href, label, grade, score, unavailable, tooltipTitle) {
			validate_snippet_args($$renderer);
			$$renderer.push(`<div class="col-sm-6 col-md-4 col-lg">`);
			push_element($$renderer, "div", 131, 12);
			$$renderer.push(`<a${attr("href", href)} class="text-decoration-none">`);
			push_element($$renderer, "a", 132, 16);
			$$renderer.push(`<div${attr_class("p-2 rounded text-center summary-card svelte-fysxfk", void 0, {
				"bg-light": store_get($$store_subs ??= {}, "$theme", theme) === "light",
				"bg-secondary": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
			})}>`);
			push_element($$renderer, "div", 140, 20);
			if (unavailable) {
				$$renderer.push("<!--[0-->");
				GradeDisplay($$renderer, { grade: "N/A" });
			} else {
				$$renderer.push("<!--[-1-->");
				GradeDisplay($$renderer, {
					grade,
					score
				});
			}
			$$renderer.push(`<!--]--> <small class="text-muted d-block">`);
			push_element($$renderer, "small", 150, 24);
			$$renderer.push(`${escape_html(label)}</small>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</a>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<div${attr_class(`card shadow-lg ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 105, 0);
		$$renderer.push(`<div class="card-body p-5 text-center">`);
		push_element($$renderer, "div", 106, 4);
		$$renderer.push(`<div class="mb-3">`);
		push_element($$renderer, "div", 107, 8);
		if (reanalyzing) {
			$$renderer.push(`<!--[0--><div class="spinner-border spinner-border-lg text-muted display-1">`);
			push_element($$renderer, "div", 109, 16);
			$$renderer.push(`</div>`);
			pop_element();
		} else {
			$$renderer.push("<!--[-1-->");
			GradeDisplay($$renderer, {
				grade,
				score,
				size: "large"
			});
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(` <h3 class="fw-bold mb-2">`);
		push_element($$renderer, "h3", 114, 8);
		if (reanalyzing) $$renderer.push(`<!--[0-->Analyzing in progress…`);
		else $$renderer.push(`<!--[-1-->${escape_html(getScoreLabel(grade))}`);
		$$renderer.push(`<!--]--></h3>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-4">`);
		push_element($$renderer, "p", 121, 8);
		$$renderer.push(`Overall Deliverability Score</p>`);
		pop_element();
		$$renderer.push(` `);
		if (summary) {
			$$renderer.push(`<!--[0--><div class="row g-3 text-start">`);
			push_element($$renderer, "div", 157, 12);
			scoreLink($$renderer, "#dns-details", "DNS", summary.dns_grade, summary.dns_score);
			$$renderer.push(`<!----> `);
			scoreLink($$renderer, "#authentication-details", "Authentication", summary.authentication_grade, summary.authentication_score, authenticationUnavailable(), noAuthResultsTitle(source));
			$$renderer.push(`<!----> `);
			scoreLink($$renderer, "#rbl-details", "Blacklists", summary.blacklist_grade, summary.blacklist_score, blacklistUnavailable(), noBlacklistResultsTitle());
			$$renderer.push(`<!----> `);
			scoreLink($$renderer, "#header-details", "Headers", summary.header_grade, summary.header_score);
			$$renderer.push(`<!----> `);
			scoreLink($$renderer, "#spam-details", "Spam Score", summary.spam_grade, summary.spam_score, spamUnavailable(), noSpamResultsTitle());
			$$renderer.push(`<!----> `);
			scoreLink($$renderer, "#content-details", "Content", summary.content_grade, summary.content_score);
			$$renderer.push(`<!----></div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, ScoreCard);
}
ScoreCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/RspamdCard.svelte
RspamdCard[FILENAME] = "src/lib/components/RspamdCard.svelte";
function RspamdCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { rspamd } = $$props;
		const RSPAMD_GREYLIST_THRESHOLD = 4;
		const RSPAMD_ADD_HEADER_THRESHOLD = 6;
		const RSPAMD_DEFAULT_REJECT_THRESHOLD = 15;
		const rejectThreshold = derived(() => rspamd.threshold ?? RSPAMD_DEFAULT_REJECT_THRESHOLD);
		const effectiveAction = derived(() => {
			if (rspamd.score >= rejectThreshold()) return {
				label: "Reject",
				cls: "bg-danger"
			};
			if (rspamd.score >= RSPAMD_ADD_HEADER_THRESHOLD) return {
				label: "Add header",
				cls: "bg-warning text-dark"
			};
			if (rspamd.score >= RSPAMD_GREYLIST_THRESHOLD) return {
				label: "Greylist",
				cls: "bg-warning text-dark"
			};
			return {
				label: "No action",
				cls: "bg-success"
			};
		});
		$$renderer.push(`<div class="card shadow-sm" id="rspamd-details">`);
		push_element($$renderer, "div", 35, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 36, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 37, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 38, 12);
		$$renderer.push(`<i class="bi bi-bug me-2">`);
		push_element($$renderer, "i", 39, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` rspamd Analysis</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 42, 12);
		if (rspamd.deliverability_score !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(rspamd.deliverability_score))}`, "svelte-1ufvae9")}>`);
			push_element($$renderer, "span", 44, 20);
			$$renderer.push(`${escape_html(rspamd.deliverability_score)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (rspamd.deliverability_grade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: rspamd.deliverability_grade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 54, 4);
		$$renderer.push(`<div class="row mb-3">`);
		push_element($$renderer, "div", 55, 8);
		$$renderer.push(`<div class="col-md-4">`);
		push_element($$renderer, "div", 56, 12);
		$$renderer.push(`<strong>`);
		push_element($$renderer, "strong", 57, 16);
		$$renderer.push(`Score:</strong>`);
		pop_element();
		$$renderer.push(` <span${attr_class(clsx(rspamd.is_spam ? "text-danger" : "text-success"))}>`);
		push_element($$renderer, "span", 60, 16);
		$$renderer.push(`${escape_html(rspamd.score.toFixed(2))}`);
		if (rspamd.threshold !== void 0) $$renderer.push(`<!--[0-->/ ${escape_html(rspamd.threshold.toFixed(1))}`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="col-md-4">`);
		push_element($$renderer, "div", 65, 12);
		$$renderer.push(`<strong>`);
		push_element($$renderer, "strong", 66, 16);
		$$renderer.push(`Classified as:</strong>`);
		pop_element();
		$$renderer.push(` <span${attr_class(`badge ${rspamd.is_spam ? "bg-danger" : "bg-success"} ms-2`)}>`);
		push_element($$renderer, "span", 67, 16);
		$$renderer.push(`${escape_html(rspamd.is_spam ? "SPAM" : "HAM")}</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="col-md-4">`);
		push_element($$renderer, "div", 71, 12);
		$$renderer.push(`<strong>`);
		push_element($$renderer, "strong", 72, 16);
		$$renderer.push(`Action:</strong>`);
		pop_element();
		$$renderer.push(` <span${attr_class(`badge ${stringify(effectiveAction().cls)} ms-2`, "svelte-1ufvae9")}>`);
		push_element($$renderer, "span", 73, 16);
		$$renderer.push(`${escape_html(effectiveAction().label)}</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (rspamd.symbols && Object.keys(rspamd.symbols).length > 0) {
			$$renderer.push(`<!--[0--><div class="mb-3">`);
			push_element($$renderer, "div", 80, 12);
			$$renderer.push(`<div class="table-responsive mt-2">`);
			push_element($$renderer, "div", 81, 16);
			$$renderer.push(`<table class="table table-sm table-hover">`);
			push_element($$renderer, "table", 82, 20);
			$$renderer.push(`<thead>`);
			push_element($$renderer, "thead", 83, 24);
			$$renderer.push(`<tr>`);
			push_element($$renderer, "tr", 84, 28);
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 85, 32);
			$$renderer.push(`Symbol</th>`);
			pop_element();
			$$renderer.push(`<th class="text-end">`);
			push_element($$renderer, "th", 86, 32);
			$$renderer.push(`Score</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 87, 32);
			$$renderer.push(`Description</th>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
			$$renderer.push(`</thead>`);
			pop_element();
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 90, 24);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(Object.entries(rspamd.symbols).sort(([, a], [, b]) => b.score - a.score));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [symbolName, symbol] = each_array[$$index];
				$$renderer.push(`<tr${attr_class(clsx(symbol.score > 0 ? "table-warning" : symbol.score < 0 ? "table-success" : ""), "svelte-1ufvae9")}>`);
				push_element($$renderer, "tr", 92, 32);
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 99, 36);
				$$renderer.push(`<span class="font-monospace">`);
				push_element($$renderer, "span", 100, 40);
				$$renderer.push(`${escape_html(symbolName)}</span>`);
				pop_element();
				$$renderer.push(` `);
				if (symbol.params) {
					$$renderer.push(`<!--[0--><small class="d-block text-muted">`);
					push_element($$renderer, "small", 102, 44);
					$$renderer.push(`${escape_html(symbol.params)}</small>`);
					pop_element();
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></td>`);
				pop_element();
				$$renderer.push(`<td class="text-end">`);
				push_element($$renderer, "td", 107, 36);
				$$renderer.push(`<span${attr_class(clsx(symbol.score > 0 ? "text-danger fw-bold" : symbol.score < 0 ? "text-success fw-bold" : "text-muted"))}>`);
				push_element($$renderer, "span", 108, 40);
				$$renderer.push(`${escape_html(symbol.score > 0 ? "+" : "")}${escape_html(symbol.score.toFixed(2))}</span>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td class="small text-muted">`);
				push_element($$renderer, "td", 118, 36);
				$$renderer.push(`${escape_html(symbol.description ?? "")}</td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (rspamd.report) {
			$$renderer.push(`<!--[0--><details class="mt-3 svelte-1ufvae9">`);
			push_element($$renderer, "details", 128, 12);
			$$renderer.push(`<summary class="cursor-pointer fw-bold svelte-1ufvae9">`);
			push_element($$renderer, "summary", 129, 16);
			$$renderer.push(`Raw Report</summary>`);
			pop_element();
			$$renderer.push(` <pre${attr_class(`mt-2 small ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} p-3 rounded`)}>`);
			push_element($$renderer, "pre", 130, 16);
			$$renderer.push(`${escape_html(rspamd.report)}</pre>`);
			pop_element();
			$$renderer.push(`</details>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, RspamdCard);
}
RspamdCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/SpamAssassinCard.svelte
SpamAssassinCard[FILENAME] = "src/lib/components/SpamAssassinCard.svelte";
function SpamAssassinCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { spamassassin } = $$props;
		$$renderer.push(`<div class="card shadow-sm" id="spam-details">`);
		push_element($$renderer, "div", 14, 0);
		$$renderer.push(`<div${attr_class(`card-header ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-white" : "bg-dark"}`)}>`);
		push_element($$renderer, "div", 15, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 16, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 17, 12);
		$$renderer.push(`<i class="bi bi-bug me-2">`);
		push_element($$renderer, "i", 18, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` SpamAssassin Analysis</span>`);
		pop_element();
		$$renderer.push(` <span>`);
		push_element($$renderer, "span", 21, 12);
		if (spamassassin.deliverability_score !== void 0) {
			$$renderer.push(`<!--[0--><span${attr_class(`badge bg-${stringify(getScoreColorClass(spamassassin.deliverability_score))}`, "svelte-aad97y")}>`);
			push_element($$renderer, "span", 23, 20);
			$$renderer.push(`${escape_html(spamassassin.deliverability_score)}%</span>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (spamassassin.deliverability_grade !== void 0) {
			$$renderer.push("<!--[0-->");
			GradeDisplay($$renderer, {
				grade: spamassassin.deliverability_grade,
				size: "small"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 33, 4);
		$$renderer.push(`<div class="row mb-3">`);
		push_element($$renderer, "div", 34, 8);
		$$renderer.push(`<div class="col-md-6">`);
		push_element($$renderer, "div", 35, 12);
		$$renderer.push(`<strong>`);
		push_element($$renderer, "strong", 36, 16);
		$$renderer.push(`Score:</strong>`);
		pop_element();
		$$renderer.push(` <span${attr_class(clsx(spamassassin.is_spam ? "text-danger" : "text-success"))}>`);
		push_element($$renderer, "span", 37, 16);
		$$renderer.push(`${escape_html(spamassassin.score.toFixed(2))} / ${escape_html(spamassassin.required_score.toFixed(1))}</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="col-md-6">`);
		push_element($$renderer, "div", 41, 12);
		$$renderer.push(`<strong>`);
		push_element($$renderer, "strong", 42, 16);
		$$renderer.push(`Classified as:</strong>`);
		pop_element();
		$$renderer.push(` <span${attr_class(`badge ${spamassassin.is_spam ? "bg-danger" : "bg-success"} ms-2`)}>`);
		push_element($$renderer, "span", 43, 16);
		$$renderer.push(`${escape_html(spamassassin.is_spam ? "SPAM" : "HAM")}</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		if (spamassassin.test_details && Object.keys(spamassassin.test_details).length > 0) {
			$$renderer.push(`<!--[0--><div class="mb-3">`);
			push_element($$renderer, "div", 50, 12);
			$$renderer.push(`<div class="table-responsive mt-2">`);
			push_element($$renderer, "div", 51, 16);
			$$renderer.push(`<table class="table table-sm table-hover">`);
			push_element($$renderer, "table", 52, 20);
			$$renderer.push(`<thead>`);
			push_element($$renderer, "thead", 53, 24);
			$$renderer.push(`<tr>`);
			push_element($$renderer, "tr", 54, 28);
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 55, 32);
			$$renderer.push(`Test Name</th>`);
			pop_element();
			$$renderer.push(`<th class="text-end">`);
			push_element($$renderer, "th", 56, 32);
			$$renderer.push(`Score</th>`);
			pop_element();
			$$renderer.push(`<th>`);
			push_element($$renderer, "th", 57, 32);
			$$renderer.push(`Description</th>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
			$$renderer.push(`</thead>`);
			pop_element();
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 60, 24);
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(Object.entries(spamassassin.test_details));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [testName, detail] = each_array[$$index];
				$$renderer.push(`<tr${attr_class(clsx(detail.score > 0 ? "table-warning" : detail.score < 0 ? "table-success" : ""), "svelte-aad97y")}>`);
				push_element($$renderer, "tr", 62, 32);
				$$renderer.push(`<td class="font-monospace">`);
				push_element($$renderer, "td", 69, 36);
				$$renderer.push(`${escape_html(testName)}</td>`);
				pop_element();
				$$renderer.push(`<td class="text-end">`);
				push_element($$renderer, "td", 70, 36);
				$$renderer.push(`<span${attr_class(clsx(detail.score > 0 ? "text-danger fw-bold" : detail.score < 0 ? "text-success fw-bold" : "text-muted"))}>`);
				push_element($$renderer, "span", 71, 40);
				$$renderer.push(`${escape_html(detail.score > 0 ? "+" : "")}${escape_html(detail.score.toFixed(1))}</span>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td class="small">`);
				push_element($$renderer, "td", 81, 36);
				$$renderer.push(`${escape_html(detail.description || "")}</td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else if (spamassassin.tests && spamassassin.tests.length > 0) {
			$$renderer.push(`<!--[1--><div class="mb-2">`);
			push_element($$renderer, "div", 89, 12);
			$$renderer.push(`<strong>`);
			push_element($$renderer, "strong", 90, 16);
			$$renderer.push(`Tests Triggered:</strong>`);
			pop_element();
			$$renderer.push(` <div class="mt-2">`);
			push_element($$renderer, "div", 91, 16);
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(spamassassin.tests);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let test = each_array_1[$$index_1];
				$$renderer.push(`<span${attr_class(`badge ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light text-dark" : "bg-secondary"} me-1 mb-1`)}>`);
				push_element($$renderer, "span", 93, 24);
				$$renderer.push(`${escape_html(test)}</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></div>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (spamassassin.report) {
			$$renderer.push(`<!--[0--><details class="mt-3 svelte-aad97y">`);
			push_element($$renderer, "details", 104, 12);
			$$renderer.push(`<summary class="cursor-pointer fw-bold svelte-aad97y">`);
			push_element($$renderer, "summary", 105, 16);
			$$renderer.push(`Raw Report</summary>`);
			pop_element();
			$$renderer.push(` <pre${attr_class(`mt-2 small ${store_get($$store_subs ??= {}, "$theme", theme) === "light" ? "bg-light" : "bg-secondary"} p-3 rounded`)}>`);
			push_element($$renderer, "pre", 106, 16);
			$$renderer.push(`${escape_html(spamassassin.report)}</pre>`);
			pop_element();
			$$renderer.push(`</details>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, SpamAssassinCard);
}
SpamAssassinCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/SummaryCard.svelte
SummaryCard[FILENAME] = "src/lib/components/SummaryCard.svelte";
function SummaryCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, report } = $$props;
		const authenticationUnavailable = derived(() => hasNoAuthenticationResults(report.authentication));
		const spamUnavailable = derived(() => hasNoSpamResults(report));
		const uploaded = derived(() => isUploadedMessage(report.source));
		function buildSummary() {
			const segments = [];
			const mailFrom = report.header_analysis?.headers?.from?.value || "an unknown sender";
			const hasDkim = report.dns_results?.dkim_records && report.dns_results?.dkim_records?.length > 0;
			const dkimVerdicts = report.authentication?.dkim;
			const dkimChecked = !!dkimVerdicts && dkimVerdicts.length > 0;
			const dkimPassed = dkimChecked && dkimVerdicts.some((d) => d.result === "pass");
			segments.push({ text: "Received a " });
			segments.push({
				text: hasDkim ? "DKIM-signed" : "non-DKIM-signed",
				highlight: {
					color: hasDkim ? dkimPassed ? "good" : "warning" : "danger",
					bold: true
				},
				link: hasDkim && dkimPassed ? "#authentication-dkim" : "#dns-details"
			});
			segments.push({ text: " email" });
			if (hasDkim && dkimChecked && !dkimPassed) {
				segments.push({ text: " with " });
				segments.push({
					text: "an invalid signature",
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#authentication-dkim"
				});
			}
			segments.push({ text: " from " });
			segments.push({
				text: mailFrom,
				highlight: { emphasis: true }
			});
			const receivedChain = report.header_analysis?.received_chain;
			if (receivedChain && receivedChain.length > 0) {
				const entryIndex = Math.max(receivedChain.findIndex((hop) => hop.inbound), 0);
				const entryHop = receivedChain[entryIndex];
				const serverName = report.dns_results?.helo_hostname || entryHop.from || entryHop.ip || "an unknown server";
				const hopCount = receivedChain.length - entryIndex;
				segments.push({ text: ", sent by " });
				segments.push({
					text: serverName,
					highlight: { monospace: true },
					link: "#header-details"
				});
				segments.push({ text: " after " });
				segments.push({
					text: `${hopCount - 1} hop${hopCount - 1 !== 1 ? "s" : ""}`,
					link: "#email-path"
				});
			}
			const spfResult = report.authentication?.spf?.result;
			const dmarcResult = report.authentication?.dmarc?.result;
			segments.push({ text: " which is " });
			if (authenticationUnavailable()) {
				segments.push({
					text: "of unknown authentication status",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#authentication-details"
				});
				segments.push({ text: uploaded() ? " (the uploaded file carries no SPF, DKIM nor DMARC verdict)" : " (this server did not verify SPF, DKIM nor DMARC)" });
			} else if (spfResult === "pass" || dmarcResult === "pass") {
				segments.push({
					text: "authenticated",
					highlight: {
						color: "good",
						bold: true
					},
					link: "#authentication-details"
				});
				segments.push({ text: " to send email on behalf of " });
				segments.push({
					text: report.header_analysis?.domain_alignment?.from_domain || "unknown domain",
					highlight: { monospace: true }
				});
			} else if (spfResult && spfResult !== "none") {
				segments.push({
					text: "not authenticated",
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#authentication-spf"
				});
				segments.push({ text: " (failed authentication checks)" });
			} else {
				segments.push({
					text: "not authenticated",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#authentication-details"
				});
				segments.push({ text: " (lacks proper authentication)" });
			}
			if (spfResult && spfResult !== "pass") {
				segments.push({ text: spfResult === "none" ? ". " : ". SPF check " });
				if (spfResult === "fail") {
					segments.push({
						text: "failed",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#authentication-spf"
					});
					segments.push({ text: ", the sending server is not authorized to send mail for this domain" });
				} else if (spfResult === "softfail") {
					segments.push({
						text: "soft-failed",
						highlight: {
							color: "warning",
							bold: true
						},
						link: "#authentication-spf"
					});
					segments.push({ text: ", the sending server may not be authorized" });
				} else if (spfResult === "temperror" || spfResult === "permerror") {
					segments.push({
						text: "encountered an error",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#authentication-spf"
					});
					segments.push({ text: ", check your SPF record configuration" });
				} else if (spfResult === "none") {
					segments.push({ text: "Your domain has " });
					segments.push({
						text: "no SPF record",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-spf"
					});
					segments.push({ text: ", you should add one to specify which servers can send email on your behalf" });
				}
			}
			const spfRecords = report.dns_results?.spf_records;
			if (spfRecords && spfRecords.length > 0) {
				const invalidSpfRecords = spfRecords.filter((r) => !r.valid && r.record);
				if (invalidSpfRecords.length > 0) {
					segments.push({ text: ". Your SPF record" });
					if (invalidSpfRecords.length > 1) segments.push({ text: "s are " });
					else segments.push({ text: " is " });
					segments.push({
						text: "invalid",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-spf"
					});
				}
			}
			const iprevResult = report.authentication?.iprev;
			if (iprevResult) {
				segments.push({ text: ". Its reverse IP " });
				if (iprevResult.result === "pass") {
					segments.push({ text: "looks " });
					segments.push({
						text: "good",
						highlight: {
							color: "good",
							bold: true
						},
						link: "#dns-ptr"
					});
				} else if (iprevResult.result === "fail") {
					segments.push({
						text: "failed",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-ptr"
					});
					segments.push({ text: " to pass the test" });
				} else {
					segments.push({ text: "returned " });
					segments.push({
						text: iprevResult.result,
						highlight: {
							color: "warning",
							bold: true
						},
						link: "#dns-ptr"
					});
				}
			}
			const blacklists = report.blacklists;
			if (blacklists && Object.keys(blacklists).length > 0) {
				const listedCount = Object.values(blacklists).flat().filter((check) => check.listed).length;
				segments.push({ text: ". Your server is " });
				if (listedCount > 0) segments.push({
					text: `blacklisted on ${listedCount} list${listedCount !== 1 ? "s" : ""}`,
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#rbl-details"
				});
				else segments.push({
					text: "not blacklisted",
					highlight: {
						color: "good",
						bold: true
					},
					link: "#rbl-details"
				});
			}
			const domainAlignment = report.header_analysis?.domain_alignment;
			if (domainAlignment) {
				segments.push({ text: ". Domain alignment is " });
				if (domainAlignment.aligned || domainAlignment.relaxed_aligned) {
					segments.push({
						text: "good",
						highlight: {
							color: "good",
							bold: true
						},
						link: "#domain-alignment"
					});
					if (!domainAlignment.aligned) segments.push({ text: " using organizational domain" });
				} else {
					segments.push({
						text: "misaligned",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#domain-alignment"
					});
					segments.push({ text: ": " });
					segments.push({
						text: "Return-Path",
						highlight: { monospace: true }
					});
					segments.push({ text: " is set to an address of " });
					segments.push({
						text: report.header_analysis?.domain_alignment?.return_path_domain || "unknown domain",
						highlight: { monospace: true }
					});
					segments.push({ text: ", you should " });
					segments.push({
						text: "update it",
						highlight: { bold: true },
						link: "#domain-alignment"
					});
				}
			}
			const dkimRecords = report.dns_results?.dkim_records;
			if (dkimRecords && Object.keys(dkimRecords).length > 0) {
				const invalidDkimKeys = Object.entries(dkimRecords).filter(([, record]) => !record.valid && record.record).map(([key]) => key);
				if (invalidDkimKeys.length > 0) {
					segments.push({ text: ". Your DKIM record" });
					if (invalidDkimKeys.length > 1) segments.push({ text: "s are " });
					else segments.push({ text: " is " });
					segments.push({
						text: "invalid",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-dkim"
					});
				}
			}
			const dmarcRecord = report.dns_results?.dmarc_record;
			if (dmarcRecord) {
				if (!dmarcRecord.record) {
					segments.push({ text: ". You " });
					segments.push({
						text: "don't have",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-dmarc"
					});
					segments.push({ text: " a DMARC record, " });
					segments.push({
						text: "consider adding at least a record with the '",
						highlight: { bold: true }
					});
					segments.push({
						text: "none",
						highlight: {
							monospace: true,
							bold: true
						}
					});
					segments.push({
						text: "' policy",
						highlight: { bold: true }
					});
				} else if (!dmarcRecord.valid) {
					segments.push({ text: ". Your DMARC record is " });
					segments.push({
						text: "invalid",
						highlight: {
							color: "danger",
							bold: true
						},
						link: "#dns-dmarc"
					});
				} else if (dmarcRecord.policy === "none") {
					segments.push({ text: ". Your DMARC policy is " });
					segments.push({
						text: "set to 'none'",
						highlight: {
							color: "warning",
							bold: true
						},
						link: "#dns-dmarc"
					});
					segments.push({ text: ", which provides monitoring but no protection" });
				} else if (dmarcRecord.policy === "quarantine" || dmarcRecord.policy === "reject") {
					segments.push({ text: ". Your DMARC policy is '" });
					segments.push({
						text: dmarcRecord.policy,
						highlight: {
							color: "good",
							bold: true,
							monospace: true
						},
						link: "#dns-dmarc"
					});
					segments.push({ text: "'" });
					if (dmarcRecord.policy === "reject") segments.push({ text: ", which is great" });
					else {
						segments.push({ text: ", consider switching to '" });
						segments.push({
							text: "reject",
							highlight: {
								monospace: true,
								bold: true
							}
						});
						segments.push({ text: "'" });
					}
				}
			} else if (dmarcResult === "fail") {
				segments.push({ text: ". DMARC check " });
				segments.push({
					text: "failed",
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#authentication-dmarc"
				});
			}
			const bimiResult = report.authentication?.bimi;
			if (dmarcRecord && dmarcRecord.valid && dmarcRecord.policy != "none" && (!bimiResult || bimiResult.result !== "skipped")) {
				const bimiRecord = report.dns_results?.bimi_record;
				if (bimiRecord?.valid) {
					segments.push({ text: ". Your domain includes " });
					segments.push({
						text: "BIMI",
						highlight: {
							color: "good",
							bold: true
						},
						link: "#dns-bimi"
					});
					if (bimiResult?.details && bimiResult.details.indexOf("declined") == 0) segments.push({ text: " declined to participate" });
					else if (bimiResult?.result === "fail") {
						segments.push({ text: " but " });
						segments.push({
							text: "has issues",
							highlight: {
								color: "danger",
								bold: true
							},
							link: "#authentication-bimi"
						});
					} else segments.push({ text: " for brand indicator display" });
				} else if (bimiResult && bimiResult.details && bimiResult.details.indexOf("(No BIMI records found)") >= 0) {
					segments.push({ text: ". Your domain has no " });
					segments.push({
						text: "BIMI record",
						highlight: {
							color: "warning",
							bold: true
						},
						link: "#dns-bimi"
					});
					segments.push({ text: ", you could " });
					segments.push({
						text: "add a record to decline participation",
						highlight: { bold: true }
					});
				} else if (bimiResult || bimiRecord) {
					segments.push({ text: ". Your domain has " });
					segments.push({
						text: "BIMI configured with issues",
						highlight: {
							color: "warning",
							bold: true
						},
						link: "#dns-bimi"
					});
				}
			}
			const arcResult = report.authentication?.arc;
			if (arcResult && arcResult.result !== "none") {
				segments.push({ text: ". " });
				segments.push({
					text: "ARC chain validation",
					link: "#authentication-arc"
				});
				segments.push({ text: " " });
				if (arcResult.chain_valid) {
					segments.push({
						text: "passed",
						highlight: {
							color: "good",
							bold: true
						}
					});
					segments.push({ text: ` with ${arcResult.chain_length} set${arcResult.chain_length !== 1 ? "s" : ""}, indicating proper email forwarding` });
				} else {
					segments.push({
						text: "failed",
						highlight: {
							color: "danger",
							bold: true
						}
					});
					segments.push({ text: ", which may indicate issues with email forwarding" });
				}
			}
			const headers = report.header_analysis?.headers;
			const listUnsubscribe = headers?.["list-unsubscribe"];
			const listUnsubscribePost = headers?.["list-unsubscribe-post"];
			if (!(listUnsubscribe?.importance === "newsletter" && listUnsubscribe?.present || listUnsubscribePost?.importance === "newsletter" && listUnsubscribePost?.present) && (listUnsubscribe?.importance === "newsletter" || listUnsubscribePost?.importance === "newsletter")) {
				segments.push({ text: ". This email is " });
				segments.push({
					text: "missing unsubscribe headers",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#header-details"
				});
				segments.push({ text: " and is " });
				segments.push({
					text: "not suitable for marketing campaigns",
					highlight: { bold: true }
				});
			}
			const unsubscribeMethods = report.content_analysis?.unsubscribe_methods;
			if (unsubscribeMethods && unsubscribeMethods.length > 0 && !unsubscribeMethods.includes("one-click")) {
				segments.push({ text: ". This email could benefit from " });
				segments.push({
					text: "one-click unsubscribe",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#content-details"
				});
			}
			const spamAssassin = report.spamassassin;
			const contentScore = report.summary?.content_score || 0;
			const spamScore = report.summary?.spam_score || 0;
			segments.push({ text: ". " });
			if (spamAssassin?.is_spam) {
				segments.push({ text: "Content is " });
				segments.push({
					text: "flagged as spam",
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#spam-details"
				});
				segments.push({ text: " and needs review" });
			} else if (contentScore < 50) {
				segments.push({ text: "Content quality " });
				segments.push({
					text: "needs improvement",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#content-details"
				});
			} else if (contentScore >= 100 && (spamUnavailable() || spamScore >= 100)) {
				segments.push({ text: "Content " });
				segments.push({
					text: "looks great",
					highlight: {
						color: "good",
						bold: true
					},
					link: "#content-details"
				});
			} else if (!spamUnavailable() && spamScore < 50) {
				segments.push({ text: "Your " });
				segments.push({
					text: "spam score",
					highlight: {
						color: "danger",
						bold: true
					},
					link: "#spam-details"
				});
				segments.push({ text: " is low" });
				if (report.spamassassin?.tests?.includes("EMPTY_MESSAGE")) segments.push({
					text: " (you sent an empty message, which can cause this issue, retry with some real content)",
					highlight: { bold: true }
				});
			} else if (!spamUnavailable() && spamScore < 90) {
				segments.push({ text: "Pay attention to your " });
				segments.push({
					text: "spam score",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#spam-details"
				});
				if (report.spamassassin?.tests?.includes("EMPTY_MESSAGE")) segments.push({
					text: " (you sent an empty message, which can cause this issue, retry with some real content)",
					highlight: { bold: true }
				});
			} else if (contentScore >= 80) {
				segments.push({ text: "Content " });
				segments.push({
					text: "looks good",
					highlight: {
						color: "good",
						bold: true
					},
					link: "#content-details"
				});
			} else {
				segments.push({ text: "Content " });
				segments.push({
					text: "should be reviewed",
					highlight: {
						color: "warning",
						bold: true
					},
					link: "#content-details"
				});
			}
			segments.push({ text: "." });
			return segments;
		}
		function getColorClass(color) {
			switch (color) {
				case "good": return "text-success";
				case "warning": return "text-warning";
				case "danger": return "text-danger";
				default: return "";
			}
		}
		function formatAge(ms) {
			const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
			const minutes = Math.round(ms / 6e4);
			if (minutes < 60) return rtf.format(-minutes, "minute");
			const hours = Math.round(minutes / 60);
			if (hours < 24) return rtf.format(-hours, "hour");
			return rtf.format(-Math.round(hours / 24), "day");
		}
		function formatTimestamp(dateStr) {
			return new Date(dateStr).toLocaleDateString(void 0, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		const reportAge = derived(() => Date.now() - new Date(report.created_at).getTime());
		const knownAge = derived(() => !Number.isNaN(reportAge()));
		const staleness = derived(() => {
			if (!knownAge()) return null;
			if (reportAge() > 864e5) return "warning";
			if (reportAge() > 216e5) return "info";
			return null;
		});
		const summarySegments = derived(buildSummary);
		$$renderer.push(`<div class="card shadow-sm border-0 mb-4">`);
		push_element($$renderer, "div", 614, 0);
		$$renderer.push(`<div class="card-body p-4">`);
		push_element($$renderer, "div", 615, 4);
		$$renderer.push(`<h5 class="card-title mb-3">`);
		push_element($$renderer, "h5", 616, 8);
		$$renderer.push(`<i class="bi bi-card-text me-2">`);
		push_element($$renderer, "i", 617, 12);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Summary</h5>`);
		pop_element();
		$$renderer.push(` `);
		if (authenticationUnavailable() && !uploaded()) {
			$$renderer.push(`<!--[0--><div class="alert alert-warning py-2 px-3 mb-3 small" id="authentication-unavailable">`);
			push_element($$renderer, "div", 621, 12);
			$$renderer.push(`<i class="bi bi-exclamation-triangle-fill me-2">`);
			push_element($$renderer, "i", 622, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 623, 16);
			$$renderer.push(`Authentication could not be checked: this is a server-side issue.</strong>`);
			pop_element();
			$$renderer.push(` <span class="d-block mt-1">`);
			push_element($$renderer, "span", 624, 16);
			$$renderer.push(`This HappyDeliver instance did not add an <code>`);
			push_element($$renderer, "code", 625, 62);
			$$renderer.push(`Authentication-Results</code>`);
			pop_element();
			$$renderer.push(` header to the received message, so SPF, DKIM and DMARC results are unknown and reported
                    as <strong>`);
			push_element($$renderer, "strong", 627, 23);
			$$renderer.push(`N/A</strong>`);
			pop_element();
			$$renderer.push(` instead of a grade. Nothing in the summary below
                    reflects a problem with your email on this point; the <strong>`);
			push_element($$renderer, "strong", 629, 20);
			$$renderer.push(`administrator of this instance</strong>`);
			pop_element();
			$$renderer.push(` should configure the receiving
                    mail server to verify authentication (or fix the <code>`);
			push_element($$renderer, "code", 631, 20);
			$$renderer.push(`--receiver-hostname</code>`);
			pop_element();
			$$renderer.push(` setting).</span>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (isUploadedMessage(report.source)) {
			$$renderer.push(`<!--[0--><div class="alert alert-info mb-3 small" role="alert">`);
			push_element($$renderer, "div", 636, 12);
			$$renderer.push(`<i class="bi bi-file-earmark-arrow-up me-2">`);
			push_element($$renderer, "i", 637, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` <strong>`);
			push_element($$renderer, "strong", 638, 16);
			$$renderer.push(`This report comes from an uploaded file.</strong>`);
			pop_element();
			$$renderer.push(` <p class="mb-0 mt-1">`);
			push_element($$renderer, "p", 639, 16);
			$$renderer.push(`The message was not delivered to this instance, so everything the receiving mail
                    server normally measures (SPF, DKIM, DMARC, ARC, BIMI, reverse DNS, transport
                    encryption, and the spam filters' verdicts) is only reported <strong>`);
			push_element($$renderer, "strong", 642, 81);
			$$renderer.push(`if the file already carried it.</strong>`);
			pop_element();
			$$renderer.push(` `);
			if (report.authserv_id) {
				$$renderer.push(`<!--[0-->Authentication results were read from <code>`);
				push_element($$renderer, "code", 647, 24);
				$$renderer.push(`${escape_html(report.authserv_id)}</code>`);
				pop_element();
				$$renderer.push(`, the server that originally received it.`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> Anything missing reflects that message's own path, not a misconfiguration of this
                    instance. <a${attr("href", resolve("/test"))}>`);
			push_element($$renderer, "a", 650, 30);
			$$renderer.push(`Send the message to a test address</a>`);
			pop_element();
			$$renderer.push(` to have
                    it checked here instead.</p>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (staleness()) {
			$$renderer.push(`<!--[0--><div${attr_class(`alert alert-${stringify(staleness())} py-2 px-3 mb-3 small`, "svelte-11fbcf6")}>`);
			push_element($$renderer, "div", 657, 12);
			$$renderer.push(`<i class="bi bi-clock-history me-2">`);
			push_element($$renderer, "i", 658, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` This report was generated <strong>`);
			push_element($$renderer, "strong", 659, 42);
			$$renderer.push(`${escape_html(formatAge(reportAge()))}</strong>`);
			pop_element();
			$$renderer.push(` and may no longer reflect
                your current configuration. Send another email to the same test address to re-run the
                checks.</div>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <p${attr_class("card-text text-muted", void 0, { "mb-0": !children && !knownAge() })} style="line-height: 1.8;">`);
		push_element($$renderer, "p", 664, 8);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(summarySegments());
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let segment = each_array[i];
			if (segment.link) {
				$$renderer.push(`<!--[0--><a${attr("href", segment.link)}${attr_class(`summary-link ${stringify(segment.highlight ? getColorClass(segment.highlight.color) : "")} ${segment.highlight?.bold ? "highlighted" : ""} ${segment.highlight?.emphasis ? "fst-italic" : ""} ${segment.highlight?.monospace ? "font-monospace" : ""}`, "svelte-11fbcf6")}>`);
				push_element($$renderer, "a", 672, 20);
				$$renderer.push(`${escape_html(segment.text)}</a>`);
				pop_element();
			} else if (segment.highlight) {
				$$renderer.push(`<!--[1--><span${attr_class(`${stringify(getColorClass(segment.highlight.color))} ${segment.highlight.bold ? "highlighted" : ""} ${segment.highlight?.emphasis ? "fst-italic" : ""} ${segment.highlight?.monospace ? "font-monospace" : ""}`, "svelte-11fbcf6")}>`);
				push_element($$renderer, "span", 685, 20);
				$$renderer.push(`${escape_html(segment.text)}</span>`);
				pop_element();
			} else $$renderer.push(`<!--[-1-->${escape_html(segment.text)}`);
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--> Overall, your email received a grade `);
		GradeDisplay($$renderer, {
			grade: report.grade,
			score: report.score,
			size: "inline"
		});
		$$renderer.push(`<!---->`);
		if (report.grade == "A" || report.grade == "A+") $$renderer.push(`<!--[0-->, well done 🎉`);
		else if (report.grade == "C" || report.grade == "D") $$renderer.push(`<!--[1-->:
                you should try to increase your score to ensure inbox delivery.`);
		else if (report.grade == "E") $$renderer.push(`<!--[2-->:
                you could have delivery issues with common providers.`);
		else if (report.grade == "F") $$renderer.push(`<!--[3-->:
                it will most likely be rejected by most providers.`);
		else $$renderer.push(`<!--[-1-->!`);
		$$renderer.push(`<!--]--> Check the details below
            🔽</p>`);
		pop_element();
		$$renderer.push(` `);
		if (knownAge()) {
			$$renderer.push(`<!--[0--><p${attr_class("text-muted small fst-italic", void 0, { "mb-0": !children })}>`);
			push_element($$renderer, "p", 710, 12);
			$$renderer.push(`<i class="bi bi-clock-history me-1">`);
			push_element($$renderer, "i", 711, 16);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` Report generated ${escape_html(staleness() ? "" : formatAge(reportAge()) + ", ")}on ${escape_html(formatTimestamp(report.created_at))}.</p>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, SummaryCard);
}
SummaryCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/HistoryTable.svelte
HistoryTable[FILENAME] = "src/lib/components/HistoryTable.svelte";
function HistoryTable($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { tests } = $$props;
		function formatDate(dateStr) {
			return new Date(dateStr).toLocaleDateString(void 0, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		$$renderer.push(`<div class="table-responsive shadow-sm">`);
		push_element($$renderer, "div", 26, 0);
		$$renderer.push(`<table class="table table-hover mb-0 align-middle">`);
		push_element($$renderer, "table", 27, 4);
		$$renderer.push(`<thead>`);
		push_element($$renderer, "thead", 28, 8);
		$$renderer.push(`<tr>`);
		push_element($$renderer, "tr", 29, 12);
		$$renderer.push(`<th class="ps-4" style="width: 80px;">`);
		push_element($$renderer, "th", 30, 16);
		$$renderer.push(`Grade</th>`);
		pop_element();
		$$renderer.push(`<th style="width: 80px;">`);
		push_element($$renderer, "th", 31, 16);
		$$renderer.push(`Score</th>`);
		pop_element();
		$$renderer.push(`<th>`);
		push_element($$renderer, "th", 32, 16);
		$$renderer.push(`Domain</th>`);
		pop_element();
		$$renderer.push(`<th>`);
		push_element($$renderer, "th", 33, 16);
		$$renderer.push(`Date</th>`);
		pop_element();
		$$renderer.push(`<th style="width: 50px;">`);
		push_element($$renderer, "th", 34, 16);
		$$renderer.push(`</th>`);
		pop_element();
		$$renderer.push(`</tr>`);
		pop_element();
		$$renderer.push(`</thead>`);
		pop_element();
		$$renderer.push(`<tbody>`);
		push_element($$renderer, "tbody", 37, 8);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(tests);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let test = each_array[$$index];
			$$renderer.push(`<tr class="cursor-pointer svelte-13nw1os">`);
			push_element($$renderer, "tr", 39, 16);
			$$renderer.push(`<td class="ps-4 svelte-13nw1os">`);
			push_element($$renderer, "td", 43, 20);
			GradeDisplay($$renderer, {
				grade: test.grade,
				size: "small"
			});
			$$renderer.push(`<!----></td>`);
			pop_element();
			$$renderer.push(`<td class="svelte-13nw1os">`);
			push_element($$renderer, "td", 46, 20);
			$$renderer.push(`<span class="badge bg-secondary">`);
			push_element($$renderer, "span", 47, 24);
			$$renderer.push(`${escape_html(test.score)}%</span>`);
			pop_element();
			$$renderer.push(`</td>`);
			pop_element();
			$$renderer.push(`<td class="svelte-13nw1os">`);
			push_element($$renderer, "td", 49, 20);
			if (test.from_domain) {
				$$renderer.push(`<!--[0--><code>`);
				push_element($$renderer, "code", 51, 28);
				$$renderer.push(`${escape_html(test.from_domain)}</code>`);
				pop_element();
			} else {
				$$renderer.push(`<!--[-1--><span class="text-muted">`);
				push_element($$renderer, "span", 53, 28);
				$$renderer.push(`-</span>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></td>`);
			pop_element();
			$$renderer.push(`<td class="text-muted svelte-13nw1os">`);
			push_element($$renderer, "td", 56, 20);
			$$renderer.push(`${escape_html(formatDate(test.created_at))}</td>`);
			pop_element();
			$$renderer.push(`<td class="svelte-13nw1os">`);
			push_element($$renderer, "td", 59, 20);
			$$renderer.push(`<i class="bi bi-chevron-right text-muted">`);
			push_element($$renderer, "i", 60, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(`</td>`);
			pop_element();
			$$renderer.push(`</tr>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></tbody>`);
		pop_element();
		$$renderer.push(`</table>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, HistoryTable);
}
HistoryTable.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/TinySurvey.svelte
TinySurvey[FILENAME] = "src/lib/components/TinySurvey.svelte";
function TinySurvey($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { class: className, question, source } = $$props;
		const responses = {
			id: btoa(String(Math.random() * 100)),
			stars: 1
		};
		if (store_get($$store_subs ??= {}, "$appConfig", appConfig).survey_url) {
			$$renderer.push(`<!--[0--><form${attr_class(clsx(className))}>`);
			push_element($$renderer, "form", 52, 4);
			{
				$$renderer.push("<!--[0-->");
				if (question) {
					$$renderer.push("<!--[0-->");
					question($$renderer);
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push(`<!--[-1--><p class="mb-1 small">`);
					push_element($$renderer, "p", 55, 16);
					$$renderer.push(`Help us to design a better tool, rate this report!</p>`);
					pop_element();
				}
				$$renderer.push(`<!--]--> <div class="btn-group" role="group" aria-label="Rate your level of happyness">`);
				push_element($$renderer, "div", 57, 12);
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like([...Array(5).keys()]);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let i = each_array[$$index];
					$$renderer.push(`<button${attr_class("btn btn-lg px-1 pb-2 pt-1", void 0, {
						"btn-outline-success": responses.stars <= i,
						"text-dark": responses.stars <= i,
						"btn-success": responses.stars > i
					})} style="line-height: 1em"${attr("aria-label", `${i + 1} star${i + 1 > 1 ? "s" : ""}`)}>`);
					push_element($$renderer, "button", 59, 20);
					$$renderer.push(`<i class="bi bi-star-fill">`);
					push_element($$renderer, "i", 69, 24);
					$$renderer.push(`</i>`);
					pop_element();
					$$renderer.push(`</button>`);
					pop_element();
				}
				$$renderer.push(`<!--]--></div>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></form>`);
			pop_element();
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, TinySurvey);
}
TinySurvey.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
//#region src/lib/components/WhitelistCard.svelte
WhitelistCard[FILENAME] = "src/lib/components/WhitelistCard.svelte";
function WhitelistCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { whitelists } = $$props;
		$$renderer.push(`<div class="card shadow-sm" id="dnswl-details">`);
		push_element($$renderer, "div", 12, 0);
		$$renderer.push(`<div${attr_class("card-header", void 0, {
			"bg-white": store_get($$store_subs ??= {}, "$theme", theme) === "light",
			"bg-dark": store_get($$store_subs ??= {}, "$theme", theme) !== "light"
		})}>`);
		push_element($$renderer, "div", 13, 4);
		$$renderer.push(`<h4 class="mb-0 d-flex flex-wrap justify-content-between align-items-center">`);
		push_element($$renderer, "h4", 14, 8);
		$$renderer.push(`<span>`);
		push_element($$renderer, "span", 15, 12);
		$$renderer.push(`<i class="bi bi-shield-check me-2">`);
		push_element($$renderer, "i", 16, 16);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Whitelist Checks</span>`);
		pop_element();
		$$renderer.push(` <span class="badge bg-info text-white">`);
		push_element($$renderer, "span", 19, 12);
		$$renderer.push(`Informational</span>`);
		pop_element();
		$$renderer.push(`</h4>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <div class="card-body">`);
		push_element($$renderer, "div", 22, 4);
		$$renderer.push(`<p class="text-muted small mb-3">`);
		push_element($$renderer, "p", 23, 8);
		$$renderer.push(`DNS whitelists identify trusted senders. Being listed here is a positive signal, but has
            no impact on the overall score.</p>`);
		pop_element();
		$$renderer.push(` <div class="row row-cols-1 row-cols-lg-2 overflow-auto">`);
		push_element($$renderer, "div", 28, 8);
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(Object.entries(whitelists));
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let [ip, checks] = each_array[$$index_1];
			$$renderer.push(`<div class="col mb-3">`);
			push_element($$renderer, "div", 30, 16);
			$$renderer.push(`<h5 class="text-muted">`);
			push_element($$renderer, "h5", 31, 20);
			$$renderer.push(`<i class="bi bi-hdd-network me-1">`);
			push_element($$renderer, "i", 32, 24);
			$$renderer.push(`</i>`);
			pop_element();
			$$renderer.push(` ${escape_html(ip)}</h5>`);
			pop_element();
			$$renderer.push(` <table class="table table-sm table-striped table-hover mb-0">`);
			push_element($$renderer, "table", 35, 20);
			$$renderer.push(`<tbody>`);
			push_element($$renderer, "tbody", 36, 24);
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(checks);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let check = each_array_1[$$index];
				$$renderer.push(`<tr>`);
				push_element($$renderer, "tr", 38, 32);
				$$renderer.push(`<td${attr("title", check.response || "-")}>`);
				push_element($$renderer, "td", 39, 36);
				$$renderer.push(`<span${attr_class("badge", void 0, {
					"bg-success": check.listed,
					"bg-dark": check.error,
					"bg-secondary": !check.listed && !check.error
				})}>`);
				push_element($$renderer, "span", 40, 40);
				$$renderer.push(`${escape_html(check.error ? "Error" : check.listed ? "Listed" : "Not listed")}</span>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`<td>`);
				push_element($$renderer, "td", 53, 36);
				$$renderer.push(`<code>`);
				push_element($$renderer, "code", 53, 40);
				$$renderer.push(`${escape_html(check.rbl)}</code>`);
				pop_element();
				$$renderer.push(`</td>`);
				pop_element();
				$$renderer.push(`</tr>`);
				pop_element();
			}
			$$renderer.push(`<!--]--></tbody>`);
			pop_element();
			$$renderer.push(`</table>`);
			pop_element();
			$$renderer.push(`</div>`);
			pop_element();
		}
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, WhitelistCard);
}
WhitelistCard.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { FeatureCard as a, BlacklistCard as c, HowItWorksStep as i, GradeDisplay as l, TinySurvey as n, ErrorDisplay as o, HistoryTable as r, DnsRecordsCard as s, WhitelistCard as t };
