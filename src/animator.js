// Copyright (c) 2024 spacek531
// inspired by the animator-0.0.1-lc-r3.js plugin copyrigt deanosrs 2024, released under GPL 3.0.
var kPluginVersion = "0.1.1";
var kParkStorageKey = "AnimationService";
var gAnimationService = null;

var PluginMetadata = {
    name: "AnimationService Spacek",
    version: kPluginVersion,
    authors: "Spacek",
    type: "intransient",
    licence: "GPL-3.0",
    minApiVersion: 92,
    targetApiVersion: 92,
    main: null // populated later
};

// Remove before shipment
var development = true;
if (development)
{
    function stacktrace() {
        var depth = -4; // skips act(), stacktrace() and the calling method.
        var entry, result = "";
        for (var i = depth; (entry = Duktape.act(i)); i--) {
            var functionName = entry.function.name;
            var prettyName = functionName
                ? ("".concat(functionName, "()"))
                : "<anonymous>";
            result += "   -> ".concat(prettyName, ": line ").concat(entry.lineNumber, "\r\n");
        }
        return result;
    }

    Duktape.errCreate = function onError(error) {
        error.message += ("\r\n".concat(stacktrace()));
        return error;
    };
}

// Utility functions
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

function CheckEntityPosition(entity)
{
    var gte = this.minPosition === null || entity.x >= this.minPosition.x && entity.y >= this.minPosition.y && (this.minPosition.z === undefined || entity.z >= this.minPosition.z);
    var lte = this.maxPosition === null || entity.x <= this.maxPosition.x && entity.y >= this.maxPosition.y && (this.maxPosition.z === undefined || entity.z <= this.maxPosition.z);
    if (gte && lte)
    {
        return { type: this.type, entityType: entity.type, id: entity.id , property: "position", value: {x: entity.x, y: entity.y, z: entity.z}, position: {x: :entity.x, y: entity.y, z: entity.z}};
    }
}

// use anywhere checking arbitrary entity properties
function getEntityPropertyFilterYaw(entity, key, maxRotationFrames)
{
    return = key == "yawRotation" ? entity[key] * maxRotationFrames / entity.maxRotationFrames : entity[key];
}

// use anywhere setting arbitrary entity properties
function setEntityPropertyFilterYaw(entity, key, value, maxRotationFrames)
{
    entity[key] = key == "yawRotation" ? value * entity.maxRotationFrames / maxRotationFrames : value;
}

function applyPropertiesToEntity(entity, properties, maxRotationFrames)
{
    for (var key in properties)
    {
        setEntityPropertyFilterYaw(entity, key, properties[key], maxRotationFrames);
    }
}

function applyPropertiesToTrain(id, trainProperties, maxRotationFrames)
{
    var car = map.getEntity(id);
    for (var i = 0; i < trainProperties.length && car; i++)
    {
        applyPropertiesToEntity(car, trainProperties[i], maxRotationFrames);
        car = car.nextCarOnTrain && map.getEntity(car.nextCarOnTrain);
    }
}

function newAction(actionType, targetArray)
{
    if (typeof actionType != 'string' || !(actionType in SerializableTypes))
    {
        return "usage: newAction(actionType: string): ActionBase Valid types are: ".concat(Object.keys(SerializableTypes).filter(function(tName){return tName.substring(0,6) == "Action"}).join(", "));
    }
    var newAction = new SerializableTypes[actionType]();
    targetArray.push(newAction);
    return newAction
}

function addAction(datastring, targetArray)
{
    if (datastring === undefined)
    {
        console.log("Usage: addAction(datastring: string): ActionBase where datastring is json representing an action");
        return;
    }
    var data = JSON.parse(datastring);
    var newAction = new SerializableTypes[data.type]();
    newAction.deserialize(data);
    targetArray.push(newAction);
    return newAction;
}

