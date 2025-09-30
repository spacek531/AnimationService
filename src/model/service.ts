/// <reference path="../../lib/openrct2.d.ts" />

import { debug, print } from "../utilities/logger"
import { pluginVersion, parkStorageKey } from "../utilities/environment"
import { SerializableBase } from "./base/serializable"
import { TriggerBase } from "./base/trigger"
import { AnimationBase } from "./base/animation"

export class AnimationService extends SerializableBase {
	/**
	 * Author(s) of the animation data.
	 */
	authors!: Array<string>;
	
	
	/**
	 * How many ticks have elapsed while the plugin is running.
	 */
	tickCount!: number;
	
	
	/**
	 * All animation is halted.
	 */
	paused!: boolean;
	
	
	/**
	 * Target plugin version of the animation data.
	 */
	version!: string;
	
	
	/**
	 * Triggers evaluate sensors and trigger animations. TODO: change class to TriggerBase.
	 */
	triggers!: Array<TriggerBase>;
	
	
	/**
	 * Animations perform actions on the world. TODO: change class to AnimationBase.
	 */
	animations!: Array<AnimationBase>;
	
	
	/**
	 * I don't remember what this is.
	 */
	shouldSave!: boolean;
	
	
	/**
     * Used with the CLI to concat multiple addBuffer calls into a single json.
	 */
	stringBuffer!: string;
	
	
	/**
	 * Easy lookup of triggers by name. TODO: get rid of this and only use the arrays.
	 */
	triggersMap!: Record<string, TriggerBase>;
	
	
	/**
	 * Easy lookup of triggers by name. TODO: get rid of this and only use the arrays.
	 */
	animationsMap!: Record<string, AnimationBase>;
	
	
	constructor() {
		super();
		this.type = "AnimationService";
		this.initialize()
		this.serializableProperties = ["tickCount", "version", "paused", "authors"]; // do not serialize type. TODO: why?
		this.addSerializableArrays(["triggers", "animations"])
		
		context.subscribe("interval.tick",this.onTick.bind(this));
		context.subscribe("map.changed", this.onMapChanged.bind(this));
		context.subscribe("map.save", this.onMapSave.bind(this));
	}
	
	/**
	 * Reset AnimationService properties to default.
	 */
	initialize(): void {
		this.tickCount = 0;
		this.paused = false;
		this.version = pluginVersion;
		this.authors = [];
		this.triggers = [];
		this.animations = [];
		this.triggersMap = {};
		this.animationsMap = {};
		this.shouldSave = false;
		this.stringBuffer = "";
	}
	
	/**
	 * Increment animation state by 1 tick.
	 */
	tick(): void {
		if (this.paused) {
			return;
		}
		
		this.tickCount++;
		
		// step 1: evaluate triggers and initialize animations if they fired.
		this.triggers.forEach( (trigger) => {
			// if the trigger is enabled, test if it fires.
			var triggerData = trigger.enabled && trigger.currentTimeout == 0 && trigger.test();
			
			// decrement timeout if trigger is timed out
			trigger.currentTimeout > 0 && trigger.currentTimeout--;
			
			if (triggerData) {
				trigger.currentTimeout = trigger.timer;
				// @ts-ignore
				trigger.targetAnimations.foreach( (animation) => {
					// why do I test if animation is an object?
					if (typeof animation == 'object' && animation.enabled)
					{
						animation.play(triggerData, this.tickCount);
					}
				});
			}
		});
		
		// step 2: increment already-running animations
		this.animations.forEach( (animation) => {
			animation.playingAnimations.length > 0 && animation.tick(this.tickCount);
		});
	}
	
	// Automatic Data Handling
	
	/**
	 * Deletes all data and re-initializes AnimationService.
	 */
	unload(): void {
		this.delete();
		this.initialize();
	}
	
	/**
	 * The game has loaded a new map.
	 */
	onLoad(): void {
		this.unload();
		this.load();
	}
	
	/**
	 * Load animation data from park storage and begin executing.
	 */
	load(): void {
        var data: Record<string, any> = {};
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var datum = context.getParkStorage(parkStorageKey).get(this.serializableProperties[i]);
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var datum = context.getParkStorage(parkStorageKey).get(this.serializeObjectArrays[i]);
            data[this.serializeObjectArrays[i]] = datum === undefined ? null : datum;
        }
        this.shouldSave = data.version !== null;
        if (this.shouldSave)
        {
			debug("[AnimationService] Loading animation data from park storage");
            this.deserialize(data);
            this.triggerOnLoad();
        }
	}
	
	/**
	 * Save animation data to park if there is animation data to save.
	 */
	onMapSave(): void {
		this.shouldSave && this.save();
	}
	
	
	/**
	 * Convert JSON objects into simulation state.
	 */
	override deserialize(data: Record<string, any>): void {
		this.initialize();
		this.shouldSave = true;
		debug("[AnimationService] Loaded with", this.animations.length, "animations and", this.triggers.length, "triggers.");
		if (this.paused)
		{
			print("[AnimationService] Loaded from park data in paused state");
		}
	}
	
	
	/**
	 * Write simulation state to park storage.
	 */
	save(): void {
		this.shouldSave = true;
		for (const key of this.serializableProperties) {
			context.getParkStorage(parkStorageKey).set(key, this[key]);
		}
		for (const key of this.serializeObjectArrays) {
			var data: Array<Record<string, any>> = [];
			for (const object of this[key]) {
				data.push(object.serialize());
			}
			context.getParkStorage(parkStorageKey).set(key, data);
		}
		debug("[AnimationService] Data saved to park storage");
	}
	
	// User I/O
	
	/**
	 * Set triggers enabled to default state and reset timeouts.
	 */
	resetTriggers(): void {
		for (const trigger of this.triggers) {
			trigger.currentTimeout = 0
			trigger.enabled = trigger.defaultEnabled;
			debug("Set trigger ",trigger.name, "enabled to", trigger.enabled, "and currentTimeout to 0");
		}
	}
	
	
	/**
	 * Halt all animations and set enabled to default state.
	 */
	resetAnimations(): void {
		this.animations.forEach( (animation) => {
			animation.stop(this.tickCount);
			animation.enabled = animation.defaultEnabled;
			debug("Set animation",animation.name, "enabled to", animation.enabled);
		});
	}
	
	
	/**
	 * Reset triggers and animations.
	 */
	resetAll(): void {
		this.resetTriggers();
		this.resetAnimations();
	}
	
	
	/**
	 * Compile complex evaluation into simple types that are fast to evaluate.
	 */
	bake(): void {
		this.triggers.forEach( (trigger) => {
			trigger.bake();
		});
		this.animations.forEach( (animation) => {
			animation.bake();
		});
	}
	
	
	/**
	 * Undo bake, revert back to complex evaluation.
	 */
	unbake(): void {
		this.triggers.forEach( (trigger) => {
			trigger.unbake();
		});
		this.animations.forEach( (animation) => {
			animation.unbake();
		});
	}
}
