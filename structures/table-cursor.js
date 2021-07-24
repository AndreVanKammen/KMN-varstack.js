// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/


import log from "../core/log.js";
import { Types } from "../varstack.js";
import { RecordVar } from "./record.js";
import { TableVar } from "./table.js";
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
    this._lastIX = -1;
    // I want to specify that this cursorf is a BASE class not THE CLASS typescript assumes it to be
    // if I do this and errors on all the variables on the dynamicly created sub classes :(
    /** @type {RecordVar} */
    this._cursor = null;

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

    if (this._lastIX !== -1) {
      this._table.element(this._lastIX).$clearUpdateTo(this._tableLinksTo);
    }

    let ix = indexVar.$v;
    this._lastIX = ix;
    if (ix === -1) {
      // TODO set empty record values
      return
    }
    if (0 > ix || ix >= this._table.length) {
      log.error('Index out of bounds!', ix);
      return;
    }
    this._cursor.$v = this._table.element(ix).$v;
    this._cursorLinksTo = this._cursor.$updateTo(this._table.element(ix));
    this._tableLinksTo = this._table.element(ix).$updateTo(this._cursor);
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
    this._cursor.$parent = this.table;
  }

  set table (value) {
    // Consider replacing _ with # when the time comes they all support it (firefox and safari currently give errors on #)
    if (this._table !== value) {
      if (this._index.$v === -1) {
        // Always trigger indexvar on table change
        this._index._valueChanged();
      } else {
        this._index.$v = -1;
      }
      this._table = value;
      this.setCursorType(this._table.elementType);
      this._cursor.$parent = this.table;
    }
  }

  get table () {
    return this._table;
  }

  // /** @type {import('../../../TS/record.js').IRecordVar} */
  /** @type {T} */
  get cursor () {
    // @ts-ignore
    return this._cursor;
  }

  get index () {
    return this._index;
  }
}

export default TableCursor