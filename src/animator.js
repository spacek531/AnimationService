// Copyright (c) 2024 spacek531
// inspired by the animator-0.0.1-lc-r3.js plugin copyrigt deanosrs 2024, released under GPL 3.0.
var kPluginVersion = "0.0.2";
var kParkStorageKey = "AnimationService";
var gAnimationService = null;

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
        this.serializableProperties = ["type"];
        this.serializeObjectArrays = [];
        this.type = "SerializableBase";
    }
    SerializableBase.prototype.addSerializableProperties = function(newProperties)
    {
        this.serializableProperties = this.serializableProperties.concat(newProperties);
    };
    SerializableBase.prototype.addSerializableArrays = function(newProperties)
    {
        this.serializeObjectArrays = this.serializeObjectArrays.concat(newProperties);
    };
    SerializableBase.prototype.serialize = function()
    {
        var data = {};
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var arrayName = this.serializeObjectArrays[i];
            data[arrayName] = [];
            for (var k = 0; k < this[arrayName].length; k++)
            {
                data[arrayName].push(this[arrayName][k].serialize)
            }
        }
        data = this.serializableProperties.reduce(function(obj2, key) {if (key in this){obj2[key] = this[key];} return obj2;},data);
        console.log("serialize data for type: "+this.type)
        return data
    };
    SerializableBase.prototype.deserialize = function(data)
    {
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            if (this.serializableProperties[i] in data)
            {
                this[this.serializableProperties[i]] = data[this.serializableProperties[i]];
            }
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var arrayName = this.serializeObjectArrays[i];
            var arrayData = data[arrayName];
            if (Array.isArray(arrayData))
            {
                for (var k = 0; k < arrayData.length; k++)
                {
                    var currentElement = arrayData[currentElement];
                    if (currentElement === 'object' && currentElement.type in SerializableTypes)
                    {
                        var objectElement = new SerializableTypes[currentElement.type]();
                        objectElement.deserialize(objectElement);
                        this[arrayName].push(objectElement);
                    }
                }
            }
        }
    }
    SerializableBase.prototype.delete = function()
    {
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var objectArray = this[this.serializeObjectArrays[i]];
            for (var k = 0; k < this[this.serializeObjectArrays[i]].length; k++)
            {
                objectArray[k].delete();
                objectArray[k] = null;
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
        this.addSerializableProperties(["name","enabled","targetAnimations"]);
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
        return { type: this.type, name: this.name }
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
        this.addSerializableProperties(["minPosition","maxPosition","ignoreHeight","entities"]);
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
                    return { type: this.type, name: this.name, entityType: entity.type, id: entity.id };
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return { type: this.type, name: this.name, entityType: entity.type, id: entity.id };
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
        this.addSerializableProperties(["rideId"]);
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
                    return {type: this.type, name: this.name, entityType: entity.type,id: entity.id};
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return {type: this.type, name: this.name, entityType: entity.type ,id: entity.id};
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
        this.addSerializableProperties(["minPosition","maxPosition","ignoreHeight"]);
    };
    TriggerRandomTile.prototype.test = function()
    {
        var x = context.getRandom(this.minPosition.x, this.maxPosition.x);
        var y = context.getRandom(this.minPosition.y, this.maxPosition.y);
        if (this.ignoreHeight)
        {
            return { type: this.type, name: this.name, coordsType: "tileCoordsXY", coordinates:{ x: x, y: y } };
        }
        var z = context.getRandom(this.minPosition.z, this.maxPosition.z);
        return { type: this.type, name: this.name, coordsType:"tileCoordsXYZ", coordinates:{ x: x, y: y, z: z } };
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
        this.addSerializableProperties(["name","enabled"]);
    };
    ActionBase.prototype.execute = function(storage)
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
        this.addSerializableProperties(["text","messageType","subject"]);
    };
    ActionPostMessage.prototype.execute = function(storage)
    {
        if (this.text === null)
            return;
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
        this.addSerializableProperties(["action","arguments"]);
    };
    ActionExecuteAction.prototype.execute = function(storage)
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
        this.addSerializableProperties(["target","targetProperties"]);
    }
    ActionSetAnimationProperties.prototype.execute = function(storage)
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
        this.addSerializableProperties(["target","targetProperties"]);
    }
    ActionSetTriggerProperties.prototype.execute = function(storage)
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
        this.addSerializableProperties(["index","minIndex","maxIndex"]);
        this.addSerializableArrays(["actions"]);
    };
    AnimationFrame.prototype.execute = function(currentFrame, storage)
    {
        // returns true if the animation frame will not be executed after the current frame
        if ((this.minIndex !== null && currentFrame < this.minIndex) || (this.maxIndex !== null && currentFrame > this.maxIndex) || (this.index !== null && currentFrame != this.index))
        {
            return (this.maxIndex !== null && currentFrame == this.maxIndex) || (this.index !== null && currentFrame > this.index);
        }
        for (var i = 0; i < this.actions.length; i++)
        {
            this.actions[i].execute(storage);
        }
        return (this.maxIndex !== null && currentFrame == this.maxIndex) || this.index !== null;
    };
    return AnimationFrame;
})(SerializableBase);
SerializableTypes.AnimationFrame = AnimationFrame;

