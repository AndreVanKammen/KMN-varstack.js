// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { Types } from "../varstack.js";

const updateTimeOut = 1000;

class LocalStorageBinding {
  constructor(varToStore, localStorageName, defaultData) {
    this.varToStore = varToStore;
    this.localStorageName = localStorageName;

    this.localUpdateTimer = undefined;
    this.locaStorageUpdating = new Types.Bool();
    this.justCreated = true;

    try {
      let localStorageData = JSON.parse(localStorage.getItem(this.localStorageName));
      if (localStorageData) {
        this.varToStore.$v = localStorageData
        this.justCreated = false;
      }
    } catch (ex) {
      console.log("Error reading local storage!", ex);
    }
    if (this.justCreated && defaultData) {
      varToStore.$v = defaultData;
    }
    window.setTimeout(() => {
      this.varToStore.$addEvent(this.handleChanged.bind(this))
    },0);
  }

  getJS() {
    let regex = new RegExp('"','g');
    let jsonStr = JSON.stringify(this.varToStore, null, 2);
    // jsonStr = jsonStr.replace(regex, '`');
    return ` const ${this.localStorageName} = `+
    `${jsonStr};\n`+
    `export default ${this.localStorageName}`;
  }

  handleChanged() {
    if (this.localStorageName) {
      this.locaStorageUpdating.$v = true;
      if (this.localUpdateTimer) {
        clearTimeout(this.localUpdateTimer);
      }
      this.localUpdateTimer = setTimeout(() => {
        this.locaStorageUpdating.$v = true;

        let storeStr = JSON.stringify(this.varToStore);
        let start = performance.now();
        localStorage.setItem(this.localStorageName, storeStr);
        let stop = performance.now();
        console.log('Update to local storage: ',storeStr.length,'bytes ',(stop-start).toFixed(2));
      }, updateTimeOut);
    }
  }
}

export default LocalStorageBinding