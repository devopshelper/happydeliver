import "./internal.js";
import { s as base } from "./internal2.js";
import { n as resolve_route } from "./routing.js";
import "@sveltejs/kit/internal/server";
//#region ../node_modules/@sveltejs/kit/src/runtime/app/paths/server.js
/** @type {import('./client.js').resolve} */
function resolve(id, params) {
	if (!id.startsWith("/")) throw new Error(`Cannot use \`resolve(...)\` with a non-absolute pathname or route ID (got "${id}"). \`resolve\` is only for internal pathnames and route IDs; external URLs should be used directly.`);
	const resolved = resolve_route(id, params);
	return base + resolved;
}
//#endregion
export { resolve as t };
