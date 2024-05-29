// Copyright (c) 2024 spacek531
// inspired by the animator-0.0.1-lc-r3.js plugin copyrigt deanosrs 2024, released under GPL 3.0.
var kPluginVersion = "0.1.0";
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
    return entX >= minP.x && entX <= maxP.x && entY >= minP.y && entY <= maxP.y && entZ >= minP.z && entZ <= maxP.z;
}
function BuildMap(array)
{
    var map = {}
    for (var i = 0; i < array.length; i++)
    {
        map[array[i].name] = array[i];
    }
    return map;
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
            //console.log("Serializing array ".concat(arrayName));
            data[arrayName] = [];
            for (var k = 0; k < this[arrayName].length; k++)
            {
                data[arrayName].push(this[arrayName][k].serialize())
            }
        }
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            //console.log("Serializing property '".concat(this.serializableProperties[i],"' as ", this[this.serializableProperties[i]]));
            var value = this[this.serializableProperties[i]];
            if (value !== null && value !== undefined)
            {
                data[this.serializableProperties[i]] = value;
            }
        }
        return data
    };
    SerializableBase.prototype.deserialize = function(data)
    {
        if ("deserialize" in data)
        {
            var e = Error();
            console.log(e.stack);
            return;
        }
        //console.log("Deserializing object", this);
        //console.log("data", data);
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            //console.log("Touching serializable property ".concat(this.serializableProperties[i]));
            if (this.serializableProperties[i] in data)
            {
                this[this.serializableProperties[i]] = data[this.serializableProperties[i]];
            //console.log("Loaded property '".concat(this.serializableProperties[i],"' as ",data[this.serializableProperties[i]]));
            }
            else
            {
                this[this.serializableProperties[i]] = null;
            }
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var arrayName = this.serializeObjectArrays[i];
            var arrayData = data[arrayName];
            //console.log("loading ".concat(arrayName," with ",arrayData.length," elements"));
            if (Array.isArray(arrayData))
            {
                //console.log("it is an array!")
                for (var k = 0; k < arrayData.length; k++)
                {
                    var currentData = arrayData[k];
                    if ("deserialize" in currentData)
                    {
                        console.log("Data should not be an initialized object!");
                        console.log("i",i,"k",k);
                        console.log("this",this);
                        console.log("arrayName",arrayName);
                        console.log("arrayData",arrayData);
                        console.log("currentData",currentData);
                        var e = Error();
                        console.log(e.stack);
                        return;
                        
                    }
                    //console.log("deserializing currently", this, currentData);
                    if (typeof currentData == 'object' && currentData.type in SerializableTypes)
                    {
                        var objectElement = new SerializableTypes[currentData.type]();
                        //console.log("Initializing object", objectElement);
                        //console.log("passing it data", currentData);
                        objectElement.deserialize.call(objectElement, currentData);
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
    };
    return SerializableBase;
})();
SerializableTypes.SerializableBase = SerializableBase;

var SensorBase = (function (SerializableBase) {
    __extends(SensorBase, SerializableBase);
    function SensorBase()
    {
        SerializableBase.call(this);
        this.type = "SensorBase";
        this.enabled = true;
        this.addSerializableProperties(["enabled"]);
    }
    SensorBase.prototype.test = function()
    {
        return {};
    };
    return SensorBase;
})(SerializableBase);
SerializableTypes.SensorBase = SensorBase;

var SensorEntityPropertyEquals = (function(SensorBase) {
    __extends(SensorEntityPropertyEquals, SensorBase);
    function SensorEntityPropertyEquals()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPropertyEquals";
        this.value = null;
        this.property = null;
        this.entities = [];
        this.addSerializableProperties(["value","property","entities"]);
    };
    SensorEntityPropertyEquals.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                if (entity[this.property] == this.value)
                {
                    return { type: this.type, entityType: entity.type, id: entity.id, property = entity[this.property], value = entity[this.property] };
                }
            }
        }
        return null;
    };
    return SensorEntityPropertyEquals;
})(SensorBase);
SerializableTypes.SensorEntityPropertyEquals = SensorEntityPropertyEquals;