// Types
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
            if (this[arrayName].length == 0)
            {
                continue;
            }
            data[arrayName] = [];
            for (var k = 0; k < this[arrayName].length; k++)
            {
                data[arrayName].push(this[arrayName][k].serialize())
            }
        }
        var testObject = new SerializableTypes[this.type]();
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            // if the value is default, don't serialize it
            var key = this.serializableProperties[i]
            if (key != "type" && this[key] == testObject[key])
            {
                continue;
            }
            data[key] = this[key];
        }
        testObject = null;
        return data
    };
    SerializableBase.prototype.deserialize = function(data)
    {
        // determine if the data is poisoned with an object instead of data
        if ("deserialize" in data)
        {
            var e = Error();
            console.log(e.stack);
            return;
        }
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
                    var currentData = arrayData[k];
                    // poison check, this can cause recursion
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
                    if (typeof currentData == 'object' && currentData.type in SerializableTypes)
                    {
                        var objectElement = new SerializableTypes[currentData.type]();
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

// Always returns a value.
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
        return {type: this.type};
    };
    return SensorBase;
})(SerializableBase);
SerializableTypes.SensorBase = SensorBase;

// Checks several entities values against list of properties. Returns first entity that meets criteria.
var SensorEntityPropertyEquals = (function(SensorBase) {
    __extends(SensorEntityPropertyEquals, SensorBase);
    function SensorEntityPropertyEquals()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPropertyEquals";
        this.values = {}; // Dictionary<any>
        this.property = "";
        this.entities = []; // Array<number>
        this.maxRotationFrames = 32; // the number of yaw frames the author designed for
        this.addSerializableProperties(["value","property","entities","maxRotationFrames"]);
    };
    SensorEntityPropertyEquals.prototype.test = function()
    {
        var success = null;
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                for (var key in this.values)
                {
                    
                    success = getEntityPropertyFilterYaw(entity, key, this.maxRotationFrames) == this.values[key];
                    if (!success)
                    {
                        return null;
                    }
                }
            }
            return { type: this.type, entityType: entity.type, id: entity.id, property: this.property, value: entity[this.property] };
        }
        return null;
    };
    return SensorEntityPropertyEquals;
})(SensorBase);
SerializableTypes.SensorEntityPropertyEquals = SensorEntityPropertyEquals;

// Checks a specific property of several entities against a min and max value. Returns first entitiy that meets criteria.
var SensorEntityPropertyComparison = (function(SensorBase) {
    __extends(SensorEntityPropertyComparison, SensorBase);
    function SensorEntityPropertyComparison()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPropertyComparison";
        this.minValue = null; // number?
        this.maxValue = null; // number?
        this.inclusive = true;
        this.property = "";
        this.entities = []; // Array<number>
        this.maxRotationFrames = 32; // the number of yaw frames the author designed for
        this.addSerializableProperties(["minValue","maxValue","property","inclusive","entities","maxRotationFrames"]);
    };
    SensorEntityPropertyComparison.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                var value = getEntityPropertyFilterYaw(entity, key, this.maxRotationFrames);
                
                var inclusive = this.minValue ===null || value >= this.minValue && this.maxValue === null || value <= this.maxValue;
                var exclusive = this.minValue === null || value > this.minValue && this.maxValue === null || value < this.maxValue;
                if (this.inclusive? inclusive: exclusive)
                {
                    return { type: this.type, entityType: entity.type, id: entity.id, property: this.property, value: entity[this.property] };
                }
            }
        }
        return null;
    };
    return SensorEntityPropertyComparison;
})(SensorBase);
SerializableTypes.SensorEntityPropertyComparison = SensorEntityPropertyComparison;

// Checks the position of several entities against an axis-aligned bounding box, inclusive. Returns first entity that meets criteria.
var SensorEntityPosition = (function(SensorBase) {
    __extends(SensorEntityPosition, SensorBase);
    function SensorEntityPosition()
    {
        SensorBase.call(this);
        this.type = "SensorEntityPosition";
        this.minPosition = null;  // TileCoordsXY | TileCoordsXYZ | null
        this.maxPosition = null;  // TileCoordsXY | TileCoordsXYZ | null
        this.entities = []; // Array<number>
        this.addSerializableProperties(["minPosition","maxPosition","entities"]);
    };
    SensorEntityPosition.prototype.test = function()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            var entity = map.getEntity(this.entities[i]);
            if (entity != null)
            {
                var success = CheckEntityPosition.call(this, entity);
                {
                    return success;
                }
            }
        }
        return null;
    };
    return SensorEntityPosition;
})(SensorBase);
SerializableTypes.SensorEntityPosition = SensorEntityPosition;

