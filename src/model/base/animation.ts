/// <reference path="../../../lib/openrct2.d.ts" />

import { SerializableBase, SerializableTypes } from "./serializable"
//import { error } from "../../utilities/logger"
import { ActionBase } from "./action"
import { TriggerBase } from "./trigger"

/**
 * Class that stores actions and when they are activated in an animation.
 */
export class AnimationFrame extends SerializableBase {

	/**
	 * The single frame this animation frame is executed.
	 */
	index: number | null;
	
	/**
	 * The first frame that this animation frame is executed.
	 */
	minIndex: number | null;
	
	
	/**
	 * The last frame (inclusive) that this animation frame is executed.
	 */
	maxIndex: number | null;
	
	
	/**
	 * The actions to perform every execution. Actions are executed in order.
	 */
	actions: Array<ActionBase>;
	
	constructor() {
		super();
		this.type = "AnimationFrame";
		this.index = 0;
		this.minIndex = null;
		this.maxIndex = null;
		this.actions = [];
        this.addSerializableProperties(["index","minIndex","maxIndex"]);
        this.addSerializableArrays(["actions"]);
	}
	
	
	/**
	 * Executes all actions of the animation frame if it is in range. Returns true when the frame will no longer be excecuted this loop.
	 */
	execute(currentFrame: number, storage: Record<string, any>): boolean {
        if ((this.minIndex !== null && currentFrame < this.minIndex) || (this.maxIndex !== null && currentFrame > this.maxIndex) || (this.index !== null && currentFrame != this.index))
        {
			// hold up. Does this work?
            return (this.maxIndex !== null && currentFrame == this.maxIndex) || (this.index !== null && currentFrame > this.index);
        }
		for (const action of this.actions) {
			action.enabled && action.execute(storage);
		}
		return (this.maxIndex !== null && currentFrame == this.maxIndex) || (this.index !== null && currentFrame == this.index);
	}
	
	override validate(): Array<string> {
        if (this.minIndex === null && this.maxIndex === null && this.index === null)
        {
            return ["Frame range not set"];
        }
		return [];
	}
}
SerializableTypes.AnimationFrame = AnimationFrame;

/**
 * Class that stores status of currently-playing animations
 */
export class AnimationPlayer extends SerializableBase {

	/**
	 * Reference to the animation object, to get the animation frames.
	 */
	animation!: AnimationBase;
	 
	 
	/**
	* How far along (in ticks) the playback is.
	*/
	currentTick: number;
	 
	 
	/**
	* When the playback started in globalCurrentTick. Prevents double-updating on the start tick.
	*/
	startTick: number;
	 
	 
	/**
	 * How far along (in frames) the playback is.
	 */
	currentFrame: number;
	 
	 
	/**
	 * Playback ends when this number equals the maximum loops.
	 */
	currentLoop: number;
	
	
	/**
	 * Index below which all frames are in the past.
	 */
	currentStartFrame: number;
	
	/**
	 * Data sent from the sensor.
	 */
	storage: Record<string, any>;
	 
	 constructor()
	 {
		super();
		this.type = "AnimationPlayer"
		this.currentTick = -1;
		this.startTick = -1;
		this.currentFrame = -1;
		this.currentLoop = 0;
		this.currentStartFrame = 0;
		this.storage = {};
        this.addSerializableProperties(["currentTick","currentFrame","currentLoop","storage","currentStartFrame","startTick"]);
	 }
	 
	 
	 /**
	  * Execute all frames that are in the future. Return true if all frames are in the past.
	  */
	 playFrame(currentFrame: number): boolean {
        this.storage.currentFrame = this.currentFrame;
        this.storage.currentTick = this.currentTick;
        for (var i = this.currentStartFrame; i < this.animation.animationFrames.length; i++)
        {
            var frame = this.animation.animationFrames[i];
            if (frame.execute(currentFrame, this.storage) && i == this.currentStartFrame)
            {
                this.currentStartFrame++;
            }
        }
        return this.currentStartFrame == this.animation.animationFrames.length;
	 }
	 
	 /**
	  * Advances playback by one tick. Returns true when finished.
	  */
	nextTick(globalCurrentTick: number): boolean {
	
        if (this.startTick == globalCurrentTick)
        {
            return false; // already played this tick
        }
        this.currentTick++;
        if ((this.currentTick % this.animation.tickInterval) == 0)
        {
            this.storage.globalCurrentTick = globalCurrentTick;
            this.storage.currentTick = this.currentTick;
            if (this.playFrame(++this.currentFrame))
            {
                if (this.animation.numLoops > 0 && this.currentLoop > this.animation.numLoops)
                {
                    return true;
                }
                this.currentLoop++;
				// this will kind of mess up persistentStorage animations
                this.storage.currentLoop++;
                this.currentStartFrame = 0;
                this.currentTick = -this.animation.tickInterval + 1;
                this.currentFrame = -1;
            }
        }
        return false;
	}
}
SerializableTypes.AnimationPlayer = AnimationPlayer;


/**
 * Class that stores animation frames and playback metadata.
 */
export class AnimationBase extends SerializableBase {

