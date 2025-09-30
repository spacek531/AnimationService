/// <reference path="../../../lib/openrct2.d.ts" />

import { debugSerialize } from "../../utilities/environment"
import * as Log from "../../utilities/logger";

// Define a constructor type for SerializableBase and its subclasses
type Constructor<T> = new (...args: any[]) => T;

// Define SerializableTypes as a record of constructors
export const SerializableTypes: Record<string, Constructor<SerializableBase>> = {};

export class SerializableBase {
	/**
	 * Allow string indexing for dynamic properties
	 */
	[key: string]: any; // Index signature to allow dynamic property access

	/**
	 * The class type. Used for serializing and deserializing.
	 */
	type: string;

	/**
	 * List of properties which are serialized upon saving.
	 */
	serializableProperties: Array<string>;

	/**
	 * List of properties which ignore default values and always serialize.
	 */
	alwaysSerializable: Array<string>;

	/**
	 * List of properties which require serialize() called on each element.
	 */
	serializeObjectArrays: Array<string>;

	constructor() {
		this.type = "SerializableBase";
		this.serializableProperties = ["type"];
		this.alwaysSerializable = ["maxYawValue", "type"];
		this.serializeObjectArrays = [];
	}
	addSerializableProperties(newProperties: Array<string>): void {
		this.serializableProperties = this.serializableProperties.concat(newProperties);
	}

	addSerializableArrays(newProperties: Array<string>): void {
		this.serializeObjectArrays = this.serializeObjectArrays.concat(newProperties);
	}
	
	/**
	 * Export class into serialized plain data.
	 */
	serialize(): Record<string, any> {
		const data: Record<string, any> = {};

		// Serialize arrays of objects
		for (const arrayName of this.serializeObjectArrays) {
			if (this[arrayName].length === 0) {
				continue;
			}
			data[arrayName] = [];
			for (const item of this[arrayName]) {
				data[arrayName].push(item.serialize());
			}
		}

		// Create a test object to compare default values
		const testObject = new SerializableTypes[this.type]();

		// Serialize simple properties
		for (const key of this.serializableProperties) {
			// Skip default values unless alwaysSerializable or debugSerialize is enabled
			if (
				(this.alwaysSerializable.indexOf(key) < 0) &&
				this[key] === testObject[key] &&
				!debugSerialize
			) {
				continue;
			}
			data[key] = this[key];
		}

		return data;
	}

	/**
	 * Load serialized plain data into class.
	 */
	deserialize(data: Record<string, any>): void {
		// Check if data is poisoned (contains a deserialize method)
		if ("deserialize" in data) {
			Log.error("Poisoned data detected:" + new Error().stack);
			return;
		}

		// Deserialize simple properties
		for (const key of this.serializableProperties) {
			if (key in data) {
				this[key] = data[key];
			}
		}

		// Deserialize arrays of objects
		for (const arrayName of this.serializeObjectArrays) {
			const arrayData = data[arrayName];
			if (Array.isArray(arrayData)) {
				this[arrayName] = []; // Reset the array
				for (const currentData of arrayData) {
					// Poison check
					if ("deserialize" in currentData) {
						Log.error(
							"Data should not be an initialized object!" + 
							{ arrayName, currentData } +
							new Error().stack
						);
						return;
					}

					if (typeof currentData === "object" && currentData.type in SerializableTypes) {
						const objectElement = new SerializableTypes[currentData.type]();
						objectElement.deserialize(currentData);
						this[arrayName].push(objectElement);
					}
				}
			}
		}
	}
	
	
	/**
	 * Cleanup object arrays.
	 */
	delete(): void {
		for (const key of this.serializeObjectArrays) {
			var objectArray: Array<SerializableBase> = this[key];
			for (var k = objectArray.length - 1; k >= 0; k--) {
				objectArray[k].delete();
				delete objectArray[k];
			}
		}
	}
	
	
	/**
	 * Check if anything is wrong with the class's values. Anything other than empty array is an error.
	 */
	validate(): Array<string> {
		return [];
	}
}