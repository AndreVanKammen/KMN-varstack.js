import { BaseVar } from "../vars/base.js";
import { IntVar } from "../vars/int.js";

export class ChangeCollector extends IntVar {
  constructor() {
    super();
    this.links = [];
    this._handleSubChangeBound = this.triggerChange.bind(this);
  }

  /**
   * Var to trigger change in this var
   * @param {BaseVar} baseVar 
   */
  addVar(baseVar) {
    this.links.push({
      baseVar,
      link: baseVar.$addDeferedEvent(this._handleSubChangeBound)
    });
  }

  triggerChange() {
    this.$v++;
  }

  clearVars() {
    let oldLinks = this.links;
    this.links = [];
    for (let lnk of oldLinks) {
      lnk.baseVar.$removeEvent(lnk.link);
    }
  }
  
  dispsose() {
    // TODO Give baseVar dispose for faster cleanup of links etc.
    // super.dispose();
    this.clearVars();
  }
}