var AnimationPlayer = (function(SerializableBase) {
    __extends(AnimationPlayer,SerializableBase);
    function AnimationPlayer(animationBase)
    {
        SerializableBase.call(this);
        this.type = "AnimationPlayer";
        this.animation = animationBase;
        this.currentTick = -1;
        this.currentFrame = -1; // initialize at -1 to trigger inequal comparison
        this.currentLoop = 0;
        this.currentStartFrame = 0;
        if (animationBase.persistentStorage)
        {
            // AnimationPlayer sets this when deserializing
            this.storage = animationBase.storage;
        }
        else
        {
            this.storage = {};
            Object.assign(this.storage, animationBase.storage);
        }
        this.addSerializableProperties(["currentTick","currentFrame","currentLoop","storage","currentStartFrame"]);
    };
    AnimationPlayer.prototype.playFrame = function(currentFrame)
    {
        this.currentFrame = currentFrame;
        this.storage.currentFrame = currentFrame;
        this.storage.currentTick = this.currentTick;
        for (var i = currentStartFrame; i < this.animation.animationFrames.length; i++)
        {
            // abusing lazy evaluation
            this.animation.animationFrames[i].execute(currentFrame,this.storage) && i == currentStartFrame && this.currentStartFrame++;
        }
        if (this.currentFrame == this.animation.numFrames)
            return true;
    };
    AnimationPlayer.prototype.nextTick = function(globalCurrentTick)
    {
        // Returns true if the animation is finished playing
        this.currentTick++;
        this.storage.globalCurrentTick = globalCurrentTick;
        this.storage.currentTick = this.currentTick;
        if (this.currentTick % this.animation.tickInterval == 0)
        {
            if (this.PlayFrame(this.currentFrame + 1))
            {
                this.currentLoop++;
                this.storage.currentLoop++;
                if (this.currentLoop == this.animation.numLoops)
                {
                    return true;
                }
            }
        }
        return;
    };
    return AnimationPlayer;
})(SerializableBase);
SerializableTypes.AnimationPlayer = AnimationPlayer;

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
        this.tickInterval = 1;
        this.allowMultiple = false; // allow animation to play multiple times simultaneously
        this.persistentStorage = false; // storage is not copied for each animation player instance
        this.animationFrames = [];
        this.storage = {}; //all additional properties
        this.playingAnimations = [];
        this.addSerializableProperties(["name","enabled","numFrames","numLoops","currentLoop","tickInterval","allowMultiple","globalRegistry","animationFrames","storage"]);
        this.addSerializableArrays(["animationFrames"]);
    };
    AnimationBase.prototype.initialize = function(trigger, globalCurrentTick)
    {
        if (this.playingAnimations.length > 0 && !this.allowMultiple)
            return;
        this.storage.trigger = trigger;
        var newAnimationPlayer = new AnimationPlayer(this);
        newAnimationPlayer.nextTick(globalCurrentTick);
        this.playingAnimations.push(newAnimationPlayer);
    };
    AnimationBase.prototype.tick = function(globalCurrentTick)
    {
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            this.playingAnimations[i].nextTick(globalCurrentTick);
        }
    };
    AnimationBase.prototype.deserialize = function(data)
    {
        SerializableBase.prototype.deserialize.call(this, data);
        for (i = 0; i < data.playingAnimations.length; i++)
        {
            var player = new AnimationPlayer(this);
            player.deserialize(data.playingAnimations[i]);
            this.playingAnimations.push(player);
        }
    };
    AnimationBase.prototype.serialize = function()
    {
        data = SerializableBase.prototype.deserialize.call(this);
        data.playingAnimations = [];
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            data.playingAnimations.push(this.playingAnimations[i].serialize());
        }
        return data;
    };
    AnimationBase.prototype.delete = function()
    {
        SerializableBase.prototype.delete.call(this)
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            delete this.playingAnimations[i];
        }
    }
    return AnimationBase;
})(SerializableBase);
SerializableTypes.AnimationBase = AnimationBase;

