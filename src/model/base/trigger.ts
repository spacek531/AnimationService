/// <reference path="../../../lib/openrct2.d.ts" />

import { SerializableBase, SerializableTypes } from "./serializable"
import { SensorBase } from "./sensor"
import { ActionBase } from "./action"

export class TriggerBase extends SerializableBase {

	/**
	 * Name for users to refer to this by.
	 */
	name: string;


	/**
	 * How many ticks have elapsed while the plugin is running.
	 */
	enabled: boolean;
	
	
	/**
	 * If the trigger is set to enabled upon resetting.
	 */
	defaultEnabled: boolean;
	
	
	/**
	 * If the trigger has to be manually enabled after it fires.
	 */
	disableOnTrigger: boolean;
	
	
	/**
	 * If the trigger is temporarily disabled by firing recently. 0 is enabled.
	 */
	currentTimeout: number;
	
	/**
	 * How many ticks the trigger is disabled for after it fires. 0 is no timeout.
	 */
	timeout: number;
	
	/**
	 * All enabled sensors must evaluate true for the trigger to fire.
	 */
	sensors: Array<SensorBase>;
	
	/**
	 * Actions to perform immediately upon firing, before any animations are started.
	 */
	actions: Array<ActionBase>;
	
	constructor() {
		super();
		this.type = "TriggerBase";
		this.name = "New Trigger"
		this.enabled = true;
		this.defaultEnabled = true;
		this.disableOnTrigger = false;
		this.sensors = [];
		this.actions = [];
		this.timeout = 0;
		this.currentTimeout = 0;
		this.targetAnimations = [];["enabled"]
		this.addSerializableProperties(["name","enabled","targetAnimations","currentTimeout", "timeout","disableOnTrigger","defaultEnabled"]);
		this.addSerializableArrays(["sensors","actions"]);
	}
	
	/**
	 * Returns null if sensor is not triggered, returns SensorReturnData if it is. Automatically executes if trigger fires.
	 */
	test(): Record<string, any> | null {
		var startValue: Record<string, any> = {};
		var returnValue: Record<string, any> | null = startValue;
		// evaluates in reverse order, so the first sensor determines the return data
		for (var i = this.sensors.length - 1; i >= 0; i--)
		{
			var sensor = this.sensors[i];
			if (sensor.enabled == false)
			{
				continue;
			}
			returnValue = returnValue && sensor.test();
			if (!returnValue)
			{
				return null;
			}
		}
		if (returnValue == startValue)
		{
			return null;
		}
		this.enabled = !this.disableOnTrigger;
		this.execute(returnValue);
		return returnValue;
	}
	
	
	/**
	 * Execute all trigger actions.
	 */
	execute(storage: Record<string, any>) {
		this.actions.forEach( (action) => {
			action.enabled && action.execute(storage);
		});
	}
	
	
	/**
	 * Compile complex evaluation into simple types that are fast to evaluate.
	 */
	bake(): void {
		this.sensors.forEach( (sensor) => {
			sensor.bake();
		});
		this.actions.forEach( (action) => {
			action.bake();
		});
	}
	
	
	/**
	 * Undo bake, revert back to complex evaluation.
	 */
	unbake(): void {
		this.sensors.forEach( (sensor) => {
			sensor.unbake();
		});
		this.actions.forEach( (action) => {
			action.unbake();
		});
	}
	
}
SerializableTypes.TriggerBase = TriggerBase