import { BaseDefinition, BaseVar } from './base.js';
import { StringVar } from './string.js';

export class TextVar extends StringVar {
}

TextVar.typeDefinition = new BaseDefinition({
  ...StringVar.typeDefinition,
  ...{
    type: 'Text',
    inputType: 'textarea',
    defVal: ''
  }
});
