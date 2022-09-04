// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/


import log from "../core/log.js";
import { Types } from "../varstack.js";
import { RecordVar } from "./record.js";
import { ArrayTableVar, TableVar } from "./table.js";
import { BaseVar } from '../vars/base.js';
import { IntVar } from "../vars/int.js";

/**
 * @template {BaseVar} T
 * @class {TableCursor<T>}
 */
class TableCursor {

  /**
   * @param {T} recordTypeOrTable 
   */
  constructor (recordTypeOrTable) {
    /** @type {TableVar} */
    this._table = undefined;
    this._cursorLinksTo = undefined;
    this._tableLinksTo = undefined;

    this._index = new Types.Int();
    this._index.$v = -1;
    this._index.$addEvent(this._indexChanged.bind(this));
    // I want to specify that this cursorf is a BASE class not THE CLASS typescript assumes it to be
    // if I do this and errors on all the variables on the dynamicly created sub classes :(
    /** @type {RecordVar} */
    this._cursor = null;
    /** @type {RecordVar} */
    this._lastRec = null;

    if (recordTypeOrTable instanceof TableVar) {
      this.table = recordTypeOrTable;
    } else {
      this.setCursorType (recordTypeOrTable);
    }

    // TODO: handle array changes
  }
  /** @param {IntVar} indexVar */
  _indexChanged (indexVar) {
    if (!this._cursor) {
      return
    }
    this._cursor.$clearUpdateTo(this._cursorLinksTo);
    if (!this._table) {
      log.error('Cursor has no table!');
      return;
    }

    if (this._lastRec) {
      this._lastRec.$clearUpdateTo(this._tableLinksTo);
    }

    let ix = indexVar.$v;
    
    if (ix === -1) {
      // TODO set empty record values
      return
    }
    if (0 > ix || ix >= this._table.length) {
      log.error('Index out of bounds!', ix);
      return;
    }
    this._lastRec = this._table.element(ix);
    this._cursor.$v = this._table.element(ix).$v;
    this._cursorLinksTo = this._cursor.$updateTo(this._lastRec);
    this._tableLinksTo = this._lastRec.$updateTo(this._cursor);
  }

  setIndexOnRecord(rec) {
    if (this.table instanceof ArrayTableVar) {
      let ix = this.table.array.indexOf(rec);
      if (ix !== -1) {
        this.index.$v = ix;
      }
    } else {
      console.error('setIndexOnRecord not supported on nome ArrayTableVar table');
    }
  }

  setCursorType (recordType) {
    // Don't destroy cursor bindings if the type is the same
    if (this._cursor) {
      if (this._cursor.constructor === recordType) {
        return;
      }
      log.warn('Cursor type changed!');
    }

    this._cursor = new recordType();
    this._cursor.$parent = this.table.$getMain();
  }

  set table (value) {
    // Consider replacing _ with # when the time comes they all support it (firefox and safari currently give errors on #)
    if (this._table !== value) {
      // if (this._index.$v === -1) {
      //   // Always trigger indexvar on table change
      //   this._index._valueChanged();
      // } else {
      this._index.$v = -1;
      //}
      this._table = value;
      this.setCursorType(this._table.elementType);
      this._cursor.$parent = this.table.$getMain();
    }
  }

  get table () {
    return this._table;
  }

  // /** @type {import('../../../TS/record.js').IRecordVar} */
  /** @type {T} */
  get original() {
    let key = this._cursor.$v[this._cursor.$keyFieldName].$v;
    // @ts-ignore
    return this._table.find(this._cursor.$keyFieldName, key);
  }

  // /** @type {import('../../../TS/record.js').IRecordVar} */
  /** @type {T} */
  get cursor () {
    // @ts-ignore
    return this._cursor;
  }

  get index() {
    if (this._index.$v >= this.table.length) {
      this._index.$v = -1;
    }
    return this._index;
  }
}

export default TableCursor