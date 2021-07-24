//// @ts-nocheck
// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

// TODO: Clean this up, it's messy

import { BaseVar } from './vars/base.js';
import { BoolVar } from './vars/bool.js';
import { StringVar } from './vars/string.js';
import { IntVar } from './vars/int.js';
import { FloatVar } from './vars/float.js';

import { RecordVar } from './structures/record.js';
import { ArrayTableVar } from './structures/table.js';

import log from './core/log.js';
import { DurationVar } from './vars/duration.js';

/** @type {import('../../TS/vastack').VarStackTypes} */
const Types = {
  main: undefined,
  Int: IntVar,
  Float: FloatVar,
  Duration: DurationVar,
  Bool: BoolVar,
  String: StringVar,
  addNamedType: function (name, baseType) {
    if (Types[name]) {
      log.error('Type {name} already exists!', { name });
      return;
    }

    // TODO SECURITY: check name for injection or find better method for 
    //                creating a dynamicly named class (Javascript Documentation is such a mess)
    let newClass = (new Function(`return function ${name}(...args) {
      let constructor;
      if (this.constructor.name !== '${name}') {
        // TODO we probably have to seek ourself in the prototype chain, but for now 1 level deeper wil do
        // constructor = Object.getPrototypeOf(this.constructor.__proto__).constructor;
        constructor = Object.getPrototypeOf(this.constructor.__proto__);
      } else {
        constructor = Object.getPrototypeOf(this.__proto__).constructor;
      }
      return Reflect.construct(constructor, args, new.target);
    }`))();

    // Thanks to: 
    // https://medium.com/@robertgrosse/how-es6-classes-really-work-and-how-to-build-your-own-fd6085eb326a
    Reflect.setPrototypeOf(newClass, baseType);
    Reflect.setPrototypeOf(newClass.prototype, baseType.prototype);

    Types[name] = newClass;
    return newClass;
  },

  addRecord: function (name, recordDef) {
    // TODO SECURITY: check name or find better method for 
    //                creating a dynamicly named class (Javascript Documentation is such a mess)
    // let newClass = (new Function(`return class ${name} {}`))();

    // // Thanks to: 
    // // https://medium.com/@robertgrosse/how-es6-classes-really-work-and-how-to-build-your-own-fd6085eb326a
    // Reflect.setPrototypeOf(newClass, RecordVar);
    // Reflect.setPrototypeOf(newClass.prototype, RecordVar.prototype);
    // newClass.typeStr = name;
    // Types[name] = newClass;

    const newClass = Types.addNamedType(name, RecordVar);
    const fieldNames = [];
    const fieldDefs = [];

    for (var key in recordDef) {
      let publicName = key;
      let fieldDef = BaseVar.parseDefinition(recordDef[publicName], publicName);

      fieldNames.push(publicName);
      fieldDefs.push(fieldDef);
      if (fieldDef.isKey) {
        newClass.prototype._keyFieldName = fieldDef.name;
      }
      if (fieldDef.isValue) {
        newClass.prototype._valueFieldName = fieldDef.name;
      }
      let privateName = "_" + publicName;
      if (fieldDef.type || fieldDef.defRef) {
        if (fieldDef.defRef) {
          Object.defineProperty(newClass.prototype, publicName, {
            get: function () {
              let value = this[privateName];
              if (!value) {
                const definitionVar = this.$findVar(fieldDef.defRef);
                this[privateName+'_def'] = definitionVar;
                const createValueVar = () => {
                  const fieldDef2 = BaseVar.parseDefinition(definitionVar.$v, publicName);
                  let typeToMake = Types[fieldDef2.type];
                  if (!typeToMake) {
                    // TODO: Make a default var string for stuff
                    console.error('Type not found, defaulted t0 string: ', fieldDef2.type);
                    typeToMake = Types.String;
                    // return;
                  }
                  let value = this[privateName];
                  let oldValue;
                  let oldCallbacks;
                  if (value !== undefined) {
                    if (value instanceof RecordVar) {
                      let fn = value.$keyFieldName
                      oldValue = value[fn].$v;
                    } else {
                      oldValue = value.$v;
                    }
                    oldCallbacks = value._directCallbacks;
                  }
                  value = new typeToMake();
                  this[privateName] = value;
                  value.$setDefinition(fieldDef2);
                  value.$parent = this;
                  if (oldValue !== undefined) {
                    value.$v = oldValue;
                    value._directCallbacks = oldCallbacks;
                  } else {
                    value.$addEvent(this._recordChangedBound);
                  }
                  return value;
                }
                definitionVar.$addEvent(createValueVar);
                value = createValueVar();
              }
              return value;
            },
            enumerable: true,
          });
        } else {
          Object.defineProperty(newClass.prototype, publicName, {
            get: function () {
              /** @type {BaseVar} */
              let value = this[privateName];
              if (!value) {
                value = new Types[fieldDef.type]();
                this[privateName] = value;
                value.$setDefinition(fieldDef);
                value.$parent = this;
                if (fieldDef.ref) {
                  // TODO cleanup or better system for tracking callbacks
                  // @ts-ignore
                  this.refVar = this.$findVar(fieldDef.ref);
                  this.refVarLink = this.refVar.$addEvent(x => value.$v = x.$v);
                  value.$v = this.refVar.$v;
                } else {
                  // Don't do for refs, they go off after lookup. a change of the lookup triggers
                  // a new record changed on it's own so this is also unneccesary
                  value.$addEvent(
                    // @ts-ignore
                    this._recordChangedBound);
                }
              }
              return value;
            },
            enumerable: true,
          });
        }
      } else {
        log.error(`Invalid type (${recordDef[publicName]}) in record definition`);
      }

      if (fieldDef.lookup) {
        let pathTolookup = fieldDef.lookup.split('.');
        if (newClass.prototype.hasOwnProperty(pathTolookup[0])) {
          console.log(
            "already defined, need step deeper for next lookup",
            publicName, fieldDef
          );
        } else {
          // These are used in the class as private statics
          let lookupTable = null;
          let lookupField = "";
          let privatelookupName = '_' + pathTolookup[0];
          Object.defineProperty(newClass.prototype, pathTolookup[0], {
            get: function () {
              // this[publicName]; // Trigger publicn 1st to create priavte var name
              let privateVar = this[privatelookupName];
              if (!privateVar) {
                // This code is executed once for the class
                // it was placed here so it fires after the structure is fully created
                if (!lookupTable || !lookupField) {
                  let current = this.$getMain();// Types.main;
                  for (let ix = 0; ix < pathTolookup.length - 1; ix++) {
                    let newCurrent = current[pathTolookup[ix]];
                    if (!newCurrent) {
                      console.error("lookup not found!");
                      break;
                    }
                    current = newCurrent;
                  }
                  lookupTable = current;
                  lookupField = pathTolookup[pathTolookup.length - 1];
                  console.log(
                    "lookup resolved for " + publicName,
                    lookupTable,
                    lookupField
                  );
                }
                // This code is executed once for each instance of the class
                privateVar = new lookupTable.elementType();
                if (!privateVar) {
                  debugger;
                }
                this[privatelookupName] = privateVar;

                const lookupVar = this[publicName];
                let lastUpdateTo = null;
                let lastUpdateToLinks = null;
                const updateValue = () => {
                  let result = lookupTable.find(lookupField, lookupVar.$v);
                  if (result) {
                    // 
                    this[privatelookupName].$v = result;
                    lastUpdateToLinks = result.$updateTo(this[privatelookupName]);
                    lastUpdateTo?.$clearUpdateTo(lastUpdateToLinks);
                    lastUpdateTo = result;
                  }
                };
                lookupVar.$addEvent(updateValue);

                updateValue();
              }
              return privateVar;
            },
          });
        }
      }
    }

    newClass.prototype._fieldNames = fieldNames;
    newClass.prototype._fieldDefs = fieldDefs;

    // TODO: methods for value and trigger on change for record

    return newClass;
  },

  addArray: function (name, elementType) {
    let newClass = Types.addNamedType(name, ArrayTableVar);
    // newClass.constructor = ArrayTableVar.constructor;
    let elementDef = BaseVar.parseDefinition(elementType, '');

    Types[name] = newClass;
    newClass.prototype._elementDef = elementDef;
    // newClass.constructor.elementDef = elementDef;
    return newClass;
  }
}
export { Types };