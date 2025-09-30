/// <reference path="../lib/openrct2.d.ts" />
/// <reference path="./utilities/environment.d.ts" />

import * as Environment from "./utilities/environment";
import * as Log from "./utilities/logger";
import * as Info from "./info.js";
import getAnimationService from "./model/getService";

/**
 * Entry point of the plugin.
 */
function startup(): void
{
	getAnimationService();

	if (!Environment.isUiAvailable)
	{
		return;
	}
	
	ui.registerMenuItem("Animation Service " + Info.version, () =>
	{
		if (!context.apiVersion || context.apiVersion < Info.minApiVersion)
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
    name: Info.name,
    version: Info.version,
    authors: Info.authors,
    type: Info.type,
    licence: Info.license,
    targetApiVersion: Info.targetApiVersion,
	minApiVersion: Info.minApiVersion,
    main: startup
};

registerPlugin(pluginMetadata);