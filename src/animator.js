// Copyright (c) 2024 spacek531
// inspired by the animator-0.0.1-lc-r3.js plugin copyrigt deanosrs 2024, released under GPL 3.0.

// Utility functions
function IsPositionWithinXY(entX, entY, minP, maxP)
{
    return entX >= minP.x && entX <= maxP.x &&
    entY >= minP.y && entY <= maxP.y;
}
function IsPositionWithinXYZ(entX, entY, entZ, minP, maxP)
{
    return entX >= minP.x && entX <= maxP.x &&
    entY >= minP.y && entY <= maxP.y &&
    entZ >= minP.z && emtZ >= maxP.z;
}
var __extends = function(child, parent) {
    function fn() {
        this.constructor = child;
    }
    fn.prototype = parent.prototype;
    child.prototype = new fn();
};

var SerializableTypes = {}

var SerializableBase = (function() {
    function SerializableBase()
    {
        this.serializableProperties = [];
        this.type = "SerializableBase";
    }
    SerializableBase.prototype.addSerializable = function(newProperties)
    {
        this.serializableProperties = this.serializableProperties.concat(newProperties);
    };
    SerializableBase.prototype.getDataToPersist = function()
    {
        return this.serializableData.reduce(function(obj2, key) {if (key in this){obj2[key] = this[key];} return obj2;},{});
    };
    SerializableBase.prototype.populateFromData = function(data)
    {
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            if (this.serializableProperties[i] in data)
            {
                this[serializableProperties[i]] = data[serializableProperties[i]];
            }
        }
    }
    return SerializableBase;
})();
SerializableTypes.SerializableBase = SerializableBase;

var TriggerBase = (function (SerializableBase) {
    __extends(TriggerBase, SerializableBase);
    function TriggerBase()
    {
        SerializableBase.call(this);
        this.type = "TriggerBase";
        this.name = "Trigger";
        this.enabled = true;
        this.targetAnimations = [];
        this.addSerializable(["type","name","enabled","targetAnimations"]);
    }
    TriggerBase.prototype.test = function()
    {
        return null;
    };
    return TriggerBase;
})(SerializableBase);
SerializableTypes.TriggerBase = TriggerBase;

var TriggerOnLoad = (function(TriggerBase) {
    __extends(TriggerOnLoad, TriggerBase);
    function TriggerOnLoad()
    {
        TriggerBase.call(this);
        this.type = "TriggerOnLoad"
    };
    TriggerOnLoad.prototype.test = function()
    {
        return { type: this.type }
    };
    return TriggerOnLoad
})(TriggerBase);
SerializableTypes.TriggerOnLoad = TriggerOnLoad;

var TriggerEntityPosition = (function(TriggerBase) {
    __extends(TriggerEntityPosition, TriggerBase);
    function TriggerEntityPosition()
    {
        TriggerBase.call(this);
        this.type = "TriggerEntityPosition";
        this.minPosition = {x: 0, y: 0, z: 0};
        this.maxPosition = {x: 0, y: 0, z: 0};
        this.ignoreHeight = false;
        this.entities = [];
        this.addSerializable(["minPosition","maxPosition","ignoreHeight","entities"]);
    };
    TriggerEntityPosition.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                if (this.ignoreHeight && IsPositionWithinXY(entity.x, entity.y,this.minPosition, this.maxPosition))
                {
                    return { type: this.type, subtype:"entity",id: entity.id };
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return { type: this.type, subtype:"entity",id: entity.id };
                }
            }
        }
        return null;
    };
    return TriggerEntityPosition;
})(TriggerBase);
SerializableTypes.TriggerEntityPosition = TriggerEntityPosition;

