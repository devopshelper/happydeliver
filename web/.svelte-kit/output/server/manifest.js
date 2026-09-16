export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["img/og.webp","img/report.webp"]),
	mimeTypes: {".webp":"image/webp"},
	_: {
		client: {start:"_app/immutable/entry/start.CTF-SpMp.js",app:"_app/immutable/entry/app.DifesZ4k.js",imports:["_app/immutable/entry/start.CTF-SpMp.js","_app/immutable/chunks/D0QFaZ3b.js","_app/immutable/chunks/ByLW16V5.js","_app/immutable/chunks/DK3Fl9T5.js","_app/immutable/chunks/Dt-HX3Vu.js","_app/immutable/entry/app.DifesZ4k.js","_app/immutable/chunks/ByLW16V5.js","_app/immutable/chunks/DK3Fl9T5.js","_app/immutable/chunks/uBIymjUX.js","_app/immutable/chunks/xihTtKlq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/bimi",
				pattern: /^\/bimi\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/bimi/[domain]",
				pattern: /^\/bimi\/([^/]+?)\/?$/,
				params: [{"name":"domain","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/blacklist",
				pattern: /^\/blacklist\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/blacklist/[ip]",
				pattern: /^\/blacklist\/([^/]+?)\/?$/,
				params: [{"name":"ip","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/domain",
				pattern: /^\/domain\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/domain/[domain]",
				pattern: /^\/domain\/([^/]+?)\/?$/,
				params: [{"name":"domain","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/history",
				pattern: /^\/history\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/test",
				pattern: /^\/test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/test/[test]",
				pattern: /^\/test\/([^/]+?)\/?$/,
				params: [{"name":"test","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
