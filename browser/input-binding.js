// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { BaseBinding, BaseVar } from '../vars/base.js';
import { RecordVar } from '../structures/record.js';
import createLookupHandler from './lookup-handler.js';
import InnerTextBinding from './inner-text-binding.js';
import { FloatVar } from '../vars/float.js';
import { HorizontalSliderElement } from '../../components/webgl-rect/sliders.js';

const typeToInput = {
  'String': 'text',
  'Int': 'number',
  'Float': 'range',
  'Bool': 'checkbox'
}
class InputBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {HTMLInputElement} element
   * @param {string} [type]
  */
  constructor (baseVar, element, type) {
    super(baseVar);
    //console.log('InputBinding: ',baseVar, element, type);
    this.type = type;
    if (element) {
      this.setInput(element);
    }
  }

  handleVarChangedChecked (baseVar) {
     this.element.checked = this.baseVar.$v;
  }

  handleVarChanged (baseVar) {
    this.element.value = this.baseVar.$v;
  }

  handleInputChanged (ev) {
    this.baseVar.$v = this.element.value;
  }

  handleInputChangedChecked (ev) {
    this.baseVar.$v = this.element.checked;
  }

  /** @param {HTMLInputElement} element */
  setInput (element) {
    this.element = element;
    element.value = this.baseVar.$v;
    element.type = this.type || typeToInput[this.baseVar.$varType];
    if (this.baseVar.$varDefinition.isReadOnly) {
      element.setAttribute('readOnly', ''); 
    }

    if (element.type==='checkbox') {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChangedChecked.bind(this));
      element.addEventListener('change', this.handleInputChangedChecked.bind(this));
    } else if (element.type==='range') {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChanged.bind(this));
      element.addEventListener('input', this.handleInputChanged.bind(this));
      if (this.baseVar.$varDefinition && this.baseVar.$varDefinition.range) {
        element.min = this.baseVar.$varDefinition.range[0].toString();
        element.max = this.baseVar.$varDefinition.range[1].toString();
      } else {
        element.min = '0';
        element.max = '1';
      }
      element.step = '0.001';
      this.handleVarChanged()
    } else {
      this.changeEvent = this.baseVar.$addEvent(this.handleVarChanged.bind(this));
      element.addEventListener('change', this.handleInputChanged.bind(this));
    }
    createLookupHandler(this.baseVar,element);

    // @ts-ignore: 
    element.dataVar = this.baseVar;
  }

  remove() {
    super.remove();
    this.element.remove();
  }
}

class CreateInputBinding extends BaseBinding {
  /** 
   * @param {BaseVar} baseVar
   * @param {HTMLInputElement} element
   * @param {string} [type]
  */

  constructor (baseVar, element, type) {
    super(baseVar)
    let parentElement = element;
    if (this.baseVar.$varDefinition.isReadOnly) {
      this.binding = new InnerTextBinding(baseVar, element);
    } else {
      if (baseVar instanceof FloatVar) {
        this.binding = new HorizontalSliderElement(baseVar, parentElement, type);
      } else {
        let inputElement = parentElement.$el( { tag: 'input', cls: 'inline-input' });
        // TODO HACKY: If this is a record variable the show the value field
        if (baseVar instanceof RecordVar) {
          this.binding = new InputBinding(baseVar[baseVar.$valueFieldName], inputElement, type);
        } else {
          this.binding = new InputBinding(baseVar, inputElement, type);
        }
      }
    }
    this.parentElement = parentElement;
  }

  remove() {
    this.binding.remove();
  }
}

export { InputBinding as default, CreateInputBinding}