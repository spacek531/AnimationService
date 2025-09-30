/// <reference path="../../../lib/openrct2.d.ts" />

import { SerializableBase, SerializableTypes } from "./serializable"

/**
 * Base class that evaluates gamestate.
 */
export class SensorBase extends SerializableBase {

	/**
	 * If the sensor is tested by the trigger.
	 */
	enabled: boolean;
	
	constructor() {
		super();
		this.type = "SensorBase";
		this.enabled = true;
		this.addSerializableProperties(["enabled"]);
	}
	
	
	/**
	 * Returns null if sensor is not triggered, returns SensorReturnData if it is.
	 */
	test(): Record<string, any> | null {
		return {type: this.type};
	}
	
	
	/**
	 * Compile complex evaluation into simple types that are fast to evaluate.
	 */
	bake(): void {
	}
	
	
	/**
	 * Undo bake, revert back to complex evaluation.
	 */
	unbake(): void {
	}
}
SerializableTypes.SensorBase = SensorBase
	