var SensorEntityPropertyInRange = (function(SensorBase) {
    __extends(SensorEntityPropertyInRange, SensorBase);
    function SensorEntityPropertyInRange()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPropertyInRange";
        this.minValue = null;
        this.maxValue = null;
        this.inclusive = true;
        this.property = null;
        this.entities = [];
        this.addSerializableProperties(["minValue","maxValue","property","inclusive","entities"]);
    };
    SensorEntityPropertyInRange.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                var value = entity[property];
                var success = (this.inclusive? this.minValue !== null && value >= this.minValue : this.minValue !== null && value > this.minValue) && this.inclusive? this.maxValue !== null && value <= this.maxValue : this.maxValue !== null && value < this.maxValue;
                if (success)
                {
                    return { type: this.type, entityType: entity.type, id: entity.id, property = entity[this.property], value = entity[this.property] };
                }
            }
        }
        return null;
    };
    return SensorEntityPropertyInRange;
})(SensorBase);
SerializableTypes.SensorEntityPropertyInRange = SensorEntityPropertyInRange;

var SensorEntityPosition = (function(SensorBase) {
    __extends(SensorEntityPosition, SensorBase);
    function SensorEntityPosition()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPosition";
        this.minPosition = {x: 0, y: 0, z: 0};
        this.maxPosition = {x: 0, y: 0, z: 0};
        this.ignoreHeight = false;
        this.entities = [];
        this.addSerializableProperties(["minPosition","maxPosition","ignoreHeight","entities"]);
    };
    SensorEntityPosition.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                if (this.ignoreHeight && IsPositionWithinXY(entity.x, entity.y,this.minPosition, this.maxPosition))
                {
                    return { type: this.type, entityType: entity.type, id: entity.id };
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return { type: this.type, entityType: entity.type, id: entity.id };
                }
            }
        }
        return null;
    };
    return SensorEntityPosition;
})(SensorBase);
SerializableTypes.SensorEntityPosition = SensorEntityPosition;

var SensorRideCarPosition = (function(SensorEntityPosition) {
    __extends(SensorRideCarPosition, SensorBase);
    function SensorRideCarPosition()
    {
        SensorEntityPosition.call(this);
        this.type = "SensorRideCarPosition";
        this.rideId = null;
        this.addSerializableProperties(["rideId"]);
    };
    SensorRideCarPosition.prototype.test = function()
    {
        if (this.rideId == null)
        {
            console.log("rideId was null");
            return null;
        }
        var ride = map.getRide(this.rideId)
        if (ride == null)
        {
            console.log("could not get ride");
            return null;
        }
        var vehicles = ride.vehicles;
        for (var i = 0; i < vehicles.length; i++)
        {
            var entity = map.getEntity(vehicles[i]);
            if (entity != null)
            {
                if (this.ignoreHeight && IsPositionWithinXY(entity.x, entity.y,this.minPosition, this.maxPosition))
                {
                    return {type: this.type, entityType: entity.type,id: entity.id};
                }
                if (IsPositionWithinXYZ(entity.x, entity.y, entity.z, this.minPosition, this.maxPosition))
                {
                    return {type: this.type, entityType: entity.type ,id: entity.id};
                }
            }
        }
        return null;
    };
    return SensorRideCarPosition;
})(SensorEntityPosition);
SerializableTypes.SensorRideCarPosition = SensorRideCarPosition;

var SensorRandomTile = (function(SensorBase) {
    __extends(SensorRandomTile,SensorBase);
    function SensorRandomTile()
    {
        this.minPosition = {x: 0, y: 0, z: 0};
        this.maxPosition = {x: 0, y: 0, z: 0};
        this.ignoreHeight = false;
        this.addSerializableProperties(["minPosition","maxPosition","ignoreHeight"]);
    };
    SensorRandomTile.prototype.test = function()
    {
        var x = context.getRandom(this.minPosition.x, this.maxPosition.x);
        var y = context.getRandom(this.minPosition.y, this.maxPosition.y);
        if (this.ignoreHeight)
        {
            return { type: this.type, coordsType: "tileCoordsXY", coordinates:{ x: x, y: y } };
        }
        var z = context.getRandom(this.minPosition.z, this.maxPosition.z);
        return { type: this.type, coordsType:"tileCoordsXYZ", coordinates:{ x: x, y: y, z: z } };
    };
    return SensorRandomTile;
})(SensorBase);
SerializableTypes.SensorRandomTile = SensorRandomTile;