var AnimationService = (function(SerializableBase) {
    __extends(AnimationService,SerializableBase);
    function AnimationService()
    {
        SerializableBase.call(this);
        this.type = "AnimationService";
        this.initialize();
        this.addSerializableProperties(["tickCount","version","paused","authors"]);
        this.addSerializableArrays(["triggers","animations"]);
        context.subscribe("interval.tick",this.tick.bind(this));
        context.subscribe("map.changed",this.newMap.bind(this));
        context.subscribe("map.save",this.save.bind(this));
        if (["normal","title","scenario_editor","track_designer","track_manager"].indexOf(context.mode) > -1)
        {
            this.newMap();
        }
    };
    AnimationService.prototype.initialize = function()
    {
        this.tickCount = 0; // how many ticks have elapsed under the plugin's purview
        this.paused = false; // if the animation service is halted
        this.version = kPluginVersion; // the version of the saved animation
        this.authors = []; // the authors of the saved animation
        this.triggers = [];
        this.animations = [];
        this.triggerMap = {}; // easy lookup of triggers by name
        this.animationMap = {}; // easy lookup of animations by name
        this.shouldSave = false;
    };
    AnimationService.prototype.tick = function()
    {
        if (this.paused || context.paused)
        {
            return;
        }
        this.tickCount++;
        // step 1. increment already-running animations
        for (var i = 0; i < this.animations.length; i++)
        {
            this.playingAnimations[i].length > 0 && this.playingAnimations[i].tick(this.tickCount);
        }
        // step 2. evaluate triggers and initialize the associated animations
        var activations = [];
        for (var i = 0; i < this.triggers.length; i++)
        {
            
        }
        
    };
    AnimationService.prototype.deserialize = function()
    {
        this.initialize();
        var data = {}
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var datum = context.getParkStorage(kParkStorageKey).get(this.serializableProperties[i]);
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var datum = context.getParkStorage(kParkStorageKey).get(this.serializeObjectArrays[i]);
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        this.shouldSave = data.version !== null;
        if (this.shouldSave)
        {
            SerializableBase.prototype.deserialize.call(this,data);
        }
    };
    AnimationService.prototype.unload = function()
    {
        this.delete();
    };
    AnimationService.prototype.newMap = function()
    {
        this.unload();
        this.deserialize();
    };
    AnimationService.prototype.serialize = function()
    {
        this.serialize()
        this.shouldSave = true;
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var key = this.serializableProperties[i]
            context.getParkStorage(kParkStorageKey).set(key, this[key]);
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var key = this.serializeObjectArrays[i]
            context.getParkStorage(kParkStorageKey).set(key, this[key]);
        }
    };
    AnimationService.prototype.save = function()
    {
        this.shouldSave && this.serialize()
    };
    return AnimationService;
})(SerializableBase);

registerPlugin({
    name: "Animator-2",
    version: kPluginVersion,
    authors: ["spacek","deanosrs"],
    type: "intransient",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: function() {gAnimationService = new AnimationService(); globalThis.animation = gAnimationService;}
});