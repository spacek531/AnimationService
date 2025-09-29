/// <reference path="../../lib/openrct2.d.ts" />


export var SerializableTypes = {};

export class SerializableBase
{
	/**
	 * The class type. Used for serializing and deserializing.
	 */
	readonly type: string;

	/**
	 * List of properties which are serialized upon saving. In serialize-object mode, properties with default values are not serialized.
	 */
	readonly serializableProperties: Array<string>;
	
	
	/**
	 * List of properties which ignore default values and always serialize, in serialize-object mode.
	 */
	readonly alwaysSerializable: Array<string>;
	
	
	/**
	 * List of properties which require serialize() called on each element.
	 */
	readonly serializeObjectArrays: Array<string>;
	
	constructor()
	{
		this.type = "SerializableBase";
		this.serializableProperties = ["type"];
		this.alwaysSerialize = ["maxYawValue", "type"];
		this.serializeObjectArrays = [];
	}
	
	addSerializableProperties(newProperties: Array<string>): void
	{
		this.serializableProperties = this.serializableProperties.concat(newProperties);
	}
	
	addSerializableArrays(newProperties: Array<string>): void
	{
		this.serializeObjectArrays = this.serializeObjectArrays.concat(newProperties);
	}
	
	serialize(): Object
	{
		var data = {}
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
			// disabled until ts implementation keeps this record
			/*
            // if the value is default, don't serialize it
            var key = this.serializableProperties[i]
            if (this.alwaysSerialize.indexOf(key) < 0 && this[key] == testObject[key] && !debugSerialize)
            {
                continue;
            }
			*/
            data[key] = this[key];
        }
        testObject = null;
        return data
	}
	
	deserialize(data: Object): void
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
}