// Triggers
var TriggerBase = (function (SerializableBase) {
    __extends(TriggerBase,SerializableBase)
    function TriggerBase()
    {
        SerializableBase.call(this);
        this.type = "TriggerBase";
        this.name = "TriggerBase";
        this.enabled = true;
        this.currentTimeout = 0;
        this.timeout = 0;
        this.sensors = [];
        this.targetAnimations = [];
        this.addSerializableProperties(["name","enabled","targetAnimations","currentTimeout", "timeout"]);
        this.addSerializableArrays(["sensors"]);
    };
    TriggerBase.prototype.test = function()
    {
        var returnValue = {};
        // evaluates in reverse order so that the 1st sensor gives the trigger payload
        for (var i = this.sensors.length - 1; i >= 0; i++)
        {
            if (!this.sensors[i].enabled)
            {
                continue;
            }
            returnValue = returnValue && this.sensors[i].test();
            if (!returnValue)
            {
                return null;
            }
        }
        return returnValue;
    };
    TriggerBase.prototype.rename = function(newName)
    {
        gAnimationService.triggersMap[this.name] = null
        gAnimationService.triggersMap[newName] = this
        this.name = newName
    };
    TriggerBase.prototype.newSensor = function(sensorType)
    {
        if (typeof sensorType != 'string' || typeof name != 'string')
        {
            return "usage: newSensor(sensorType: string, enabled?: boolean): SensorBase Valid types are: ".concat(Object.keys(SerializableTypes).filter(function(tName){return tName.substring(0,6) == "Sensor"}).join(", "));
        }
        var newSensor = new SerializableTypes[triggerType]();
        newSensor.enabled = enabled === undefined ? true : enabled;
        this.sensors.push(newSensor);
        return newSensor;
    };
    return TriggerBase;
})(SerializableBase);
SerializableTypes.TriggerBase = TriggerBase;

var TriggerOnLoad = (function(TriggerBase) {
    __extends(TriggerOnLoad, TriggerBase);
    function TriggerOnLoad()
    {
        TriggerBase.call(this);
        this.type = "TriggerOnLoad";
        this.name = "TriggerOnLoad";
    };
    return TriggerOnLoad
})(TriggerBase);
SerializableTypes.TriggerOnLoad = TriggerOnLoad;

// Actions
var ActionBase = (function (SerializableBase) {
    __extends(ActionBase, SerializableBase);
    function ActionBase()
    {
        SerializableBase.call(this);
        this.type = "ActionBase";
        this.enabled = true;
        this.addSerializableProperties(["enabled"]);
    };
    ActionBase.prototype.execute = function(storage)
    {
    };
    return ActionBase;
})(SerializableBase);
SerializableTypes.ActionBase = ActionBase;

// not verified
var ActionConsoleMessage = (function(ActionBase) {
    __extends(ActionConsoleMessage,ActionBase)
    function ActionConsoleMessage()
    {
        ActionBase.call(this);
        this.type = "ActionConsoleMessage";
        this.text = null;
        this.addSerializableProperties(["text"]);
    };
    ActionConsoleMessage.prototype.execute = function(storage)
    {
        console.log(this.text);
    };
    return ActionConsoleMessage;
})(ActionBase);
SerializableTypes.ActionConsoleMessage = ActionConsoleMessage;

// verified working
var ActionPostMessage = (function(ActionBase) {
    __extends(ActionPostMessage, ActionBase);
    function ActionPostMessage()
    {
        ActionBase.call(this);
        this.type = "ActionPostMessage";
        this.text = null;
        this.messageType = "blank"; // see ParkMessageType in openrct2.d.ts
        this.subject = null;
        this.addSerializableProperties(["text","messageType","subject"]);
    };
    ActionPostMessage.prototype.execute = function(storage)
    {
        if (this.text)
        {
            park.postMessage({type: this.messageType, text: this.text, subject: this.subject});
        }
    };
    return ActionPostMessage;
})(ActionBase);
SerializableTypes.ActionPostMessage = ActionPostMessage;

