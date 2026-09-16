import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import type { Plugin } from "vite";

function safeFetchPlugin(): Plugin {
    return {
        name: "safe-fetch-plugin",
        enforce: "pre",
        transform(code, id) {
            if (id.includes("fetcher.js")) {
                if (
                    code.includes("window.fetch = (input, init) => {") &&
                    !code.includes("try {\n\t\twindow.fetch =") &&
                    !code.includes("try {\r\n\t\twindow.fetch =")
                ) {
                    return {
                        code: code.replace(
                            /window\.fetch = \(input, init\) => \{([\s\S]*?return native_fetch\(input, init\);\s*\};)/g,
                            "try {\n\t\twindow.fetch = (input, init) => {$1\n\t} catch {}",
                        ),
                        map: null,
                    };
                }
            }
            return null;
        },
    };
}

export default defineConfig({
    server: {
        hmr: {
            port: 10000,
        },
    },
    plugins: [safeFetchPlugin(), sveltekit()],
    test: {
        expect: { requireAssertions: true },
        projects: [
            {
                extends: "./vite.config.ts",
                test: {
                    name: "server",
                    environment: "node",
                    include: ["src/**/*.{test,spec}.{js,ts}"],
                    exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
                },
            },
        ],
    },
});
