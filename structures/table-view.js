import { TableVar } from "./table.js";

export class TableView {
  /**
   * 
   * @param {TableVar} table 
   */
  constructor(table) {
    this.table = table;
    this.sortField = '';
    this.sortAscending = false;
    this.sortInvalidated = true;
    this.sortArray = [];
    this.table.$addEvent(this.handleArrayChanged.bind(this));
  }

  handleArrayChanged() {
    this.sortInvalidated = true;
  }

  /**
   * 
   * @param {string} fieldName 
   * @param {string | number} value1 
   * @param {number} value2 
   */
   setFilter(fieldName, value1, value2) {
    this.sortField = fieldName;
    this.filterField = fieldName;
    this.filterValueStr = value1.toString();
    // @ts-ignore
    this.filterValue1 = Math.min(value1, value2);
    // @ts-ignore
    this.filterValue2 = Math.max(value1, value2);
    this.sortInvalidated = true;
  }

  setSort(fieldName, ascending = undefined) {
    console.log('set sort:', fieldName);
    if (this.sortField !== fieldName) {
      this.sortField = fieldName;
      this.sortInvalidated = true;
    } else {
      this.sortAscending = !this.sortAscending;
      this.sortInvalidated = true;
    }
    if (ascending !== undefined && this.sortAscending !== ascending) {
      this.sortAscending = ascending;
      this.sortInvalidated = true;
    }
  }

  setSortArray(sortArray) {
    this.sortArray = sortArray;
    this.sortInvalidated = false;
  }

  getSortArray() {
    if (this.sortInvalidated) {
      this.sortArray = [];
      if (this.sortField === '') {
        for (let ix = 0; ix < this.table.length; ix++) {
          this.sortArray.push(ix);
        }
      } else {
        let tempArray = [];
        for (let ix = 0; ix < this.table.length; ix++) {
          let val = this.table.element(ix)[this.sortField].$sortValue;
          if (this.filterField) {
            let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(this.filterField);
            let recInFiltered = true;
            if (this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
              if (this.table.element(ix)[this.filterField].$sortValue < this.filterValue1) {
                recInFiltered = false;
              }
              if (this.table.element(ix)[this.filterField].$sortValue > this.filterValue2) {
                recInFiltered = false;
              }
            } else {
              recInFiltered = this.table.element(ix)[this.filterField].$niceStr.toLocaleLowerCase()
                .indexOf(this.filterValueStr.toLocaleLowerCase()) >= 0;
            }

            if (recInFiltered) {
              tempArray.push({ ix, val });
            }
          }
          else {
            tempArray.push({ ix, val });
          }
        }


        let fieldIx = this.table.elementType.prototype._fieldNames.indexOf(this.sortField);
        if (fieldIx >= 0) {
          let sortMultiplier = this.sortAscending ? -1 : 1;
          if (this.table.elementType.prototype._fieldDefs[fieldIx].sortIsNumber) {
            tempArray = tempArray.sort((a, b) => (a.val - b.val) * sortMultiplier);
          } else {
            tempArray = tempArray.sort((a, b) => a.val.localeCompare(b.val) * sortMultiplier)
          }
          for (let ix = 0; ix < tempArray.length; ix++) {
            this.sortArray.push(tempArray[ix].ix)
          }
        }
      }
      this.sortInvalidated = false;
    }
    return this.sortArray;
  }
}