// verified working
var ActionExecuteAction = (function(ActionBase) {
    __extends(ActionExecuteAction, ActionBase);
    function ActionExecuteAction()
    {
        ActionBase.call(this);
        this.type = "ActionExecuteAction";
        this.action = null;
        this.arguments = {};
        this.addSerializableProperties(["action","arguments"]);
    };
    ActionExecuteAction.prototype.execute = function(storage)
    {
        if (this.action)
        {
            context.executeAction(this.action,this.arguments,function(){});
        }
    };
    return ActionExecuteAction;
})(ActionBase);
SerializableTypes.ActionExecuteAction = ActionExecuteAction;

// not verified
var ActionCarSetProperties = (function(ActionBase) {
    __extends(ActionCarSetProperties, ActionBase);
    function ActionCarSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionCarSetProperties";
        this.carProperties = []; // array of dictionaries where index is car number
        this.addSerializableProperties(["carProperties"]);
    }
    ActionCarSetProperties.prototype.execute = function(storage)
    {
        if ((storage.entityType != "car") || typeof storage.id != 'number')
        {
            return;
        }
        var car = map.getEntity(storage.id);
        for (var i = 0; i < this.carProperties && car; i++)
        {
            var properties = this.carProperties[i];
            for (var key in properties)
            {
                car[key] = properties[key];
            }
            car = car.nextCarOnTrain;
        }
    };
    return ActionCarSetProperties;
})(ActionBase);
SerializableTypes.ActionCarSetProperties = ActionCarSetProperties;

// not verified
var ActionPlayAnimation = (function(ActionBase) {
    __extends(ActionPlayAnimation, ActionBase);
    function ActionPlayAnimation()
    {
        ActionBase.call(this);
        this.type = "ActionPlayAnimation";
        this.targets = []; // names of animations
        this.addSerializableProperties(["targets"]);
    }
    ActionPlayAnimation.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.targets.length; i++)
        {
            var target = this.targets[i];
            var animation = target in gAnimationService.animationsMap && gAnimationService.animationsMap[target];
            if (animation)
            {
                animation.initialize({ type: this.type },storage.globalCurrentTick);
            }
        }
    };
    return ActionPlayAnimation;
})(ActionBase);
SerializableTypes.ActionPlayAnimation = ActionPlayAnimation;

// verified working
var ActionAnimationSetProperties = (function(ActionBase) {
    __extends(ActionAnimationSetProperties, ActionBase);
    function ActionAnimationSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionAnimationSetProperties";
        this.targets = []; // names of animation
        this.targetProperties = {};
        this.addSerializableProperties(["targets","targetProperties"]);
    }
    ActionAnimationSetProperties.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.targets.length; i++)
        {
            var target = this.targets[i];
            var animation = target in gAnimationService.animationsMap && gAnimationService.animationsMap[target];
            if (animation)
            {
                for (var key in this.targetProperties)
                {
                    if (key == "name")
                        
                    {
                        animation.rename(this.targetProperties.name);
                    }
                    else
                    {
                        console.log("setting animation property",key,this.targetProperties[key]);
                        animation[key] = this.targetProperties[key];
                    }
                }
            }
        }
    };
    return ActionAnimationSetProperties;
})(ActionBase);
SerializableTypes.ActionAnimationSetProperties = ActionAnimationSetProperties;

// not verified
var ActionTriggerSetProperties = (function(ActionBase) {
    __extends(ActionTriggerSetProperties, ActionBase);
    function ActionTriggerSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionTriggerSetProperties";
        this.targets = []; // names of animation
        this.targetProperties = {};
        this.addSerializableProperties(["targets","targetProperties"]);
    }
    ActionTriggerSetProperties.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.targets.length; i++)
        {
            var target = this.targets[i];
            var trigger = target in gAnimationService.triggersMap && gAnimationService.triggersMap[target];
            if (trigger)
            {
                for (var key in this.targetProperties)
                {
                    if (key == "name")
                    {
                        trigger.rename(this.targetProperties.name);
                    }
                    else
                    {
                        trigger[key] = this.targetProperties[key];
                    }
                }
            }
        }
    };
    return ActionTriggerSetProperties;
})(ActionBase)
SerializableTypes.ActionTriggerSetProperties = ActionTriggerSetProperties;

