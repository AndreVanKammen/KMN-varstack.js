// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import TableBuilder from './table-builder.js';
import { Types } from '../varstack.js';
import { ArrayTableVar, TableVar } from '../structures/table.js';
import { BaseVar } from '../vars/base.js';

const tableViewCache = {};

/** 
 * @param {BaseVar} baseVar
 * @return {TableBuilder} 
 */
function getTableView(dropDown, baseVar, lookupTableName, showFieldName) {
  /** @type {ArrayTableVar} */
  let tableVar;
  // 
  if (lookupTableName.indexOf('.') !== -1) {
    tableVar = baseVar.$parent.$findVar(lookupTableName);
  } else {
    let p = baseVar.$parent;
    let foundInParent = p
    while (p) {
      foundInParent = p;
      p = p.$parent;
    }
    tableVar = baseVar.$getMain()[lookupTableName];

  }
  // TODO cache tables, we don't want to make one for every field in a main table
  let tableViewKey = tableVar.$hash + '_' + showFieldName;
  let tableBuilder = tableViewCache[tableViewKey];
  if (!tableBuilder) {
    tableBuilder = new TableBuilder(dropDown, tableVar, {
      fieldNames: [showFieldName],
      skipHeader: true
    });
    tableViewCache[tableViewKey] = tableBuilder;
  }
  return tableBuilder;
}

// TODO: clean this up in a class
function createLookupHandler(baseVar, element) {
  let lookupTableName = '';
  let showFieldName = '';
  let lookupFieldName = '';
  let fieldTolookup = '';

  if (baseVar.$varDefinition.ref) {
    lookupTableName = baseVar.$varDefinition.ref;
    let ix = lookupTableName.lastIndexOf('.');
    if (ix !== -1) {
      showFieldName = lookupTableName.substr(ix + 1);
      lookupTableName = lookupTableName.substr(0, ix);
    }
    for (const fieldDef of baseVar.$parent.$fieldDefs) {
      if (fieldDef.lookup && fieldDef.lookup.startsWith(lookupTableName)) {
        lookupFieldName = fieldDef.name;
        fieldTolookup = fieldDef.lookup.substr(ix + 1);
        // console.log('lookupField: ',fieldDef.lookup.substr(ix + 1), 'in ',lookupSeek,' by ',fieldDef.name, ' show ',lookupField);
        break;
      }
    }
  } else if (baseVar.$varDefinition.lookup) {
    lookupTableName = baseVar.$varDefinition.lookup;
    let ix = lookupTableName.lastIndexOf('.');
    if (ix !== -1) {
      showFieldName = lookupTableName.substr(ix + 1);
      lookupTableName = lookupTableName.substr(0, ix);
    }
    lookupFieldName = baseVar.$varDefinition.name;
    fieldTolookup = showFieldName;
  }
  if (lookupFieldName !== null && lookupTableName !== '' && showFieldName !== '') {
    element.parentElement.classList.add('showoverflow');
    let dropDown = element.parentElement.$el({ cls: 'comboDropdown' });
    // dropDown.innerText = 'TEST';
    // dropDown.contentEditable = 'true';
    dropDown.tabIndex = 1;

    dropDown.$setVisible(false);

    element.onfocus = () => {
      console.log('focus');

      if (!dropDown.$isVisible()) {
        let tableView = getTableView(dropDown, baseVar, lookupTableName, showFieldName);
        dropDown.$setVisible(true);
        dropDown.appendChild(tableView.tableEl);
        tableView.tableEl.onfocus = null;
        tableView.tableEl.focus();
        tableView.tableEl.onfocus = element.onfocus;
        tableView.tableEl.onblur = element.onblur;
        tableView.onRowClick = (rec) => {
          baseVar.$parent[lookupFieldName].$v = rec[fieldTolookup].$v;
          dropDown.$setVisible(false);
        };
        // tableView.updateTable();
        let ix = tableView.table.findIx(fieldTolookup, baseVar.$parent[lookupFieldName].$v);
        if (ix !== -1) {
          tableView.selectRow(null, ix);
        }
      }
    }

    element.onblur = () => {
      // Rescedule because the browser set's it to body before setting it to the newly focussed element
      setTimeout(() => {
        if (!element.parentElement.contains(document.activeElement)) {
          dropDown.$setVisible(false);
        }
      }, 0);
    }

    // TODO: clean-up code for this event (need to do a lot of clean-up but don't have trouble with it yet.
    // Always hide if browser looses focus
    window.addEventListener('blur', () => {
      dropDown.$setVisible(false);
    });
  }
}

export default createLookupHandler;