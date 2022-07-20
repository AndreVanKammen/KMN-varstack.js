//// @ts-nocheck
// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

// TODO: Clean this up, it's messy

import { BaseDefinition, BaseVar } from './vars/base.js';
import { BoolVar } from './vars/bool.js';
import { StringVar } from './vars/string.js';
import { IntVar } from './vars/int.js';
import { FloatVar } from './vars/float.js';

import { RecordVar } from './structures/record.js';
import { ArrayTableVar } from './structures/table.js';

import log from './core/log.js';
import { DurationVar } from './vars/duration.js';
import { TimeVar } from './vars/time.js';
import { DateVar } from './vars/date.js';
import { Float32ArrayVar } from './vars/float-32-array.js';
import { BlobVar } from './vars/blob.js';
import { EnumVar } from './vars/enum.js';
import { PercentageVar } from './vars/percentage.js';

function classOf(typeToCheck, checkType) {
  while (typeToCheck = typeToCheck.__proto__) {
    if (typeToCheck === checkType) {
      return true;
    }
  }
  return false;
}
/**
 * 
 * @param {string} definition 
 * @param {string} name 
 * @returns {BaseDefinition}
 */
export const parseVarDefinition = function (definition, name = undefined) {
  if (typeof definition === 'object') {
    return definition;
  }
  // TODO: use a definition record, change the string stuff to definition and add more like ranges, masks, lookup etc.
  //       This so we can always create an apropriate edit.
  let defs = definition.split(':');
  let definitions = defs.length <= 1 ? [] : defs[1].split(',');
  let typeName = defs[0];
  let typeToMake = Types[typeName];
  if (!typeToMake) {
    console.error(`Unknown type "${typeName}" in definition "${definition}", replaced by string!`);
    typeToMake = Types.String;
    typeName = "String";
  }
  let def = new BaseDefinition(typeToMake.typeDefinition);

  def.name = name;
  def.type = typeName;
  
  def.range = definitions.filter(x => x.startsWith('range>'))[0]?.substring(6)?.split('..')?.map(x => Number.parseFloat(x)) || def.range;
  def.step = definitions.filter(x => x.startsWith('step>'))[0]?.substring(5) || def.step;
  let newDefVal = definitions.filter(x => x.startsWith('defval>'))[0]?.substring(7);
  if (newDefVal != null) {
    def.defVal = newDefVal;
  }
  let precision = definitions.filter(x => x.startsWith('precision>'))[0]?.substring(10);
  // @ts-ignore
  def.precision = isFinite(precision) ? ~~(precision) : def.precision;

  def.isReadOnly = definitions.indexOf('ro') !== -1 || def.isReadOnly;
  
  def.isKey = definitions.indexOf('key') !== -1;
  def.isValue = definitions.indexOf('value') !== -1;
  def.noStore = definitions.indexOf('nostore') !== -1;

  def.inputType = definitions.filter(x => x.startsWith('input>'))[0]?.substring(6)||def.inputType;
  def.lookup = definitions.filter(x => x.startsWith('lookup>'))[0]?.substring(7);
  def.defRef = definitions.filter(x => x.startsWith('defref>'))[0]?.substring(7);
  def.ref = definitions.filter(x => x.startsWith('ref>'))[0]?.substring(4);


  return def;
}