// not verified
var ActionEntitySetProperties = (function(ActionBase) {
    __extends(ActionEntitySetProperties, ActionBase);
    function ActionEntitySetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionEntitySetProperties";
        this.target = null;
        this.targetProperties = {};
        this.addSerializableProperties(["target","targetProperties"]);
    }
    ActionEntitySetProperties.prototype.execute = function(storage)
    {
        var entity = map.getEntity(target);
        if (entity)
        {
            for (var key in this.targetProperties)
            {
                entity[key] = this.targetProperties[key];
            }
        }
    };
    return ActionEntitySetProperties;
})(ActionBase)
SerializableTypes.ActionEntitySetProperties = ActionEntitySetProperties;

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
        console.log("executing animation frame with index",this.index);
        if ((this.minIndex !== null && currentFrame < this.minIndex) || (this.maxIndex !== null && currentFrame > this.maxIndex) || (this.index !== null && currentFrame != this.index))
        {
            console.log("it's not my turn yet!");
            return (this.maxIndex !== null && currentFrame == this.maxIndex) || (this.index !== null && currentFrame > this.index);
        }
        for (var i = 0; i < this.actions.length; i++)
        {
            this.actions[i].enabled && this.actions[i].execute(storage);
        }
        return (this.maxIndex !== null && currentFrame == this.maxIndex) || (this.index !== null && currentFrame == this.index);
    };
    AnimationFrame.prototype.newAction = function(actionType)
    {
        if (typeof actionType != 'string' || !(actionType in SerializableTypes))
        {
            return "usage: newAction(actionType: string): ActionBase Valid types are: ".concat(Object.keys(SerializableTypes).filter(function(tName){return tName.substring(0,6) == "Action"}).join(", "));
        }
        var newAction = new SerializableTypes[actionType]();
        this.actions.push(newAction);
        return newAction
    }
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
        this.storage.currentFrame = this.currentFrame;
        this.storage.currentTick = this.currentTick;
        for (var i = this.currentStartFrame; i < this.animation.animationFrames.length; i++)
        {
            var frame = this.animation.animationFrames[i];
            if (frame.execute(currentFrame, this.storage) && i == this.currentStartFrame)
            {
                console.log("this animation frame is passed us!")
                this.currentStartFrame++;
            }
        }
        return this.currentStartFrame == this.animation.animationFrames.length;
    };
    AnimationPlayer.prototype.nextTick = function(globalCurrentTick)
    {
        // Returns true if the animation is finished playing
        this.currentTick++;
        if ((this.currentTick % this.animation.tickInterval) == 0)
        {
            this.storage.globalCurrentTick = globalCurrentTick;
            this.storage.currentTick = this.currentTick;
            if (this.playFrame(++this.currentFrame))
            {
                if (this.currentLoop == this.animation.numLoops)
                {
                    return true;
                }
                this.currentLoop++;
                this.storage.currentLoop++;
                this.currentStartFrame = 0;
                this.currentTick = -1;
                this.currentFrame = -1;
            }
        }
        return false;
    };
    return AnimationPlayer;
})(SerializableBase);
SerializableTypes.AnimationPlayer = AnimationPlayer;

