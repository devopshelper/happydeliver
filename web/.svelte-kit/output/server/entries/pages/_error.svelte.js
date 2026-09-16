import { O as FILENAME, S as escape_html, c as derived, g as push_element, h as pop_element, u as head } from "../../chunks/internal.js";
import { t as page } from "../../chunks/state.js";
import { o as ErrorDisplay } from "../../chunks/components.js";
//#region src/routes/+error.svelte
_error[FILENAME] = "src/routes/+error.svelte";
function _error($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let status = derived(() => page.status);
		let message = derived(() => page.error?.message || "An unexpected error occurred");
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
		head("1j96wlh", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(status())} - ${escape_html(getErrorTitle(status()))} | happyDeliver</title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 30, 0);
		ErrorDisplay($$renderer, {
			status: status(),
			message: message()
		});
		$$renderer.push(`<!----></div>`);
		pop_element();
	}, _error);
}
_error.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _error as default };
