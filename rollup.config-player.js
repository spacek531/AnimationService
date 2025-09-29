import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";


/**
 * @type {import("rollup").RollupOptions}
 */
const config = {
	input: "./src/player.ts",
	output: {
		file: "./dist/player.js",
		format: "iife",
	},
	plugins: [
		resolve(),
		typescript()
	],
	treeshake: "smallest"
};
export default config;