/// <reference path="./environment.d.ts" />


/**
 * The version of OpenRCT2 the plugin supports.
 */
export const targetApiVersion = 92;
export const requiredApiVersion = 92;


/**
 * Returns the current version of the plugin.
 */
export const pluginVersion = "0.4.0";


/**
 * Returns the key used to access park storage data.
 */
export const parkStorageKey = "AnimationService";


/**
 * Returns true if the current build is a production build.
 */
export const isProduction = (buildConfiguration === "production");


/**
 * Returns true if the current build is a production build.
 */
export const isDevelopment = (buildConfiguration === "development");


/**
 * Returns true if the UI is available, or false if the game is running in headless mode.
 */
export const isUiAvailable = (typeof ui !== "undefined");


/**
 * Returns true if the player is in a multiplayer server, or false if it is a singleplayer game.
 */
export function isMultiplayer(): boolean
{
	return (network.mode !== "none");
}


/**
 * Includes default values when serializing.
 */
export var debugSerialize: boolean = false;

/**
 * Returns the build configuration of the plugin. Set by the build actions.
 */
export const buildConfiguration: BuildConfiguration = __BUILD_CONFIGURATION__;