import log from '../core/log.js';
import { BaseVar, BaseDefinition } from './base.js';

export class DateVar extends BaseVar {
  constructor () {
    super();
    this._value = new Date();
  };

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
      var timeString = this._value.toISOString();
      return timeString.substring(2,10) + ' ' + timeString.substring(11,16);
    } else {
      return undefined;
    }
  }

  toString() {
    return this.$niceStr;
  }
}
DateVar.typeDefinition = new BaseDefinition({
  type: 'Date',
  sortIsNumber: true
});