// Special case of SensorEntityPosition that checks the first vehicle of a specific ride.
var SensorRideCarPosition = (function(SensorBase) {
    __extends(SensorRideCarPosition, SensorBase);
    function SensorRideCarPosition()
    {
        SensorBase.call(this);
        this.type = "SensorRideCarPosition";
        this.minPosition = null; // TileCoordsXY | TileCoordsXYZ | null
        this.maxPosition = null; // TileCoordsXY | TileCoordsXYZ | null
        this.rideId = 65535;
        this.addSerializableProperties(["minPosition","maxPosition","rideId"]);
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
                var success = CheckEntityPosition.call(this, entity);
                if (success)
                {
                    return success;
                }
            }
        }
        return null;
    };
    return SensorRideCarPosition;
})(SensorBase);
SerializableTypes.SensorRideCarPosition = SensorRideCarPosition;

// not verified
var SensorRandomTile = (function(SensorBase) {
    __extends(SensorRandomTile,SensorBase);
    function SensorRandomTile()
    {
        this.minPosition = {x: 0, y: 0, z: 0}; // TileCoordsXY | TileCoordsXYZ
        this.maxPosition = {x: 0, y: 0, z: 0}; // TileCoordsXY | TileCoordsXYZ
        this.positionOffset = {x: 0, y: 0, z: 0}; // CoordsXYZ
        this.ignoreHeight = false;
        this.addSerializableProperties(["minPosition","maxPosition","ignoreHeight", "positionOffset"]);
    };
    SensorRandomTile.prototype.test = function()
    {
        var x = context.getRandom(this.minPosition.x, this.maxPosition.x);
        var y = context.getRandom(this.minPosition.y, this.maxPosition.y);
        var z = context.getRandom(this.minPosition.z, this.maxPosition.z);
        var direction = context.getRandom(0,4);
        coordinates = { x: x, y: y, z: this.ignoreHeight? undefined : z}
        position = {x : x * 32 + this.positionOffset.x, y: y * 32 + this.positionOffset.y, this.ignoreHeight? undefined : z * 8 + this.positionOffset.z, direction: direction};
        return { type: this.type, coordinates: coordinates, position: position};
    };
    return SensorRandomTile;
})(SensorBase);
SerializableTypes.SensorRandomTile = SensorRandomTile;

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

// Prints a message to the console.
var ActionConsoleLog = (function(ActionBase) {
    __extends(ActionConsoleLog,ActionBase)
    function ActionConsoleLog()
    {
        ActionBase.call(this);
        this.type = "ActionConsoleLog";
        this.text = "Hello World";
        this.addSerializableProperties(["text"]);
    };
    ActionConsoleLog.prototype.execute = function(storage)
    {
        console.log(this.text);
    };
    return ActionConsoleLog;
})(ActionBase);
SerializableTypes.ActionConsoleLog = ActionConsoleLog;

// Posts a message to the park's newsfeed.
var ActionPostMessage = (function(ActionBase) {
    __extends(ActionPostMessage, ActionBase);
    function ActionPostMessage()
    {
        ActionBase.call(this);
        this.type = "ActionPostMessage";
        this.text = "HAPPYLAND";
        this.messageType = "blank"; // see ParkMessageType in openrct2.d.ts
        this.subject = null; // number?
        this.addSerializableProperties(["text","messageType","subject"]);
    };
    ActionPostMessage.prototype.execute = function(storage)
    {
        park.postMessage({type: this.messageType, text: this.text, subject: this.subject});
    };
    return ActionPostMessage;
})(ActionBase);
SerializableTypes.ActionPostMessage = ActionPostMessage;

// Executes a game action.
var ActionExecuteAction = (function(ActionBase) {
    __extends(ActionExecuteAction, ActionBase);
    function ActionExecuteAction()
    {
        ActionBase.call(this);
        this.type = "ActionExecuteAction";
        this.action = null;
        this.arguments = [{}];
        this.addSerializableProperties(["action","arguments"]);
    };
    ActionExecuteAction.prototype.execute = function(storage)
    {
        if (this.action)
        {
            for (var i = 0; i < this.arguments.length; i++)
            {
                context.executeAction(this.action,this.arguments[i],function(){});
            }
        }
    };
    return ActionExecuteAction;
})(ActionBase);
SerializableTypes.ActionExecuteAction = ActionExecuteAction;

