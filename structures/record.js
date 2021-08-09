// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseVar } from '../vars/base.js';

class RecordVar extends BaseVar {
  constructor() {
    super();
    /** @type {typeof RecordVar} */ /* @ts-ignore: Don't blame ts for not getting this :) */
    this.myProto = Reflect.getPrototypeOf(this);

    this._recordChangedAfterJSFinishBound = this._recordChangedAfterJSFinish.bind(this);
    this._handleChangeAfterJSFinished = undefined;

    // @ts-ignore: Sometimes clashes with TS indexer define in record.ts
    this.changeLinks = [];
    this._recordChangedBound =  this._recordChanged.bind(this)
  }

  toJSON() {
    let result = {}
    for (let fieldDef of this.$fieldDefs) {
      let fieldName = fieldDef.name;
      if (!fieldDef.noStore) {
        const objVar = this[fieldName];
        result[fieldName] = objVar.$v;
      }
    }
    return result;
  }

  toObject () {
    let result = {}
    for (let fieldDef of this.$fieldDefs) {
      let fieldName = fieldDef.name;
      if (!fieldDef.noStore) {
        const objVar = this[fieldName];
        if (objVar.toObject) {
          result[fieldName] = objVar.toObject();
        } else {
          result[fieldName] = objVar.$v;
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
      let value = this[pathToValue[0]];
      for (let ix = 1; ix < pathToValue.length; ix++) {
        if (value) {
          value = value[pathToValue[ix]];
        }
      }
      return value;
    }
  }

  _recordChangedAfterJSFinish() {
    this._valueChanged()
    // Setting this after prevents updates from the trigger changing it forever
    this._handleChangeAfterJSFinished = undefined;
  }

  _recordChanged() {
    // Since record updates trigger after every fieldset let's collate
    // them with resceduled time-out of 0 so it triggers only once.
    // This could give side-effects, but best solution for now
    // if (!this._handleChangeAfterJSFinished) {
    //   this._handleChangeAfterJSFinished = 
    //     globalThis.setTimeout(this._recordChangedAfterJSFinishBound, 0);
    // }

    // It gave to much issues
    this._recordChangedAfterJSFinishBound();
  }

  $updateTo(targetRecord) {
    let linksTo = []
    for (let fieldName of this.$fieldNames) {
      linksTo.push(
        {
          fieldName,
          handle: this[fieldName].$addEvent(
            x => targetRecord[fieldName].$v = x)
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

export { RecordVar };