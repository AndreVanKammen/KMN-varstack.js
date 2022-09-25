// Copyright by André van Kammen
// Licensed under CC BY-NC-SA
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseVar } from '../vars/base.js';
import { BlobBaseVar } from '../vars/blob-base.js';

class RecordVar extends BaseVar {
  constructor() {
    super();
    /** @type {typeof RecordVar} */ /* @ts-ignore: Don't blame ts for not getting this :) */
    this.myProto = Reflect.getPrototypeOf(this);

    // @ts-ignore: Sometimes clashes with TS indexer define in record.ts
    this.changeLinks = [];

    // Used in varstack when building the derived class
    this._recordChangedBound = this._recordChanged.bind(this);
    this._updateRunning = false;
  }

  initializeRecord(fields) {
    let fieldNames = [];
    let fieldDefs = [];
    for (let [name, v] of Object.entries(fields)) {
      fieldNames.push(name);
      fieldDefs.push(v.$varDefinition);
    }
    // @ts-ignore
    this.myProto._fieldNames = fieldNames;
    // @ts-ignore
    this.myProto._fieldDefs = fieldDefs;
  }

  /**
   * Do a callback for all the blobfields in this record
   * @param {(name:string, v:BlobBaseVar) => void} callback
   */
  $linkBlobFields(callback) {
    for (let ix = 0; ix < this.$fieldDefs.length; ix++) {
      // for (let fieldDef of this.$fieldDefs) {
      let fieldDef = this.$fieldDefs[ix];
      let fieldName = this.$fieldNames[ix]; // fieldDef.name; subrecords have a different name
      if (!fieldDef.noStore) {
        const objVar = this[fieldName];
        if (objVar.constructor.isBlob) {
          callback(fieldName, objVar);
        }
      }
    }
  }

  toJSON() {
    return this.toObject();
    // let result = {}
    // for (let fieldDef of this.$fieldDefs) {
    //   let fieldName = fieldDef.name;
    //   if (!fieldDef.noStore) {
    //     const objVar = this[fieldName];
    //     result[fieldName] = objVar.$v;
    //   }
    // }
    // return result;
  }

  toObject () {
    let result = {}
    for (let ix = 0; ix < this.$fieldDefs.length; ix++) {
      // for (let fieldDef of this.$fieldDefs) {
      let fieldDef = this.$fieldDefs[ix];
      let fieldName = this.$fieldNames[ix]; // fieldDef.name; subrecords have a different name

      if (fieldName.indexOf('.')===-1 && !fieldDef.noStore && fieldName === this.$fieldNames[ix]) {// don't store fields of subrecords here
        const objVar = this[fieldName];
        if (!objVar.constructor.isBlob) {
          if (objVar.toObject) {
            result[fieldName] = objVar.toObject();
          } else {
            result[fieldName] = objVar.$v;
          }
        }
      }
    }
    return result;
  }

  toString() {
    return JSON.stringify(this, null, 2);
  }

  /**
   *
   * @param {string | string[]} pathToValue
   * @returns {BaseVar}
   */
  $findVar(pathToValue) {
    if (typeof pathToValue === 'string') {
      pathToValue = pathToValue.split('.');
    }
    if (pathToValue.length) {
      // if (pathToValue.length>1) {
      //   debugger;
      // }
      let value = this;
      for (let ix = 0; ix < pathToValue.length; ix++) {
        let ptv = pathToValue[ix];
        if (value) {
          let tix = -1;
          if (ptv.endsWith(']')) {
            let startIx = ptv.indexOf('[');
            if (startIx >= 0) {
              tix = Number.parseInt(ptv.substr(startIx + 1));
              ptv = ptv.substr(0, startIx);
            }
          }
          value = value[ptv];
          if (tix >= 0) {
            // @ts-ignore
            if (value.keyFieldName) {
              // @ts-ignore
              value = value.find(value.keyFieldName, tix);
            } else {
              // @ts-ignore
              value = value.array[tix];
            }
          }
        }
      }
      return value;
    }
  }

  _recordChanged() {
    this._valueChanged()
  }

  /**
   * Links all updates in this record to another record instance
   * @param {RecordVar} targetRecord
   * @returns {Array}
   */
  $updateTo(targetRecord) {
    let linksTo = []
    // Protect against recursion between records
    if (this._updateRunning) {
      console.trace('Recursive update aborted!');
      return;
    }
    this._updateRunning = true;
    try {
      for (let fieldName of this.$fieldNames) {
        linksTo.push(
          {
            fieldName,
            handle: this[fieldName].$addEvent(
              x => targetRecord[fieldName].$v = x.$v)
          }
        );
      }
      return linksTo
    } finally {
      this._updateRunning = false;
    }
  }

  /**
   * Links all updates in this record to a javascript object
   * @param {any} targetObject
   * @returns {Array}
   */
   $updateToObject(targetObject) {
    let linksTo = []
    for (let fieldName of this.$fieldNames) {
      linksTo.push(
        {
          fieldName,
          handle: this[fieldName].$addEvent(
            x => targetObject[fieldName] = x.$v)
        }
      );
    }
    return linksTo
  }

  $clearUpdateTo(linksTo) {
    if (linksTo) {
      for (let link of linksTo) {
        this[link.fieldName].$removeEvent(link.handle)
      }
      // Prevent double freeing
      linksTo = []
    }
  }

  get $v() {
    return this
  }

  set $v(srcRec) {
    if (typeof srcRec === 'object') {
      for (let name of this.$fieldNames) {
        if (!(name.startsWith('_'))) {
          let src = srcRec[name];
          if (src !== undefined) {
            let dest = this[name];
            if (src instanceof BaseVar) {
              dest.$v = src.$v
            } else {
              dest.$v = src
            }
          }
        }
      }
    } else if (this.$keyFieldName) {
      // If the source is not a record assign it to the key field
      this[this.$keyFieldName].$v = srcRec
    } else {
      console.log('Invalid record assignment ', srcRec);
    }
  }
  get $keyFieldName() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return this.myProto._keyFieldName;
  }
  get $valueFieldName() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return this.myProto._valueFieldName;
  }
  get $fieldNames() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return this.myProto._fieldNames;
  }
  get $fieldDefs() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return this.myProto._fieldDefs;
  }
}
RecordVar.isValueType = false;

export { RecordVar };