// Sets the specified properties to all cars in a train. Due to OpenRCT2 limitations, the car passed to the action is treated as the first car of the train.
var ActionTrainSetProperties = (function(ActionBase) {
    __extends(ActionTrainSetProperties, ActionBase);
    function ActionTrainSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionTrainSetProperties";
        this.trains = null; // Array<number> | null: ids of train lead cars. Null for the triggering car.
        this.trainProperties = []; // array of dictionaries where index is car number
        this.maxRotationFrames = 32; // the number of yaw frames the author designed for
        this.addSerializableProperties(["trainProperties","trains","maxRotationFrames"]);
    }
    ActionTrainSetProperties.prototype.execute = function(storage)
    {
        if (this.trains !== null)
        {
            for (var i = 0; i < this.trains.length; i++)
            {
                
                console.log("applying to train",this.trainProperties);
                applyPropertiesToTrain(this.trains[i],this.trainProperties, this.maxRotationFrames);
            }
            return;
        }
        if (("entityType" in storage.trigger) && ("id" in storage.trigger))
        {
            console.log("applying to train",this.trainProperties);
            applyPropertiesToTrain(storage.trigger.id, this.trainProperties, this.maxRotationFrames);
        }
    };
    return ActionTrainSetProperties;
})(ActionBase);
SerializableTypes.ActionTrainSetProperties = ActionTrainSetProperties;

// not verified
var ActionTileElementSetProperties = (function(ActionBase) {
    __extends(ActionTileElementSetProperties, ActionBase);
    function ActionTileElementSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionTileElementSetProperties";
        this.minPosition = null; // TileCoordsXY | TileCoordsXYZ | null
        this.maxPosition = null; // TileCoordsXY | TileCoordsXYZ | null
        this.useCoordinatesZ = false; // only applies to coordinates passed by trigger
        this.filter = {}; // element properterties that must match. use array to check multiple values.
        this.properties = {};
        this.addSerializableProperties(["minPosition","maxPosition","properties","useCoordinatesZ"]);
    }
    ActionTileElementSetProperties.prototype.execute = function(storage)
    {
        if (this.minPosition === null || this.maxPosition === null)
        {
            var tileCoordinates = storage.coordinates;
            if (!tileCoordinates && storage.position)
            {
                tileCoordinates = {x: storage.position.x / 32, y: storage.position.y / 32, storage.position.z && this.useCoordinatesZ && Math.floor(storage.position.z / 8)};
            }
            else if (!tileCoordinates)
            {
                return;
            }
            tileCoordinates = {x: tileCoordinates.x, y: tileCoordinates.y, z: this.useCoordinatesZ? tileCoordinates.z : undefined}
            this.handleTile(tileCoorddinates);
            return;
        }
        for (var x = this.minPosition.x; x <= this.maxPosition.x; x++)
        {
            for (var y = this.maxPosition.y; y <= this.maxPosition.y; y++)
            {
                this.handleTile({x: x, y: y});
            }
        }
    };
    ActionTileElementSetProperties.prototype.handleTile = function(tileCoordinates)
    {
        var tile = map.getTile(tileCoordinates.x, tileCoordinates.y);
        if (!tile)
        {
            return;
        }
        var elements = tile.elements;
        var minZ = this.useCoordinatesZ && !this.minPosition && !this.minPosition ? tileCoordinates.z : this.minPosition && this.minPosition.z;
        var maxZ = this.useCoordinatesZ && !this.minPosition && !this.maxPosition ? tileCoordinates.z : this.maxPosition && this.maxPosition.z;
        for (var i = 0; i < tile.numElements; i++)
        {
            this.handleElement(tile.elements[i], minZ, maxZ);
        }
    }
    ActionTileElementSetProperties.prototype.handleElement = function(element, minZ, maxZ)
    {
        var baseZ = element.baseZ / 8;
        if ((minZ && baseZ < minZ || maxZ && baseZ > maxZ)
        {
            return;
        }
        for (key in this.filter)
        {
            var value = this.filter[key]
            if (Array.isArray(value))
            {
                if (value.indexOf(element[key]) < 0)
                {
                    return;
                }
            }
            else
            {
                if (element[key] != value)
                {
                    return;
                }
            }
        }
        for (var key in this.properties);
        {
            element[key] = this.properties[key];
        }
    }
    return ActionTileElementSetProperties;
})(ActionBase);
SerializableTypes.ActionTileElementSetProperties = ActionTileElementSetProperties;

