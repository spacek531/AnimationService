/// <reference path="../lib/openrct2.d.ts" />
/// <reference path="./utilities/environment.d.ts" />

import * as Environment from "./utilities/environment";
import * as Log from "./utilities/logger";
import getAnimationService from "./model/getService";

/**
 * Entry point of the plugin.
 */
// @ts-ignore
function startup(): void
{
	getAnimationService();

	if (!Environment.isUiAvailable)
	{
		return;
	}
	
	ui.registerMenuItem("Animation Service " + Environment.pluginVersion, () =>
	{
		if (!context.apiVersion || context.apiVersion < Environment.requiredApiVersion)
		{
			const title = "Please update the game!";
			const message = "\nThe version of OpenRCT2 you are currently playing is too old for this plugin.";

			ui.showError(title, message);
			Log.error(`[Animation Service] ${title} ${message}`);
			return;
		}

		//getWindow().open();
	});
};

let pluginMetadata: PluginMetadata = {
    name: "AnimationService",
    version: Environment.pluginVersion,
    authors: "Spacek",
    type: "intransient",
    licence: "GPL-3.0",
    targetApiVersion: Environment.targetApiVersion,
	minApiVersion: Environment.requiredApiVersion,
    main: startup
};

registerPlugin(pluginMetadata);