// Copyright (c) 2024 deanosrs and spacek531

function TriggerBase() {
    this.type = "TriggerBase";
    this.enabled = true;
}
TriggerBase.prototype.getDataToPersist = function() {
    return {
        type: this.type,
        enabled: this.enabled
    };
}
TriggerBase.prototype.poll = function() {
    return false
}

function RideEntersTrigger = function() {
    AnimationTriggerBase.call(this)
    this.type = "RideEntersTrigger"
    this.minHeight = null
    this.maxHeight = null
    this.tile = null
    this.rideId = null
    
}
RideEntersTrigger.prototype.getDataToPersist = function() {
    return {
        type: this.type,
        enabled: this.enabled,
        minHeight: this.minHeight,
        maxHeight: this.maxHeight,
        tile: this.tile,
        rideId: this.rideId
    }
}

AnimationTriggerBase.prototype.test = function() {
    return false
}

function Animation() {
    
}

function AnimationService() {
        this.tickCount = 0;
        this.triggersArray = new TriggersArray;
        this.animationsArray = new AnimationsArray;
        this.animationsArray.load(false);
        this.triggersArray.load(false)
        context.subscribe("interval.tick", this.tick.bind(this));
        this.animationsRunning = [];
        this.animationRunI = 0;
        this.paused = false
}
AnimationService.prototype.reset = function() {
    this.animationsRunning = [], this.animationRunI = 0, this.tickCount = 0
}
AnimationService.prototype.evaulateTriggers = function() {
    
}
AnimationService.prototype.tick = function() {
    if (!this.paused) {
        for (var t in this.tickCount += 1, 1e3 === this.tickCount && (this.tickCount = 0), this.animationsArray.items)
            this.maybeStartRun(this.animationsArray.items[t]);
        for (var i in this.animationsRunning)
            this.maybeIterateRun(this.animationsRunning[i]);
    }
}
AnimationService.prototype.maybeStartRun = function(t) {
    var animationTriggered = t.getStartTarget();
    if (animationTriggered && !this.isRunningAnimationWithTarget(t, animationTriggered)) {
        var n = function(t, animationTriggered, n) {
            return new AnimationPlaybackPrototype(t, animationTriggered, n)
        }(this.animationRunI, t, animationTriggered);
        this.animationsRunning.push(n), this.animationRunI += 1
    }
}
AnimationService.prototype.isRunningAnimationWithTarget = function(t, i) {
    var n, e, r = this.animationsRunning.length;
    for (e = 0; e < r; e += 1)
        if (void 0 !== (n = this.animationsRunning[e]) && n.animation.id === t.id && JSON.stringify(i) === JSON.stringify(n.target)) return !0;
    return !1
}
AnimationService.prototype.maybeIterateRun = function(t) {
    void 0 !== t && (this.tickCount % t.animation.intervalTicks == 0 && t.next(), t.state.running || this.removeAnimationRun(t))
}
AnimationService.prototype.removeAnimationRun = function(t) {
    var i, n, e = [],
        r = this.animationsRunning.length;
    for (i = 0; i < r; i += 1)(n = this.animationsRunning[i]) !== t && e.push(n);
    this.animationsRunning = e
}

registerPlugin({
    name: "Animator",
    version: "0.0.2",
    authors: ["deanosrs","spacek"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: function() {
        Qt || (Qt = new AnimationServicePrototype)
    }
})