// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from '../vars/base.js';
import { RecordVar } from '../structures/record.js';
import InputBinding from './input-binding.js';

let labelUid = 0;
const nop = function() {};
class InputBuilder {
  /**
   * @param {HTMLElement} element
   * @param {object} options
   */
  constructor (element, options) {
    this.options = { ...{ onLabelClick:nop, onInputClick:nop },...(options || {})};
    this.table = element.$el({tag:'table'});
  }

  /**
   * @param {BaseVar} v
   * @param {string} [labelName]
   * @param {string} [overrideType]
   */
  addVar(v, labelName, overrideType) {
    labelName = labelName || v.$varDefinition.name;
    let labelId = 'i_' + (labelUid++);
    let row = this.table.$el({tag:'tr'});
    let label = row.$el({tag:'td', cls:'isLabel'}).$el({tag:'label'});
    let input = row.$el({tag:'td', cls:'isInput'}).$el({tag:'input'});
    label.onclick = (event) => this.options.onLabelClick(event, labelName, v);
    input.onclick = (event) => this.options.onInputClick(event, labelName, v);
    label.innerText = labelName;
    label.setAttribute('for',labelId);
    input.setAttribute('id',labelId);
    let dataBinding = new InputBinding(v, input, overrideType);
    return {
      labelId,
      row,
      label,
      input
    }
  }  

  /**
   * @param {RecordVar} rec
   * @param {string[]} [overrideTypes]
   */
  addRecord(rec, overrideTypes) { 
    for (var name of rec.$fieldNames) {
      let v = rec[name];
      if (v && v instanceof BaseVar) {
        this.addVar(v, name, overrideTypes ? overrideTypes[name] : undefined)
      }
    }  
  }
}

export default InputBuilder;