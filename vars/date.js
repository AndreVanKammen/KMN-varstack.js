import log from '../core/log.js';
import { BaseVar, BaseDefinition } from './base.js';

export class DateVar extends BaseVar {
  constructor () {
    super();
    this._value = new Date();
  };

  /** @type {Date} */
  get $v() {
    return this._value
  }

  /** @param {any} x */
  set $v(x) {
    let newDate;
    if (typeof x !== 'object' || !(x instanceof Date)) {
      if (!isNaN(x)) {
        newDate = new Date(x)
      } else {
        if (typeof x === 'string' && x) {
          let y = Date.parse(x);
          if (isNaN(y)) {
            log.error(`Invalid value (${x}) for DateVar`);
            return
          } else
          newDate = new Date(y);
        } else {
          log.error(`Invalid value (${x}) for DateVar`);
        }
      }
    } else {
      newDate = x;
    }

    // Since == won't work on dates (thanks javascript) but <= does (realy javbascript?)
    if (!(this._value <= newDate && this._value >= newDate)) {
      this._value = newDate;
      this._valueChanged();
    }
  }

  get $niceStr() {
    if (this._value) {
      let todayStr = (new Date()).toISOString().substring(2, 10);
      var dateStr = this._value.toISOString().substring(2, 10);
      if (todayStr === dateStr) {
        return 'today '+this._value.toLocaleTimeString(undefined, { timeStyle: 'short' });
      } else {
        return this._value.toLocaleDateString(undefined, { dateStyle: 'short' });
      }
    } else {
      return '-';
    }
  }

  toString() {
    return this.$niceStr;
  }
}
DateVar.typeDefinition = new BaseDefinition({
  type: 'Date',
  inputType: 'date',
  sortIsNumber: true
});
