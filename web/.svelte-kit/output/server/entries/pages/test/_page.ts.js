import { n as createTest } from "../../../chunks/api.js";
import { error, redirect } from "@sveltejs/kit";
//#region src/routes/test/+page.ts
var prerender = false;
var ssr = false;
var load = async () => {
	let response;
	try {
		response = await createTest();
	} catch (err) {
		const errorObj = err;
		error(errorObj.response?.status || 500, errorObj.message || "Unknown error");
	}
	if (response.response.ok && response.data) redirect(302, `/test/${response.data.id}`);
	else error(response.response.status, response.error);
};
//#endregion
export { load, prerender, ssr };
