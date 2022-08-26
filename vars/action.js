import { BaseDefinition } from "./base.js";
import { BoolVar } from "./bool.js";

export class ActionVar extends BoolVar {
  get $niceStr() {
    return this._value ? 'working' : 'start';
  }
}

ActionVar.typeDefinition = new BaseDefinition(
  {
    ...BoolVar.typeDefinition, ...{
      type: 'Action',
      inputType: 'button'
    }
  });

export class ActionHandler extends ActionVar {
  constructor(onAction) {
    super();
    this.isAsync = onAction.constructor.name === 'AsyncFunction';
    this.onAction = onAction;
    this.defaultTimeOut = 200;
    this.$addDeferedEvent(this.handleActionChange.bind(this));
  }

  async handleActionChange(v) {
    if (v.$v) {
      if (this.isAsync) {
        await this.onAction();
      } else {
        this.onAction();
        setTimeout(() => this.$v = false, this.defaultTimeOut);
      }
    }
  }

}