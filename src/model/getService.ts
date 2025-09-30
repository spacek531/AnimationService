/// <reference path="../../lib/openrct2.d.ts" />

import { AnimationService } from "./service"
import { pluginVersion } from "../utilities/environment"

type serviceType = false | AnimationService;
let gAnimationService: serviceType = false;

/**
 * If this is the newest version of AnimationService the game has loaded.
 */
let versionIsNewest = true;

/**
 * Gets the singleton AnimationService object or returns false if it not the newest version.
 */
export function getAnimationService(): AnimationService | false {
	if (!gAnimationService) {
		if (versionIsNewest)
		{
			gAnimationService = new AnimationService();
		}
	}
	return gAnimationService;
}

/**
 * Called when a newer version loads.
 */
function disableOlderVersion()
{
	versionIsNewest = false;
	if (gAnimationService)
	{
		gAnimationService.disable();
	}
	gAnimationService = false;
}

const openrct2Global: Record<string, any> = globalThis;

export function initializeAnimationServiceInterface() {

	/**
	 * Interface exposed to all plugins. Will people abuse this?
	 */
	let AnimationServiceInterface = {
		get: getAnimationService,
		version: pluginVersion,
		disable: disableOlderVersion
	}

	if ("AnimationService" in openrct2Global)
	{
		if (openrct2Global.AnimationService.version < pluginVersion)
		{
			openrct2Global.AnimationService.disable();
			openrct2Global.AnimationService = AnimationServiceInterface;
		}
	}
	else
	{
		openrct2Global.AnimationService = AnimationServiceInterface;
	}
}