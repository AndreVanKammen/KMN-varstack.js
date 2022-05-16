// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { Types } from '../varstack.js';
import { BaseVar } from '../vars/base.js';
import log from '../core/log.js';
import { RecordVar } from './record.js';

class TableVar extends BaseVar {
  constructor() {
    super();

    /** @type {typeof TableVar} */ /* @ts-ignore: Don't blame ts for not getting this :) */
    this.myProto = Reflect.getPrototypeOf(this);
    this.sortField = '';
    this.sortAscending = false;
    this.sortInvalidated = false;
    this.sortArray = [];
    this.inLinkChanged = true;
  }

  /** @type {typeof BaseVar} */
  get elementDef() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return this.myProto._elementDef;
  }
  get elementType() {
    // @ts-ignore: I need this to be on the inherited class, not on the base then everything would be the same
    return Types[this.myProto._elementDef.type];
  }

  get keyFieldName () {
    return this.elementType.prototype._keyFieldName;
  }

  _newElementInstance() {
    let el = new this.elementType;
    el.$parent = this;
    el.$setDefinition(this.elementDef);
    return el;
  }

  updateElement(ix, arrayElement) {
  }

  add(arrayElement) {
    return this.updateElement(this.length, arrayElement);
  }

  clearRecords() {
    this.length = 0;
  }

  element(ix) {
    return null;
  }

  /** @returns {Iterator<any>} */
  *[Symbol.iterator] () {
    for (let ix = 0; ix< this.length; ix++) {
      yield this.element(ix);
    }
  }

  get length() {
    return 0;
  }

  set length(x) {
  }

  get $v() {
    return this
  }

  linkTables (srcTable) {
  }

  /** @param {any} srcTable */
  set $v(srcTable) {
    if (srcTable instanceof TableVar) {
      if (srcTable.constructor === this.constructor) {
        this.linkTables(srcTable);
        return;
      } else {
        for (let ix = 0; ix < srcTable.length; ix++) {
          this.updateElement(ix, srcTable.element(ix));
        }
        this.length = srcTable.length
        return;
      }
    } else if (Array.isArray(srcTable)) {
      for (let ix = 0; ix < srcTable.length; ix++) {
        this.updateElement(ix, srcTable[ix]);
      }
      this.length = srcTable.length
      return;
    } else if (typeof srcTable === 'object') {
      let ix = 0;
      // If source is an object and out element has a keyFieldName we map it's keys and values to the records
      let rec = new this.elementType;
      rec.$parent = this;
      if (rec instanceof RecordVar && rec.$keyFieldName && rec.$valueFieldName) {
        for (let name in srcTable) {
          if (!(name.startsWith('_'))) {
            rec[rec.$keyFieldName].$v = name;
            rec[rec.$valueFieldName].$v = srcTable[name];
            this.updateElement(ix++, rec);
          }
        }
        this.length = ix;
        return;
      } 
    }
    this.length = 0;
    console.trace('Invalid table assignment ', srcTable);
  }

  toJSONArray() {
    let fieldNames = [];
    for (let fieldDef of this.elementType.prototype._fieldDefs) {
      let fieldName = fieldDef.name;
      if (!fieldDef.noStore) {
        fieldNames.push(fieldName);
      }
    }

    let result = '[' + JSON.stringify(fieldNames);
    for (let ix = 0; ix < this.length; ix++) {
      let row = [];
      let el = this.element(ix);
      for (let fieldName of fieldNames) {
        row.push(el[fieldName].$v);
      }
      result += ',\n' + JSON.stringify(row);
    }
    return result + ']';
  }

  fromJSONArray(data) {
    let fieldNames = data[0];
    for (let ix = 1; ix < data.length; ix++) {
      let rec = this._newElementInstance();
      for (let jx = 0; jx < fieldNames.length; jx++) {
        let fieldName = fieldNames[jx];
        let fieldValue = data[ix][jx];
        rec[fieldName].$v = fieldValue;
      }
      this.add(rec);
    }
  }

  // These specific functions are place here so they can be optimized later on 
  // by making them "to the point" we can later-on turn this into api's to the server or storage
  findFields(obj) {
    for (let ix = 0; ix < this.length; ix++) {
      let elem = this.element(ix); 
      let match = true;
      for (let key in obj) {
        // TODO var base needs overridable compare function
        if (elem[key].$v != obj[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        return elem;
      }
    }
  }

  find(fieldName, value) {
    for (let ix = 0; ix < this.length; ix++) {
      let el = this.element(ix)
      if (el[fieldName].$v === value) {
        return el;
      }
    }
  }

  /**
   * @param {BaseVar} elementInstance - Element instance to find
   * @returns {number}
   */
  findIxForElement(elementInstance) {
    for (let ix = 0; ix < this.length; ix++) {
      if (this.element(ix) === elementInstance) {
        return ix;
      }
    }
    return -1;
  }
  /**
   * @param {String} fieldName - Element type of the array or the name of a field
   * @param {any} value - Value to search for 
   * @returns {number}
   */
  findIx(fieldName, value) {
    for (let ix = 0; ix < this.length; ix++) {
      // @ts-ignore
      if (this.element(ix)[fieldName].$v === value) {
        return ix;
      }
    }
    return -1;
  }

  /**
   * 
   * @param {string} fieldName 
   * @param {string | number} value1 
   * @param {number} value2 
   */
  setFilter(fieldName, value1, value2) {
    this.sortField = fieldName;
    this.filterField = fieldName;
    this.filterValueStr = value1.toString();
    // @ts-ignore
    this.filterValue1 = Math.min(value1, value2);
    // @ts-ignore
    this.filterValue2 = Math.max(value1, value2);
    this.sortInvalidated = true;
  }

  setSort(fieldName, ascending = undefined) {
    console.log('set sort:', fieldName);
    if (this.sortField !== fieldName) {
      this.sortField = fieldName;
      this.sortInvalidated = true;
    } else {
      this.sortAscending = !this.sortAscending;
      this.sortInvalidated = true;
    }
    if (ascending !== undefined && this.sortAscending !== ascending) {
      this.sortAscending = ascending;
      this.sortInvalidated = true;
    }
  }

  getSortArray() {
    if (this.sortInvalidated) {
      this.sortArray = [];
      if (this.sortField === '') {
        for (let ix = 0; ix < this.length; ix++) {
          this.sortArray.push(ix);
        }
      } else {
        let tempArray = [];
        for (let ix = 0; ix < this.length; ix++) {
          let val = this.element(ix)[this.sortField].$sortValue;
          if (this.filterField) {
            let fieldIx = this.elementType.prototype._fieldNames.indexOf(this.filterField);
            let recInFiltered = true;
            if (this.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
              if (this.element(ix)[this.filterField].$sortValue < this.filterValue1) {
                recInFiltered = false;
              }
              if (this.element(ix)[this.filterField].$sortValue > this.filterValue2) {
                recInFiltered = false;
              }
            } else {
              recInFiltered = this.element(ix)[this.filterField].$niceStr.toLocaleLowerCase()
                .indexOf(this.filterValueStr.toLocaleLowerCase()) >= 0;
            }

            if (recInFiltered) {
              tempArray.push({ ix, val });
            }
          }
          else {
            tempArray.push({ ix, val });
          }
        }


        let fieldIx = this.elementType.prototype._fieldNames.indexOf(this.sortField);
        if (fieldIx >= 0) {
          let sortMultiplier = this.sortAscending ? -1 : 1;
          if (this.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
            tempArray = tempArray.sort((a, b) => (a.val - b.val) * sortMultiplier);
          } else {
            tempArray = tempArray.sort((a, b) => a.val.localeCompare(b.val) * sortMultiplier)
          }
          for (let ix = 0; ix < tempArray.length; ix++) {
            this.sortArray.push(tempArray[ix].ix)
          }
        }
      }
      this.sortInvalidated = false;
    }
    return this.sortArray;
  }
}
TableVar.elementDef = undefined;

class ArrayTableVar extends TableVar {
  constructor () {
    super()
  
    this.tableChangedBound = this.tableChanged.bind(this);
    this.array = []
    // TODO write callback handler and use it in base and here it needs to re-use empty slots, this code does not
    //      this event is only triggered for array changes, not contents of array
    this._arrayChangedCallbacks = [];
  }

  tableChanged () {
    this._valueChanged();
  }

  element(ix) {
    return this.array[ix];
  }
  get length() {
    return this.array.length;
  }
  set length(x) {
    if (this.array.length !== x) {
      // TODO cleanup of callbacks
      this.array.length = x;
      this.handleArrayChanged();
    }
  }

  toJSON () {
    return this.array;
  }

  toObject () {
    if (this.elementType.prototype.toObject) {
      const result = [];
      for (const el of this.array) {
        result.push(el.toObject());
      }
      return result;
    } else {
      return [...this.array];
    }
  }

  moveUp(rec) {
    let ix = this.array.indexOf(rec);
    if (ix<=0) {
      log.error('Invalid index({ix}) to move up!', { ix });
      return;
    }
    let swap = this.array[ix-1];
    this.array[ix-1] = this.array[ix];
    this.array[ix] = swap;
    this.handleArrayChanged();
    // console.log('Move up ', ix, rec);
  }  

  moveDown(rec) {
    let ix = this.array.indexOf(rec);
    if (ix>=this.array.length-1) {
      log.error('Invalid index({ix}) to move down!', { ix });
      return;
    }
    let swap = this.array[ix+1];
    this.array[ix+1] = this.array[ix];
    this.array[ix] = swap;
    this.handleArrayChanged();
    // console.log('Move down ', ix, rec);
  }

  insert(rec, insertIndex) {
    let ix = this.array.indexOf(rec);
    if (ix>=this.array.length-1) {
      log.error('Invalid index({ix}) to move down!', { ix });
      return;
    }
    let el = this._newElementInstance();
    this.array.splice(insertIndex, 0, el);
    el.$v = rec;
    this.handleArrayChanged();
    // console.log('Move down ', ix, rec);
  }

  remove(rec) {
    let ix = this.array.indexOf(rec);
    // TODO Cleanup events
    this.array.splice(ix,1);
    this.handleArrayChanged();
    // console.log('Remove ', ix, rec);
  }

  addArrayChangeEvent (callBack) {
    // TODO: re-use empty entries, add sequ
    return this._arrayChangedCallbacks.push(callBack) - 1;
  }

  removeArrayChangeEvent (handle) {
    this._arrayChangedCallbacks[handle] = null
  }

  linkTables (srcTable) {
    if (this.array !== srcTable.array) {
      this.array = srcTable.array;
      this.linkedTable = null;
      this.handleArrayChanged();
      this.linkedTable = srcTable;
    }
  }
  
  handleArrayChanged () {
    this.tableChanged();
    this.sortInvalidated = true;

    for (let callBack of this._arrayChangedCallbacks) {
      if (callBack) {
        callBack(this);
      }
    }
    if (this.linkedTable && !this.inLinkChanged && this.linkedTable !== this) {
      try {
        // Prevent circular link firing forever
        this.inLinkChanged = true;
        this.linkedTable.handleArrayChanged();
      } finally {
        this.inLinkChanged = false;
      }
    }
  }

  toString () {
    return JSON.stringify(this.array, null, 2);
  }

  _newElementInstance() {
    let el = super._newElementInstance()
    el.$addEvent(this.tableChangedBound);
    return el;
  }

  updateElement(ix, arrayElement) {
    let el;
    let changed = false;
    while (this.array.length <= ix) {
      el = this._newElementInstance();
      this.array.push(el);
      changed = true;
    }
    el = this.array[ix];
    el.$v = arrayElement;
    if (changed) {
      this.handleArrayChanged();
    }

    return el;
  }
}

export { TableVar, ArrayTableVar };