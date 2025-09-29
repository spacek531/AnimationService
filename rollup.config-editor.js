import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";


/**
 * @type {import("rollup").RollupOptions}
 */
const config = {
	input: "./src/editor.ts",
	output: {
		file: "./dist/editor.js",
		format: "iife",
	},
	plugins: [
		resolve(),
		typescript()
	],
	treeshake: "smallest"
};
export default config;