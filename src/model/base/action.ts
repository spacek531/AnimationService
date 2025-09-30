/// <reference path="../../../lib/openrct2.d.ts" />

import { SerializableBase, SerializableTypes } from "./serializable"

/**
 * Base class that manipulates gamestate.
 */
export class ActionBase extends SerializableBase {

	/**
	 * How many ticks have elapsed while the plugin is running.
	 */
	enabled: boolean;
	
	
	/**
	 * Manipulate gamestate.
	 */
	execute(storage: Record<string, any>): void {}
	
	
	/**
	 * Compile complex evaluation into simple types that are fast to evaluate.
	 */
	bake(): void {}
	
	
	/**
	 * Undo bake, revert back to complex evaluation.
	 */
	unbake(): void {}
	
	constructor() {
		super();
		this.type = "ActionBase";
		this.enabled = true;
		this.addSerializableProperties(["enabled"]);
	}
}
SerializableTypes.ActionBase = ActionBase