/** @type {import('../../TS/vastack').VarStackTypes} */
const Types = {
  main: undefined,
  Int: IntVar,
  Float: FloatVar,
  Bool: BoolVar,
  String: StringVar,
  Date: DateVar,
  Time: TimeVar,
  Percentage: PercentageVar,
  Duration: DurationVar,
  Float32Array: Float32ArrayVar,
  Blob: BlobVar,
  Enum: EnumVar,
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

  addEnum: function (name, enumValues) {
    const newClass = Types.addNamedType(name, EnumVar);
    newClass.initialize(name, enumValues);
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
      let fieldDef = parseVarDefinition(recordDef[publicName], publicName);

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
                // @ts-ignore
                const definitionVar = this.$findVar(fieldDef.defRef);
                this[privateName+'_def'] = definitionVar;
                const createValueVar = () => {
                  const fieldDef2 = parseVarDefinition(definitionVar.$v, publicName);
                  let typeToMake = Types[fieldDef2.type];
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
                    if (!fieldDef2.noStore) {
                      // @ts-ignore
                      value.$addEvent(this._recordChangedBound);
                    }
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
          const typeClass = Types[fieldDef.type];
          Object.defineProperty(newClass.prototype, publicName, {
            get: function () {
              /** @type {BaseVar} */
              let value = this[privateName];
              if (!value) {
                value = new typeClass();
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
                  if (!fieldDef.noStore) {
                    value.$addEvent(
                      // @ts-ignore
                      this._recordChangedBound);
                  }
                }
              }
              return value;
            },
            enumerable: true,
          });
          // If there is a record in a record, add all the fields to this fieldDefs and names
          // And make public not enumerable shortcuts to the getters
          if (classOf(typeClass, RecordVar)) {
            for (let ix = 0; ix < typeClass.prototype._fieldNames.length; ix++) {
              let subFieldName = typeClass.prototype._fieldNames[ix];
              let fullSubFieldName = publicName + '.' + subFieldName;
              let subFieldDef = typeClass.prototype._fieldDefs[ix];
              fieldNames.push(fullSubFieldName);
              fieldDefs.push(subFieldDef);
              Object.defineProperty(newClass.prototype, fullSubFieldName, {
                get: function () {
                  return this[publicName][subFieldName]
                },
                enumerable: false,
              });
            }
            // console.log('Sub Record:', typeClass.prototype, fieldDef);
          }
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
                  // @ts-ignore
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
                  // console.log(
                  //   "lookup resolved for " + publicName,
                  //   lookupTable,
                  //   lookupField
                  // );
                }
                // This code is executed once for each instance of the class
                privateVar = new lookupTable.elementType();
                if (!privateVar) {
                  debugger;
                }
                this[privatelookupName] = privateVar;
                // We are not the parent for this var, if we do we break storage
                // privateVar.$parent = this;
                privateVar.$parent = lookupTable.$parent;
                // console.log('lookup parent: ', privateVar.$parent);

                const lookupVar = this[publicName];
                let lastUpdateToLookupLinks = null;
                let lastUpdateFromLookup = null;
                let lastUpdateFromLinks = null;
                let lastLookUpEvent = -1;
                const updateValue = async () => {
                  let lookupRecord = lookupTable.find(lookupField, lookupVar.$v);

                  this[privatelookupName].$clearUpdateTo(lastUpdateToLookupLinks);
                  lastUpdateFromLookup?.$clearUpdateTo(lastUpdateFromLinks);

                  if (lookupRecord) {
                    if (lastLookUpEvent>=0) {
                      lookupTable.$removeEvent(lastLookUpEvent);
                      lastLookUpEvent = -1;
                    }
                    this[privatelookupName].$v = lookupRecord;
                    lastUpdateToLookupLinks = this[privatelookupName].$updateTo(lookupRecord);
                    lastUpdateFromLinks = lookupRecord.$updateTo(this[privatelookupName]);
                    lastUpdateFromLookup = lookupRecord;
                  } else {
                    if (lastLookUpEvent === -1) {
                      lastLookUpEvent = lookupTable.$addDeferedEvent(updateValue, false);
                    }
                  }
                };
                lookupVar.$addDeferedEvent(updateValue, true);
                
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
    let elementDef = parseVarDefinition(elementType, '');

    Types[name] = newClass;
    newClass.prototype._elementDef = elementDef;
    // newClass.constructor.elementDef = elementDef;
    return newClass;
  },

  add(type) {
    // @ts-ignore
    this[type.typeDefinition.type] = type;
  }

}
export { Types };