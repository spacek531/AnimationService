/// <reference path="../lib/openrct2.d.ts" />
/// <reference path="./utilities/environment.d.ts" />

import * as Environment from "./utilities/environment";
import * as Log from "./utilities/logger";
import { SerializableBase } from "./simulation/serializable_base.ts";

/**
 * Entry point of the plugin.
 */
function startup(): void
{
	
	if (!isUiAvailable)
	{
		return;
	}
	var a = new SerializableBase();
	
	ui.registerMenuItem("Inspect park rating", () =>
	{
		if (!context.apiVersion || context.apiVersion < requiredApiVersion)
		{
			const title = "Please update the game!";
			const message = "\nThe version of OpenRCT2 you are currently playing is too old for this plugin.";

			ui.showError(title, message);
			console.log(`[ParkRatingInspector] ${title} ${message}`);
			return;
		}

		viewmodel.nextUpdate = 0;
		getWindow().open();
	});
};