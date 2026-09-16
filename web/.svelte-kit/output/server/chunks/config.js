import { D as writable } from "./internal.js";
import "./routing.js";
//#region src/lib/stores/config.ts
var defaultConfig = {
	report_retention: 0,
	survey_url: "",
	rbls: []
};
function getConfigFromScriptTag() {
	if (typeof document !== "undefined") {
		const configScript = document.getElementById("app-config");
		if (configScript) try {
			return JSON.parse(configScript.textContent || "");
		} catch (e) {
			console.error("Failed to parse app config:", e);
		}
	}
	return null;
}
var initialConfig = getConfigFromScriptTag() || defaultConfig;
var appConfig = writable(initialConfig);
//#endregion
export { appConfig as t };