var TriggerRideCarPosition = (function(TriggerEntityPosition) {
    __extends(TriggerRideCarPosition, TriggerBase);
    function TriggerRideCarPosition()
    {
        TriggerRideCarPosition.call(this);
        this.type = "TriggerRideCarPosition";
        this.rideId = 65535;
        this.addSerializable(["rideId"]);
    };
    TriggerRideCarPosition.prototype.test = function()
    {
        var ride = map.getRide(this.rideId)
        if (ride == null)
        {
            return null;
        }
        var vehicles = ride.vehicles;
        for (var i = 0; i < vehicles.length; i++)
        {
            var entity = vehicles[i];
            if (entity != null)
            {
                if (this.ignoreHeight && IsPositionWithinXY(entity.x, entity.y,this.minPosition, this.maxPosition))
                {
                    return {type: this.type, subtype:"car",id: entity.id};
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return {type: this.type, subtype:"car",id: entity.id};
                }
            }
        }
        return null;
    };
    return TriggerRideCarPosition;
})(TriggerEntityPosition);
SerializableTypes.TriggerRideCarPosition = TriggerRideCarPosition;

var TriggerRandomTile = (function(TriggerBase) {
    __extends(TriggerRandomTile,TriggerBase);
    function TriggerRandomTile()
    {
        this.minPosition = {x: 0, y: 0, z: 0};
        this.maxPosition = {x: 0, y: 0, z: 0};
        this.ignoreHeight = false;
        this.addSerializable(["minPosition","maxPosition","ignoreHeight"]);
    };
    TriggerRandomTile.prototype.test = function()
    {
        var x = context.getRandom(this.minPosition.x, this.maxPosition.x);
        var y = context.getRandom(this.minPosition.y, this.maxPosition.y);
        if (this.ignoreHeight)
        {
            return { type: this.type, subtype:"tileXY",coordinates:{ x: x, y: y } };
        }
        var z = context.getRandom(this.minPosition.z, this.maxPosition.z);
        return { type: this.type, subtype:"tileXYZ",coordinates:{ x: x, y: y, z: z } };
    };
    return TriggerRandomTile;
})(TriggerBase);
SerializableTypes.TriggerRandomTile = TriggerRandomTile;


// Actions
var ActionBase = (function (SerializableBase) {
    __extends(ActionBase, SerializableBase);
    function ActionBase()
    {
        SerializableBase.call(this);
        this.type = "ActionBase";
        this.name = "Action";
        this.enabled = true;
        this.addSerializable(["name","enabled"]);
    };
    ActionBase.prototype.execute = function()
    {
    };
    return ActionBase;
})(SerializableBase);
SerializableTypes.ActionBase = ActionBase;

var ActionPostMessage = (function(ActionBase) {
    __extends(ActionPostMessage, ActionBase);
    function ActionPostMessage()
    {
        this.type = "ActionPostMessage";
        this.text = null;
        this.messageType = null; // see ParkMessageType in openrct2.d.ts
        this.subject = null;
        this.addSerializable(["text","messageType","subject"]);
    };
    ActionPostMessage.prototype.execute = function(registry)
    {
        if (this.text === null)
            return;
        if (this.messageType === null)
        {
            park.PostMessage(this.text);
            return;
        }
        park.PostMessage({type: this.messageType, text: this.text, subject: this.subject});
    };
    return ActionPostMessage;
})(ActionBase);
SerializableTypes.ActionPostMessage = ActionPostMessage;

var ActionExecuteAction = (function(ActionBase) {
    __extends(ActionExecuteAction, ActionBase);
    function ActionExecuteAction()
    {
        this.type = "ActionExecuteAction";
        this.action = null;
        this.arguments = {};
        this.addSerializable(["action","arguments"]);
    };
    ActionExecuteAction.prototype.execute = function(registry)
    {
        if (this.action === null)
            return;
        context.ExecuteAction(this.action,this.arguments,function(){});
    };
    return ActionExecuteAction;
})(ActionBase);
SerializableTypes.ActionExecuteAction = ActionExecuteAction;

var ActionSetAnimationProperties = (function(ActionBase) {
    __extends(ActionSetAnimationProperties, ActionBase);
    function ActionSetAnimationProperties()
    {
        this.type = "ActionSetAnimationProperties";
        this.target = null;
        this.targetProperties = {};
        this.addSerializable(["target","targetProperties"]);
    }
    ActionSetAnimationProperties.prototype.execute = function(registry)
    {
        // Todo
    };
    return ActionSetAnimationProperties;
})(ActionBase);
SerializableTypes.ActionSetAnimationProperties = ActionSetAnimationProperties;