// verified working
var ActionEntitySetProperties = (function(ActionBase) {
    __extends(ActionEntitySetProperties, ActionBase);
    function ActionEntitySetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionEntitySetProperties";
        this.entities = null; // Array<number> | null: ids of entities. Null for the triggering entity.
        this.properties = {};
        this.maxRotationFrames = 32; // the number of yaw frames the author designed for
        this.addSerializableProperties(["entities","properties","maxRotationFrames"]);
    }
    ActionEntitySetProperties.prototype.execute = function(storage)
    {
        if (this.entities !== null)
        {
            for (var i = 0; i < this.entities.length; i++)
            {
                var entity = map.getEntity(this.entities[i])
                entity && applyPropertiesToEntity(entity, this.properties, this.maxRotationFrames);
            }
            return;
        }
        if ("entityType" in storage.trigger && "id" in storage.trigger)
        {
            var entity = map.getEntity(storage.trigger.id)
            entity && applyPropertiesToEntity(entity, this.properties, this.maxRotationFrames);
        }
    };
    return ActionEntitySetProperties;
})(ActionBase);
SerializableTypes.ActionEntitySetProperties = ActionEntitySetProperties;

// not verified
var ActionEntityTweenProperties = (function(ActionBase) {
    __extends(ActionEntityTweenProperties, ActionBase);
    function ActionEntitySetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionEntityTweenProperties";
        this.entities = null; // Array<number> | null: ids of entities. Null for the triggering entity.
        this.properties = {};
        this.startFrame = null; // number | null: 
        this.maxRotationFrames = 32; // the number of yaw frames the author designed for
        this.addSerializableProperties(["entities","properties","maxRotationFrames"]);
    }
    ActionEntityTweenProperties.prototype.execute = function(storage)
    {
        if (this.entities !== null)
        {
            for (var i = 0; i < this.entities.length; i++)
            {
                var entity = map.getEntity(this.entities[i])
                entity && applyPropertiesToEntity(entity, this.properties, this.maxRotationFrames);
            }
            return;
        }
        if ("entityType" in storage.trigger && "id" in storage.trigger)
        {
            var entity = map.getEntity(storage.trigger.id)
            entity && applyPropertiesToEntity(entity, this.properties, this.maxRotationFrames);
        }
    };
    return ActionEntityTweenProperties;
})(ActionBase);
SerializableTypes.ActionEntityTweenProperties = ActionEntityTweenProperties;

// not verified
var ActionPlayAnimation = (function(ActionBase) {
    __extends(ActionPlayAnimation, ActionBase);
    function ActionPlayAnimation()
    {
        ActionBase.call(this);
        this.type = "ActionPlayAnimation";
        this.targets = []; // Array<string> names of animations
        this.storage = {};
        this.addSerializableProperties(["targets","storage"]);
    }
    ActionPlayAnimation.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.targets.length; i++)
        {
            var target = this.targets[i];
            var animation = target in gAnimationService.animationsMap && gAnimationService.animationsMap[target];
            if (animation)
            {
                var trigger = { type: this.type };
                for (var key in this.storage)
                {
                    trigger[key] = this.storage.key;
                }
                animation.initialize(trigger,storage.globalCurrentTick);
            }
        }
    };
    return ActionPlayAnimation;
})(ActionBase);
SerializableTypes.ActionPlayAnimation = ActionPlayAnimation;

// not verified
var ActionStopAnimation = (function(ActionBase) {
    __extends(ActionStopAnimation, ActionBase);
    function ActionStopAnimation()
    {
        ActionBase.call(this);
        this.type = "ActionStopAnimation";
        this.targets = []; // Array<string> names of animations
        this.storage = {};
        this.addSerializableProperties(["targets", "storage"]);
    }
    ActionStopAnimation.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.targets.length; i++)
        {
            var target = this.targets[i];
            var animation = target in gAnimationService.animationsMap && gAnimationService.animationsMap[target];
            if (animation)
            {
                var trigger = { type: this.type };
                for (var key in this.storage)
                {
                    trigger[key] = this.storage.key;
                }
                animation.stop(trigger,storage.globalCurrentTick);
            }
        }
    };
    return ActionStopAnimation;
})(ActionBase);
SerializableTypes.ActionStopAnimation = ActionStopAnimation;