	/**
	 * Name for users to refer to this by.
	 */
	name: string;
	
	
	/**
	 * If the animation will start when it is played.
	 */
	enabled: boolean;
	
	
	/**
	 * If the animation is set to enabled upon resetting.
	 */
	defaultEnabled: boolean;
	
	
	/**
	 * If the animation has to be manually enabled after it starts.
	 */
	disableOnPlay: boolean;
	
	
	/**
	 * How many loops the animation plays before it stops. 0 is infinite.
	 */
	numLoops: number;
	
	
	/**
	 * How many game ticks pass before the next animation frame. TODO: remember how this works.
	 */
	tickInterval: number;
	
	
	/**
	 * Allow animation to play multiple times simultanously.
	 */
	allowMultiple: boolean;
	
	
	/**
	 * If AnimationPlayer storage is shared between all AnimationPlayers of this animation.
	 */
	persistentStorage: boolean;
	
	
	/**
	 * Animation that is played back every time the animation starts.
	 */
	animationFrames: Array<any>;
	
	
	/**
	 * Used to pass data from sensors to AnimationPlayers.
	 */
	storage: Record<string, any>;
	
	
	/**
	 * Animations that are currently in progress.
	 */
	playingAnimations: Array<AnimationPlayer>;
	
	
	/**
	 * Actions that play when the animation is forcibly stopped.
	 */
	quitActions: Array<ActionBase>;
	
	constructor() {
		super();
		this.type = "AnimationBase";
		this.name = "New Animation";
		this.enabled = true;
		this.defaultEnabled = true;
		this.disableOnPlay = false;
		this.numLoops = 0;
		this.tickInterval = 1;
		this.allowMultiple = false;
		this.persistentStorage = false;
		this.animationFrames = [];
		this.storage = {};
		this.playingAnimations = [];
		this.quitActions = [];
        this.addSerializableProperties(["name","enabled","numLoops","tickInterval","allowMultiple","persistentStorage","storage","defaultEnabled","disableOnPlay"]);
        this.addSerializableArrays(["animationFrames", "quitActions"]);
	}
	
	/**
	 * Attempt to start a new animation.
	 */
	play(trigger: TriggerBase, globalCurrentTick: number): void {
		// cannot play animation if disabled, or animation already playing without allowMultiple set
		if ((this.playingAnimations.length > 0 && !this.allowMultiple) || !this.enabled)
		{
			return;
		}
		this.storage.trigger = trigger;
		var newAnimationPlayer = new AnimationPlayer();
		newAnimationPlayer.animation = this;
		newAnimationPlayer.startTick = globalCurrentTick;
		this.enabled = !this.enabledOnPlay;
		this.playingAnimations.push(newAnimationPlayer);
	}
	
	
	/**
	 * Increment all playing animations.
	 */
	tick(globalCurrentTick: number): void {
		for (var i = 0; i < this.playingAnimations.length; i++)
		{
			if (this.playingAnimations[i].nextTick(globalCurrentTick))
			{
				this.playingAnimations.splice(i, 1);
				i--;
			}
		}
	}
	
	
	/**
	 * Execute the animation's stop actions as each animationPlayer. Not tested.
	 */
	stop(globalCurrentTick: number): void {
		for (const animation of this.playingAnimations) {
			animation.storage.globalCurrentTick = globalCurrentTick ? animation.storage.globalCurrentTick : globalCurrentTick;
			for (const quitAction of this.quitActions) {
				quitAction.enabled && quitAction.execute(animation.storage);
			}
		}
	}
	
	
	/**
	 * Special deserialize function to properly handle persistent storage.
	 */
	override deserialize(data: Record<string, any>): void {
		super.deserialize(data);
		// update handling needs to be done somewhere. TODO: where?
		/*
		if (gAnimationService.version == "0.3.2" && this.numLoops == -1) {
            this.numLoops = null;
        }
		*/
		this.playingAnimations = [];
		if ("playingAnimations" in data)
		{
			data.playingAnimations.forEach( (animationPlayerData: Record<string, any>) => {
				var player = new AnimationPlayer();
				player.deserialize(animationPlayerData);
				player.animation = this;
				if (this.persistentStorage)
				{
					player.storage = this.storage;
				}
				this.playingAnimations.push(player);
			});
		}
	}
	
	
	/**
	 * Compile complex evaluation into simple types that are fast to evaluate.
	 */
	bake(): void {
		// TODO: sort animation frames for optimal execution.
		for (const frame of this.animationFrames) {
			for (const action of frame.actions) {
				action.bake();
			}
		}
		
		for (const animationPlayer of this.playingAnimations) {
			animationPlayer.currentStartFrame = 0;
		}
	}
	
	
	/**
	 * Undo bake, revert back to complex evaluation.
	 */
	unbake(): void {
		for (const frame of this.animationFrames) {
			for (const action of frame.actions) {
				action.unbake();
			}
		}
	}
	
	
	/**
	 * Reorganizes animation frames into the most optimal order.
	 */
	sortFrames(): void {
	}
	
	
	/**
	 * Check if anything is wrong with the class's values. Anything other than empty array is an error.
	 */
	override validate(): Array<string> {
	
		let errors: Array<string> = [];
		
		
		if (!Number.isInteger(this.tickInterval))
		{
			errors.push("tick interval must be integer");
		}
		
		if (this.tickInterval < 1) {
			errors.push("tick interval must be 1 or more");
		}
		
		
		if (!Number.isInteger(this.numLoops))
		{
			errors.push("number of loops must be integer");
		}
		
		if (this.numLoops < 0) {
			errors.push("number of loops must be 0 or more");
		}
		
		return errors;
	}
}
SerializableTypes.AnimationBase = AnimationBase;