var ActionSetTriggerProperties = (function(ActionBase) {
    __extends(ActionSetTriggerProperties, ActionBase);
    function ActionSetTriggerProperties()
    {
        this.type = "ActionSetTriggerProperties";
        this.target = null;
        this.targetProperties = {};
        this.addSerializable(["target","targetProperties"]);
    }
    ActionSetTriggerProperties.prototype.execute = function(registry)
    {
        // Todo
    };
    return ActionSetTriggerProperties;
})(ActionBase)
SerializableTypes.ActionSetTriggerProperties = ActionSetTriggerProperties;

var AnimationFrame = (function(SerializableBase) {
    __extends(AnimationFrame,SerializableBase);
    function AnimationFrame()
    {
        SerializableBase.call(this);
        this.type = "AnimationFrame";
        this.index = 0;
        this.minIndex = null;
        this.maxIndex = null;
        this.actions = [];
        this.addSerializable(["index","minIndex","maxIndex"]);
    };
    AnimationFrame.prototype.shouldPlayOnIndex = function(index)
    {
        return index !== null && ((index === this.index) || (this.minIndex !== null && this.minIndex <= index) || (this.maxIndex !== null && this.maxIndex >= index));
    };
    AnimationFrame.prototype.execute = function(registry)
    {
        for (var i = 0; i < this.actions.length; i++)
        {
            this.actions[i].execute(registry);
        }
    };
    AnimationFrame.prototype.getDataToPersist = function()
    {
        var data = SerializableBase.prototype.getDataToPersist();
        data.actions = [];
        for (var i = 0; i < this.actions; i++)
        {
            data.actions.push(this.actions[i].getDataToPersist());
        }
    };
    AnimationFrame.prototype.populateFromData = function(data)
    {
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            if (this.serializableProperties[i] in data)
            {
                this[serializableProperties[i]] = data[serializableProperties[i]];
            }
        }
        for (var i = 0; i < data.actions; i++)
        {
            if (data.actions[i] === 'object' && data.actions[i].type !== null && data.actions[i].type in SerializableTypes)
            {
                var action = SerializableTypes[data.actions[i].type]();
                action.populateFromData(data.actions[i]);
            }
        }
    }
    return AnimationFrame;
})(SerializableBase);
SerializableTypes.AnimationFrame = AnimationFrame;

var AnimationBase = (function(SerializableBase) {
    __extends(AnimationBase,SerializableBase);
    function AnimationBase()
    {
        SerializableBase.call(this);
        this.type = "Animation";
        this.name = "Animation";
        this.enabled = true;
        this.numFrames = 0;
        this.numLoops = 0; //-1 for infinite
        this.currentLoop = 0;
        this.intervalTicks = 1;
        this.allowMultiple = false; // allow animation to play again before finishing
        this.globalRegistry = true; // registry is shared between animation plays
        this.animationFrames = [];
        this.baseRegistry = {}; //all additional properties
        this.addSerializable(["name","enabled","numFrames","numLoops","currentLoop","intervalTicks","allowMultiple","globalRegistry","animationFrames","baseRegistry"]);
    };
    AnimationBase.prototype.Begin = function(activator)
    {
        this.registry.trigger = activator;
    };
    return AnimationBase;
})(SerializableBase);

var AnimationPlaying = (function(SerializableBase) {
    __extends(AnimationPlaying,SerializableBase);
    function AnimationPlaying()
    {
        SerializableBase.call(this);
        this.type = "Animation";
        this.name = "Animation";
        this.currentFrame = 0;
        this.registry = {}; //all additional properties
    };
    AnimationPlaying.prototype.NextFrame = function()
    {
        this.currentFrame++;
        if (this.currentFrame >= this.numFrames)
        {
            this.currentFrame = 0;
            this.numLoops += 1;
            //remove from playing animations list
        }
    };
    return AnimationPlaying;
})(SerializableBase);

function AnimationService()
{
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
AnimationService.prototype.reset = function()
{
    this.animationsRunning = [], this.animationRunI = 0, this.tickCount = 0
}
AnimationService.prototype.evaulateTriggers = function() {
    
}
AnimationService.prototype.tick = function()
{
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
    name: "Animator-2",
    version: "0.0.2",
    authors: ["spacek"],
    type: "intransient",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: function() { console.log("Hello World from Animator-2")}
})