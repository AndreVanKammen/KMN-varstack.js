import defer from "../../KMN-utils.js/defer.js";
import { BaseVar } from "./base.js";

class BlobBaseVar extends BaseVar {
  constructor() {
    super ();

    this._loadResolvers = [];
    this._isLoading = false;
    this._loadCallback = async (t) => t.$v;
  }

  /**
   * This needs to be overriden
   * @param {*} value 
   */
  _storeNoCallBack(value) {
  }

  $getValueAsync(forceReload) {
    if (this.$v && !forceReload) {
      return Promise.resolve(this.$v);// new Promise((resolve) => resolve(this.$v));
    } else {
      const promise =  new Promise((resolve) => {
        this._loadResolvers.push(resolve);
      });
      if (!this._isLoading) {
        this._isLoading = true;
        defer(async () => {
          let value = await this._loadCallback(this);
          if (value) {
            this._storeNoCallBack(value);
          }
          const resolvers = this._loadResolvers;
          this._loadResolvers = [];
          this._isLoading = false;
          for (const resolve of resolvers) {
            resolve(value);
          }

        });
      }
      return promise;
    } 
  }
}

BlobBaseVar.isBlob = true;

export { BlobBaseVar }