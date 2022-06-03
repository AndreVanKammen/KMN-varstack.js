// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding } from '../vars/base.js';
import { Types } from '../varstack.js';

function parseTemplate(templateStr, record) {
  let result = '';
  let varStr = '';
  let inVar = false;
  let escaped = false;
  for (let ch of templateStr) {
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch==='\\') {
      escaped = true;
    } else if (ch==='{') {
      inVar = true;
    } else if (ch==='}') {
      result += record[varStr].$niceStr;
      varStr = '';
      inVar = false;
    } else {
      if (inVar) {
        varStr += ch;
      } else {
        result += ch;
      }
    }
  }
  return result;
}

function getVarsInTemplate(templateStr) {
  let result = [];
  let varStr = '';
  let inVar = false;
  let escaped = false;
  for (let ch of templateStr) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch==='\\') {
      escaped = true;
    } else if (ch==='{') {
      inVar = true
    } else if (ch==='}') {
      if (varStr) {
        result.push(varStr);
        varStr = '';
      }
      inVar = false;
    } else {
      if (inVar) {
        varStr += ch;
      }
    }
  }
  return result;
}

class TemplateBinding extends BaseBinding {
  constructor (template, record, result) {
    // I've considered the ` templates but they are to hard to use because they
    // are handled during compile/interpretation. Even the function template needs
    // real vars which would end up as func`foo ${'bar'}` instead of 'foo {bar}'
    // so we just use a string with {var} syntax
    super(result || new Types.String());
    this.record = record;
    this.template = template;
    for (let key of getVarsInTemplate(template)) {
      let templateVar = record.$findVar(key);
      templateVar.$addEvent(this.handleVarChanged.bind(this));
    }
    this.handleVarChanged();
  }

  handleVarChanged (baseVar) {
    this.baseVar.$v = parseTemplate(this.template,this.record);
  }

}

export { TemplateBinding }

