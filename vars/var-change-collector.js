import defer from "../../KMN-utils.js/defer.js";

export class VarChangeCollector {
  constructor() {
    this.changeList = new Map();
    this.changeSceduled = false;
    this.showChangesBound = this.showChanges.bind(this);
  }
  showChanges() {
    // @ts-ignore Added for debug
    //       window.lastChangeList = changeList;
    // console.log('Changes:',this.changeList)
    
    this.changeSceduled = false;
    this.changeList = new Map();
  }

  add(varChange, oldVal) {
    this.changeList.set(varChange._hash, varChange);
    if (!this.changeSceduled) {
      this.changeSceduled = true;
      defer(this.showChangesBound);
    }
  }
}
