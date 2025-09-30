/// <reference path="../../lib/openrct2.d.ts" />

import { AnimationService } from "./service"

type serviceType = false | AnimationService;
let gAnimationService: serviceType = false;

export default function getAnimationService() {
	if (!gAnimationService) {
		gAnimationService = new AnimationService();
	}
	return gAnimationService;
}
const a: Record<string, any> = globalThis;
a.getAnimationService = getAnimationService;