// not verified
var ActionAnimationSetProperties = (function(ActionBase) {
    __extends(ActionAnimationSetProperties, ActionBase);
    function ActionAnimationSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionAnimationSetProperties";
        this.targets = []; // Array<string>: Names of animations
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
                        animation[key] = this.targetProperties[key];
                    }
                }
            }
        }
    };
    return ActionAnimationSetProperties;
})(ActionBase);
SerializableTypes.ActionAnimationSetProperties = ActionAnimationSetProperties;

// verified working
var ActionTriggerSetProperties = (function(ActionBase) {
    __extends(ActionTriggerSetProperties, ActionBase);
    function ActionTriggerSetProperties()
    {
        ActionBase.call(this);
        this.type = "ActionTriggerSetProperties";
        this.targets = []; // Array<string>: Names of animations
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

// Triggers evaluate all sensors and trigger only if all sensors return true.
var TriggerBase = (function (SerializableBase) {
    __extends(TriggerBase,SerializableBase)
    function TriggerBase()
    {
        SerializableBase.call(this);
        this.type = "TriggerBase";
        this.name = "TriggerBase";
        this.enabled = true;
        this.currentTimeout = null;
        this.timeout = null; // number? How many ticks to wait before the trigger can fire again
        this.sensors = []; // Array<SensorBase>
        this.actions = []; // Array<ActionBase>
        this.disableOnTrigger = false;
        this.targetAnimations = []; // Array<string>: Names of animations
        this.addSerializableProperties(["name","enabled","targetAnimations","currentTimeout", "timeout","disableOnTrigger"]);
        this.addSerializableArrays(["sensors","actions"]);
    };
    TriggerBase.prototype.execute = function(storage)
    {
        for (var i = 0; i < this.actions.length; i++)
        {
            this.actions[i].enabled && this.actions[i].execute(storage);
        }
    }
    TriggerBase.prototype.test = function()
    {
        var returnValue = {};
        // evaluates in reverse order so that the 1st sensor gives the trigger payload
        for (var i = this.sensors.length - 1; i >= 0; i--)
        {
            var sensor = this.sensors[i];
            if (sensor.enabled == false)
            {
                continue;
            }
            returnValue = returnValue && sensor.test();
            if (!returnValue)
            {
                return null;
            }
        }
        if (returnValue == {})
        {
            return null;
        }
        this.enabled = !this.disableOnTrigger;
        this.execute(returnValue);
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
    TriggerBase.prototype.newAction = function(actionType)
    {
        return newAction( actionType, this.actions);
    };
    TriggerBase.prototype.addAction = function(actionType)
    {
        return addAction(actionType, this.actions);
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
    TriggerOnLoad.prototype.test = function()
    {
        return null;
    }
    return TriggerOnLoad
})(TriggerBase);
SerializableTypes.TriggerOnLoad = TriggerOnLoad;

var AnimationFrame = (function(SerializableBase) {
    __extends(AnimationFrame,SerializableBase);
    function AnimationFrame()
    {
        SerializableBase.call(this);
        this.type = "AnimationFrame";
        this.index = null;
        this.minIndex = null;
        this.maxIndex = null;
        this.actions = [];
        this.addSerializableProperties(["index","minIndex","maxIndex"]);
        this.addSerializableArrays(["actions"]);
    };
    AnimationFrame.prototype.execute = function(currentFrame, storage)
    {
        if ((this.minIndex !== null && currentFrame < this.minIndex) || (this.maxIndex !== null && currentFrame > this.maxIndex) || (this.index !== null && currentFrame != this.index))
        {
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
        return newAction(actionType, this.actions);
    }
    AnimationFrame.prototype.addAction = function(actionType)
    {
        return addAction(actionType, this.actions);
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
        this.storage = {};
        if (animationBase && animationBase.persistentStorage)
        {
            // AnimationPlayer sets this when deserializing
            this.storage = animationBase.storage;
        }
        else if (animationBase)
        {
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
                console.log("animation frame",i,"is finished");
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
        this.numLoops = 0; //number | null null for infinite
        this.tickInterval = 1;
        this.allowMultiple = false; // allow animation to play multiple times simultaneously
        this.persistentStorage = false; // storage is not copied for each animation player instance
        this.animationFrames = []; // Array<AnimationFrame>
        this.storage = {}; //all additional properties
        this.playingAnimations = []; // Array<AnimationPlayer>
        this.quitActions = []; // Array<ActionBase>
        this.addSerializableProperties(["name","enabled","numLoops","tickInterval","allowMultiple","persistentStorage","storage"]);
        this.addSerializableArrays(["animationFrames", "quitActions"]);
    };
    AnimationBase.prototype.initialize = function(trigger, globalCurrentTick)
    {
        if ((this.playingAnimations.length > 0 && !this.allowMultiple) || !this.enabled)
            return;
        this.storage.trigger = trigger;
        var newAnimationPlayer = new AnimationPlayer(this);
        this.playingAnimations.push(newAnimationPlayer);
    };
    // not tested
    AnimationBase.prototype.stop = function(trigger)
    {
        for (var i = 0; i < this.quitActions; i++)
        {
            this.quitActions[i].enabled && this.quitActions[i].execute(trigger);
        }
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            this.playingAnimations[i].delete();
            this.playingAnimations[i] = null;
        }
        this.playingAnimations = null
    };
    AnimationBase.prototype.tick = function(globalCurrentTick)
    {
        for (var i = 0; i < this.playingAnimations.length; i++)
        {
            if (this.playingAnimations[i].nextTick(globalCurrentTick))
            {
                this.playingAnimations.splice(i,1);
                i--;
            }
        }
    };
    AnimationBase.prototype.deserialize = function(data)
    {
        SerializableBase.prototype.deserialize.call(this, data);
        if ("playingAnimations" in data)
        {
            for (i = 0; i < data.playingAnimations.length; i++)
            {
                var player = new AnimationPlayer(this);
                player.deserialize(data.playingAnimations[i]);
                if (this.persistentStorage)
                {
                    player.storage = this.storage;
                }
                this.playingAnimations.push(player);
            }
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
        this.playingAnimations = null
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
    AnimationBase.prototype.addFrame = function(datastring)
    {
        if (datastring === undefined)
        {
            console.log("Usage: addFrame(datastring: string): AnimationFrame where datastring is json representing an animation frame");
            return;
        }
        var data = JSON.parse(datastring);
        var newFrame = new SerializableTypes[data.type]();
        newFrame.deserialize(data);
        this.animationFrames.push(newFrame);
        return newFrame;
    };
    AnimationBase.prototype.newAction = function(actionType)
    {
        return newAction(actionType, this.quitActions);
    }
    AnimationBase.prototype.addAction = function(actionType)
    {
        return addAction(actionType, this.quitActions);
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
        this.stringBuffer = "";
    };
    AnimationService.prototype.tick = function()
    {
        if (this.paused)
        {
            return;
        }
        this.tickCount++;
        // step 1. evaluate triggers and initialize the associated animations
        for (var i = 0; i < this.triggers.length; i++)
        {
            var trigger = this.triggers[i];
            var triggerData = trigger.enabled && !trigger.currentTimeout == true && trigger.test();
            trigger.currentTimeout > 0 && trigger.currentTimeout--;
            if (triggerData)
            {
                //console.log("Trigger tripped!",trigger.name);
                trigger.currentTimeout = trigger.timer;
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
        // step 2. increment already-running animations
        for (var i = 0; i < this.animations.length; i++)
        {
            var animation = this.animations[i]
            animation.playingAnimations.length > 0 && animation.tick(this.tickCount);
        }
    };
    AnimationService.prototype.triggerOnLoad = function()
    {
        for (var i = 0; i < this.triggers.length; i++)
        {
            var trigger = this.triggers[i];
            if (trigger.type == "TriggerOnLoad" && trigger.enabled)
            {
                var triggerData = {type:"TriggerOnLoad",name: trigger.name};
                trigger.execute(triggerData);
                for (var k = 0; k < trigger.targetAnimations.length; k++)
                {
                    var animation = this.animationsMap[trigger.targetAnimations[k]];
                    console.log("animation type", typeof animation == 'object')
                    if (typeof animation == 'object' && animation.enabled)
                    {
                        animation.initialize(triggerData,this.tickCount);
                    }
                }
            }
        }
    };
    AnimationService.prototype.deserialize = function(data)
    {
        this.initialize();
        SerializableBase.prototype.deserialize.call(this,data);
        this.triggersMap = BuildMap(this.triggers);
        this.animationsMap = BuildMap(this.animations);
        this.shouldSave = true;
        console.log("AnimationService loaded with ".concat(this.animations.length," animations and ",this.triggers.length," triggers"));
        if (this.paused)
        {
            console.log("Notice: AnimationService is paused");
        }
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
        this.initialize();
    };
    AnimationService.prototype.newMap = function()
    {
        this.unload();
        this.load();
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
        console.log("AnimationService saved to park");
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
    AnimationService.prototype.getAnimation = function(name)
    {
        if (name in this.animationsMap)
            return this.animationsMap[name];
    };
    AnimationService.prototype.getTrigger = function(name)
    {
        if (name in this.triggersMap)
            return this.triggersMap[name];
    };
    AnimationService.prototype.addAnimation = function(datastring)
    {
        if (datastring === undefined)
        {
            console.log("Usage: addAnimation(datastring: string): AnimationBase where datastring is json representing an animation");
            return;
        }
        var data = JSON.parse(datastring);
        var newAnimation = new SerializableTypes[data.type]();
        newAnimation.deserialize(data);
        this.animations.push(newAnimation);
        this.animationsMap[newAnimation.name] = newAnimation;
        return newAnimation;
    };
    AnimationService.prototype.addTrigger = function(datastring)
    {
        if (datastring === undefined)
        {
            console.log("Usage: addTrigger(datastring: string): TriggerBase where datastring is json representing an animation");
            return;
        }
        var data = JSON.parse(datastring);
        var newTrigger = new SerializableTypes[data.type]();
        newTrigger.deserialize(data);
        this.triggers.push(newTrigger);
        this.triggersMap[newTrigger.name] = newTrigger;
        return newTrigger
    };
    AnimationService.prototype.pause = function()
    {
        this.paused = true;
    };
    AnimationService.prototype.unpause = function()
    {
        this.paused = false;
    };
    return AnimationService;

    // I/O
    AnimationService.prototype.fromStorage = function(namespace)
    {
        namespace = namespace || "AnimationService";
        var data = {}
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var datum = context.sharedStorage.get(namespace.concat(".",this.serializableProperties[i]));
            data[this.serializableProperties[i]] = datum === undefined ? null : datum;
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var datum = context.sharedStorage.get(namespace.concat(".",this.serializeObjectArrays[i]));
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
    };
    AnimationService.prototype.clearBuffer = function()
    {
        this.stringBuffer = ""
    };
    AnimationService.prototype.addBuffer = function(text)
    {
        this.stringBuffer = this.stringBuffer.concat(text);
    };
    AnimationService.prototype.fromBuffer = function()
    {
        this.parse(this.stringBuffer);
    };
    AnimationService.prototype.cleanStorage = function(namespace)
    {
        namespace = namespace || "AnimationService";
        this.shouldSave = true;
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            context.sharedStorage.set(namespace.concat(".",this.serializableProperties[i]), undefined);
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            context.sharedStorage.set(namespace.concat(".",this.serializeObjectArrays[i]), undefined);
        }
    }
    AnimationService.prototype.toStorage = function(namespace)
    {
        namespace = namespace || "AnimationService";
        this.shouldSave = true;
        for (var i = 0; i < this.serializableProperties.length; i++)
        {
            var key = this.serializableProperties[i]
            context.sharedStorage.set(namespace.concat(".",key), this[key]);
        }
        for (var i = 0; i < this.serializeObjectArrays.length; i++)
        {
            var key = this.serializeObjectArrays[i];
            var data = [];
            for (var k = 0; k < this[key].length; k++)
            {
                data.push(this[key][k].serialize());
            }
            context.sharedStorage.set(namespace.concat(".",key), data);
        }
        console.log("AnimationService saved to plugin.store.json");
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
})(SerializableBase);

PluginMetadata.main = function() {gAnimationService = new AnimationService(); globalThis.animation = gAnimationService;};

registerPlugin(PluginMetadata);