var AnimationBase = (function(SerializableBase) {
    __extends(AnimationBase,SerializableBase);
    function AnimationBase()
    {
        SerializableBase.call(this);
        this.type = "AnimationBase";
        this.name = "Animation";
        this.enabled = true;
        this.numLoops = 0; //-1 for infinite
        this.tickInterval = 1;
        this.allowMultiple = false; // allow animation to play multiple times simultaneously
        this.persistentStorage = false; // storage is not copied for each animation player instance
        this.animationFrames = [];
        this.storage = {}; //all additional properties
        this.playingAnimations = [];
        this.addSerializableProperties(["name","enabled","numLoops","tickInterval","allowMultiple","persistentStorage","storage"]);
        this.addSerializableArrays(["animationFrames"]);
    };
    AnimationBase.prototype.initialize = function(trigger, globalCurrentTick)
    {
        if ((this.playingAnimations.length > 0 && !this.allowMultiple) || !this.enabled)
            return;
        console.log("initializing animation",this.name);
        this.storage.trigger = trigger;
        var newAnimationPlayer = new AnimationPlayer(this);
        var alreadyDone = newAnimationPlayer.nextTick(globalCurrentTick);
        if (!alreadyDone)
        {
            this.playingAnimations.push(newAnimationPlayer);
        }
    };
    AnimationBase.prototype.tick = function(globalCurrentTick)
    {
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            if (this.playingAnimations[i].nextTick(globalCurrentTick))
            {
                console.log("animationPlayer finished playing");
                this.playingAnimations.splice(i,1);
                i--;
            }
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
        data = SerializableBase.prototype.serialize.call(this);
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
            this.playingAnimations[i].delete();
            this.playingAnimations[i] = null;
        }
    };
    AnimationBase.prototype.rename = function(newName)
    {
        gAnimationService.animationsMap[this.name] = null
        gAnimationService.animationsMap[newName] = this
        this.name = newName
    };
    AnimationBase.prototype.newFrame = function()
    {
        var newFrame = new AnimationFrame();
        this.animationFrames.push(newFrame);
        return newFrame;
    };
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
        this.serializableProperties = ["tickCount","version","paused","authors"];
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
        this.type = "AnimationService";
        this.triggersMap = {}; // easy lookup of triggers by name
        this.animationsMap = {}; // easy lookup of animations by name
        this.shouldSave = false;
    };
    AnimationService.prototype.tick = function()
    {
        if (this.paused)
        {
            return;
        }
        this.tickCount++;
        // step 1. increment already-running animations
        for (var i = 0; i < this.animations.length; i++)
        {
            var animation = this.animations[i]
            animation.playingAnimations.length > 0 && animation.tick(this.tickCount);
        }
        // step 2. evaluate triggers and initialize the associated animations
        for (var i = 0; i < this.triggers.length; i++)
        {
            var trigger = this.triggers[i];
            var triggerData = trigger.enabled && trigger.currentDebounce == 0 && trigger.test();
            if (trigger.currentDebounce > 0)
            {
                trigger.currentDebounce--;
            }
            if (triggerData)
            {
                trigger.currentDebounce = trigger.debounceTimer;
                for (var k = 0; k < trigger.targetAnimations.length; k++)
                {
                    var animation = this.animationsMap[trigger.targetAnimations[k]];
                    if (typeof animation == 'object' && animation.enabled)
                    {
                        animation.initialize(triggerData,this.tickCount);
                    }
                }
            }
        }
    };
    AnimationService.prototype.triggerOnLoad = function()
    {
        for (var i = 0; i < this.triggers.length; i++)
        {
            var trigger = this.triggers[i];
            if (trigger.type == "TriggerOnLoad" && trigger.enabled)
            {
                for (var k = 0; k < trigger.targetAnimations.length; k++)
                {
                    var animation = this.animationsMap[trigger.targetAnimations[k]];
                    if (typeof animation == 'object' && animation.enabled)
                    {
                        animation.initialize({type:"TriggerOnLoad",name: trigger.name},this.tickCount);
                    }
                }
            }
        }
    };
    AnimationService.prototype.fromStorage = function()
    {
        var data = {}
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var datum = context.sharedStorage.get("AnimationService.".concat(this.serializableProperties[i]));
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var datum = context.sharedStorage.get("AnimationService.".concat(this.serializeObjectArrays[i]));
            data[this.serializeObjectArrays[i]] = datum === undefined ? null : datum;
        }
        this.deserialize(data);
        this.triggerOnLoad();
    };
    AnimationService.prototype.parse = function(input)
    {
        var data = JSON.parse(input)
        this.deserialize(data);
        this.triggerOnLoad();
        console.log("Loaded with ".concat(this.animations.length," animations and ",this.triggers.length," triggers"));
    }
    AnimationService.prototype.deserialize = function(data)
    {
        this.shouldSave = true;
        this.initialize();
        SerializableBase.prototype.deserialize.call(this,data);
        this.triggersMap = BuildMap(this.triggers);
        this.animationsMap = BuildMap(this.animations);
    };
    AnimationService.prototype.load = function()
    {
        var data = {}
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var datum = context.getParkStorage(kParkStorageKey).get(this.serializableProperties[i]);
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var datum = context.getParkStorage(kParkStorageKey).get(this.serializeObjectArrays[i]);
            data[this.serializeObjectArrays[i]] = datum === undefined ? null : datum;
        }
        this.shouldSave = data.version !== null;
        if (this.shouldSave)
        {
            this.deserialize(data);
            this.triggerOnLoad();
        }
    };
    AnimationService.prototype.unload = function()
    {
        this.delete();
    };
    AnimationService.prototype.newMap = function()
    {
        this.unload();
        this.load();
    };
    AnimationService.prototype.toStorage = function()
    {
        this.shouldSave = true;
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var key = this.serializableProperties[i]
            context.sharedStorage.set("AnimationBase.".concat(key), this[key]);
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var key = this.serializeObjectArrays[i];
            var data = [];
            for (var k = 0; k < this[key].length; k++)
            {
                data.push(this[key][k].serialize());
            }
            context.sharedStorage.set("AnimationBase.".concat(key), data);
        }
    };
    AnimationService.prototype.stringify = function()
    {
        this.shouldSave = true;
        var data = {};
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            data[this.serializableProperties[i]] =  this[this.serializableProperties[i]];
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var key = this.serializeObjectArrays[i]
            var data2 = [];
            for (var k = 0; k < this[key].length; k++)
            {
                data2.push(this[key][k].serialize());
            }
            data[key] = data2;
        }
        console.log(JSON.stringify(data));
    };
    AnimationService.prototype.serialize = function()
    {
        this.shouldSave = true;
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var key = this.serializableProperties[i]
            context.getParkStorage(kParkStorageKey).set(key, this[key]);
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var key = this.serializeObjectArrays[i]
            var data = [];
            for (var k = 0; k < this[key].length; k++)
            {
                data.push(this[key][k].serialize());
            }
            context.getParkStorage(kParkStorageKey).set(key, data);
        }
    };
    AnimationService.prototype.save = function()
    {
        this.shouldSave && this.serialize()
    };
    AnimationService.prototype.newAnimation = function(name, enabled)
    {
        if (typeof name != 'string')
        {
            return "usage: newAnimation(name): AnimationBase";
        }
        if (name in this.animationsMap)
        {
            return "Animation of this name already exists";
        }
        var newAnimation = new AnimationBase();
        newAnimation.name = name;
        newAnimation.enabled = enabled === undefined ? true : enabled;
        this.animations.push(newAnimation);
        this.animationsMap[name] = newAnimation;
        this.shouldSave = true;
        return newAnimation;
    };
    AnimationService.prototype.newTrigger = function(triggerType, name, enabled)
    {
        if (typeof triggerType != 'string' || typeof name != 'string')
        {
            return "usage: newTrigger(triggerType: string, name: string, enabled?: boolean): TriggerBase Valid types are: ".concat(Object.keys(SerializableTypes).filter(function(tName){return tName.substring(0,7) == "Trigger"}).join(", "));
        }
        if (name in this.triggersMap)
        {
            return "Trigger of this name already exists";
        }
        var newTrigger = new SerializableTypes[triggerType]();
        newTrigger.name = name;
        newTrigger.enabled = enabled === undefined ? true : enabled;
        this.triggers.push(newTrigger);
        this.triggersMap[name] = newTrigger;
        this.shouldSave = true;
        return newTrigger;
    };
    AnimationService.prototype.removeAnimation = function(name)
    {
        if (typeof name == 'string')
        {
            if (name in this.animationsMap)
            {
                var index = this.animations.indexOf(this.animationsMap[name]);
                if (index > -1)
                {
                    this.animations.splice(index);
                }
                this.animationsMap[name] = null;
                return;
            }
            return "could not find animation by name: ".concat(name);
        }
    };
    AnimationService.prototype.removeTrigger = function(name)
    {
        if (typeof name == 'string')
        {
            if (name in this.triggerMap)
            {
                var index = this.animations.indexOf(this.triggerMap[name]);
                if (index > -1)
                {
                    this.triggers.splice(index);
                }
                this.triggersMap[name] = null;
                return;
            }
            return "could not find trigger by name: ".concat(name);
        }
    };
    return AnimationService;
})(SerializableBase);

registerPlugin({
    name: "AnimationService",
    version: kPluginVersion,
    authors: ["spacek","deanosrs"],
    type: "intransient",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: function() {gAnimationService = new AnimationService(); globalThis.animation = gAnimationService;}
});