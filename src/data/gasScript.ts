export const GAS_CODE_GS = String.raw`/**
 * KSM POS JSON Database Backend v14
 *
 * Each data type has its OWN fast JSON sheet:
 *   Inventory, Sale, Repair, Purchase, Expense, Staff, Settings
 * Every sheet uses Column A = ID and Column B = Record (complete JSON object).
 *
 * Setup:
 * 1. Google Sheets -> Extensions -> Apps Script.
 * 2. Replace Code.gs with this file.
 * 3. Run setupDatabase() once.
 * 4. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 */

var DB_HEADERS = ['ID', 'Record'];
var ENTITY_SHEETS = {
  Inventory: 'Inventory',
  Sale: 'Sale',
  Repair: 'Repair',
  Purchase: 'Purchase',
  Expense: 'Expense',
  Staff: 'Staff',
  Setting: 'Settings'
};
var TERMINAL_REPAIR_STATUSES = ['Done', 'Delivered', 'Reject'];

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.method) {
      return jsonOutput_(dispatch_(e.parameter.method, safeJsonParse_(e.parameter.data || '{}', {})));
    }
    return HtmlService.createHtmlOutput('<h1>KSM POS JSON API is Active</h1><p>Separate JSON sheets: Inventory, Sale, Repair, Purchase, Expense, Staff, Settings</p>')
      .setTitle('KSM POS JSON API')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return jsonOutput_({ status: 'error', message: String(err) });
  }
}

function doPost(e) {
  try {
    var body = safeJsonParse_(e && e.postData ? e.postData.contents : '{}', {});
    return jsonOutput_(dispatch_(body.method, body.data || {}));
  } catch (err) {
    return jsonOutput_({ status: 'error', message: String(err) });
  }
}

function dispatch_(method, data) {
  var lock = LockService.getScriptLock();
  var writeMethods = ['saveInventory','addItem','deleteItem','saveRepair','updateRepairStatus','recordSale','recordMultipleSales','savePurchase','saveExpense','saveSettings','saveStaffMember','deleteStaffMember','setupDatabase','initializeSheets'];
  var needsLock = writeMethods.indexOf(method) !== -1;
  if (needsLock) lock.waitLock(30000);

  try {
    switch (method) {
      case 'ping':
      case 'testConnection':
        return { status: 'success', message: 'KSM POS separate-sheet JSON database connected.', sheets: ENTITY_SHEETS };

      case 'setupDatabase':
      case 'initializeSheets':
        return setupDatabase();

      case 'getInventoryData':
        return listEntity_('Inventory');
      case 'getRepairData':
        return listEntity_('Repair');
      case 'getExpensesData':
        return listEntity_('Expense');
      case 'getPurchaseData':
      case 'getPurchases':
      case 'getPurchasesData':
        return listEntity_('Purchase');
      case 'getSalesHistory':
        return flattenSales_(listEntity_('Sale'));
      case 'getStaffMembers':
        return listEntity_('Staff');
      case 'getSettings':
        return getSettingsObject_();

      case 'saveInventory':
      case 'addItem':
        return saveInventory_(data);
      case 'deleteItem':
        return deleteRecord_(String((data && data.id) || data || ''));

      case 'saveRepair':
        return saveRepair_(data);
      case 'updateRepairStatus':
        return updateRepairStatus_(data);

      case 'recordSale':
      case 'recordMultipleSales':
        return recordSale_(data);

      case 'savePurchase':
        return savePurchase_(data);
      case 'saveExpense':
        return saveExpense_(data);

      case 'getFinancialReport':
        return getFinancialReport_();
      case 'getExportData':
        return getExportData_(data);

      case 'verifyStaffPIN':
        return verifyStaffPIN_(data);
      case 'saveStaffMember':
        return saveStaff_(data);
      case 'deleteStaffMember':
        return deleteStaff_(data);
      case 'saveSettings':
        return saveSettings_(data);

      default:
        return { status: 'error', message: 'Unknown method: ' + method };
    }
  } catch (err) {
    return { status: 'error', message: String(err && err.message ? err.message : err) };
  } finally {
    if (needsLock) lock.releaseLock();
  }
}

function setupDatabase() {
  migrateLegacyDataToSeparateJsonSheets_();
  Object.keys(ENTITY_SHEETS).forEach(function(entity) { getEntitySheet_(entity); });

  if (listEntity_('Staff').length === 0) {
    appendRecord_('Staff-ADMIN', { entity: 'Staff', name: 'Admin', email: 'admin@ksm.local', pin: '1234', role: 'Admin', status: 'Active' });
    appendRecord_('Staff-STAFF', { entity: 'Staff', name: 'Staff', email: 'staff@ksm.local', pin: '1111', role: 'Staff', status: 'Active' });
  }
  if (listEntity_('Setting').length === 0) {
    appendRecord_('Setting-store_name', { entity: 'Setting', key: 'store_name', value: 'KSM POS' });
    appendRecord_('Setting-store_tagline', { entity: 'Setting', key: 'store_tagline', value: 'POS & SERVICES STUDIO' });
    appendRecord_('Setting-store_logo', { entity: 'Setting', key: 'store_logo', value: 'KSM' });
  }

  return { status: 'success', message: 'Separate JSON sheets are ready.', sheets: ENTITY_SHEETS };
}

function saveInventory_(data) {
  var id = String(data.id || data.productid || uniqueId_('PRD'));
  var existing = getRecordById_(id) || {};
  var record = merge_(existing, {
    entity: 'Inventory', id: id, productid: id,
    type: data.type || existing.type || 'Phone',
    brand: data.brand || existing.brand || '',
    model: data.model || existing.model || '',
    costprice: number_(data.costPrice !== undefined ? data.costPrice : data.costprice, existing.costprice || 0),
    sellingprice: number_(data.price !== undefined ? data.price : data.sellingprice, existing.sellingprice || 0),
    price: number_(data.price !== undefined ? data.price : data.sellingprice, existing.price || 0),
    stock: number_(data.stock, existing.stock || 0),
    status: data.status || existing.status || 'Active',
    imei: data.imei || existing.imei || '-',
    barcode: data.barcode || existing.barcode || '-',
    grade: data.grade || existing.grade || 'New',
    accessorytype: data.accessoryType || data.accessorytype || existing.accessorytype || '',
    specification: data.specification || existing.specification || '-',
    imageid: data.imageId || data.imageid || existing.imageid || '',
    updatedat: nowUS_()
  });
  upsertRecord_(id, record);
  return { status: 'success', id: id };
}

function saveRepair_(data) {
  var id = uniqueId_('REP');
  var start = formatUSDateTime_(data.startTime || new Date());
  var record = {
    entity: 'Repair', ticketid: id, id: id,
    customername: data.customerName || data.customername || 'Unknown',
    phone: data.phone || '-', device: data.device || '-', issue: data.issue || '-',
    imeisn: data.imei || data.imeisn || '-', initialcondition: data.condition || data.initialcondition || '-',
    status: 'Pending', fee: number_(data.fee, 0), total: number_(data.total || data.price, 0),
    createdat: start, starttime: start, finishtime: '', remark: data.remark || ''
  };
  appendRecord_(id, record);
  return { status: 'success', id: id };
}

function updateRepairStatus_(data) {
  var id = String(data.id || '');
  var record = getRecordById_(id);
  if (!record) throw new Error('Repair job not found: ' + id);
  record.status = data.status || record.status;
  if (TERMINAL_REPAIR_STATUSES.indexOf(record.status) !== -1) {
    record.finishtime = formatUSDateTime_(data.finishTime || new Date());
  } else {
    record.finishtime = '';
  }
  record.updatedat = nowUS_();
  upsertRecord_(id, record);
  return { status: 'success', id: id, finishTime: record.finishtime };
}

function recordSale_(data) {
  var id = uniqueId_('Sale');
  var voucherNo = 'V-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  var items = Array.isArray(data.items) ? data.items : [data];
  var timestamp = nowUS_();
  var normalizedItems = items.map(function(item) {
    var price = number_(item.price, 0);
    var cost = number_(item.costPrice !== undefined ? item.costPrice : item.costprice, 0);
    return {
      productId: item.productId || item.productid || 'WALK-IN', model: item.model || item.type || 'General',
      price: price, costPrice: cost, profit: price - cost,
      specification: item.specification || '-', imei: item.imei || '-', warranty: item.warranty || 'No Warranty',
      remark: item.remark || '', qty: number_(item.qty || item.quantity, 1)
    };
  });
  var total = normalizedItems.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);
  var profit = normalizedItems.reduce(function(sum, item) { return sum + item.profit * item.qty; }, 0);
  var sale = {
    entity: 'Sale', id: id, timestamp: timestamp, voucherno: voucherNo,
    customer: data.customer || 'Walk-in', phone: data.phone || '-', paymentmethod: data.paymentMethod || 'Cash',
    channel: data.channel || 'Walk-in', remark: data.remark || '', items: normalizedItems,
    total: total, profit: profit
  };
  appendRecord_(id, sale); // One sheet write for the complete voucher.
  decreaseInventoryStock_(normalizedItems);
  return { status: 'success', id: id, voucherNo: voucherNo };
}

function savePurchase_(data) {
  var id = uniqueId_('Purchase');
  var qty = number_(data.quantity, 0);
  var unitCost = number_(data.unitCost !== undefined ? data.unitCost : data.unitcost, 0);
  var total = qty * unitCost;
  var paid = number_(data.paidAmount !== undefined ? data.paidAmount : data.paid, 0);
  var record = {
    entity: 'Purchase', id: id, purchaseid: id, purchaseno: id,
    timestamp: nowUS_(), date: nowUS_(), invoiceno: data.invoiceNo || '',
    productid: data.productId || '', productname: data.productName || '', supplier: data.supplier || '',
    quantity: qty, unitcost: unitCost, total: total, paidamount: paid, paid: paid,
    balance: Math.max(0, total - paid), paymentmethod: data.paymentMethod || 'Cash',
    costmode: data.costMode || 'average', notedby: data.notedBy || 'Admin', remark: data.remark || ''
  };
  appendRecord_(id, record);
  increaseInventoryStock_(record.productid, qty, unitCost, record.costmode);
  return { status: 'success', id: id };
}

function saveExpense_(data) {
  var id = uniqueId_('Expense');
  appendRecord_(id, {
    entity: 'Expense', id: id, date: nowUS_(), description: data.description || '',
    category: data.category || 'General', amount: number_(data.amount, 0), notedby: data.notedBy || 'Admin'
  });
  return { status: 'success', id: id };
}

function flattenSales_(sales) {
  var rows = [];
  sales.forEach(function(sale) {
    (sale.items || []).forEach(function(item) {
      var qty = number_(item.qty, 1);
      for (var i = 0; i < qty; i++) {
        rows.push({
          timestamp: sale.timestamp, voucherno: sale.voucherno, productid: item.productId,
          type: item.model, price: number_(item.price, 0), customer: sale.customer, phone: sale.phone,
          imei: i === 0 ? item.imei : '-', warranty: item.warranty,
          paymentmethod: sale.paymentmethod, channel: sale.channel, specification: item.specification,
          remark: [item.remark, sale.remark].filter(Boolean).join(' | '),
          costprice: number_(item.costPrice, 0), profit: number_(item.profit, 0)
        });
      }
    });
  });
  return rows;
}

function getFinancialReport_() {
  var sales = listEntity_('Sale');
  var expenses = listEntity_('Expense');
  var salesTotal = sales.reduce(function(sum, row) { return sum + number_(row.total, 0); }, 0);
  var profitTotal = sales.reduce(function(sum, row) { return sum + number_(row.profit, 0); }, 0);
  var expenseTotal = expenses.reduce(function(sum, row) { return sum + number_(row.amount, 0); }, 0);
  return { sales: salesTotal, expenses: expenseTotal, profit: profitTotal - expenseTotal };
}

function saveSettings_(data) {
  Object.keys(data || {}).forEach(function(key) {
    upsertRecord_('Setting-' + key, { entity: 'Setting', key: key, value: data[key] });
  });
  return { status: 'success' };
}

function getSettingsObject_() {
  var result = {};
  listEntity_('Setting').forEach(function(row) { result[row.key] = row.value; });
  return result;
}

function saveStaff_(data) {
  var email = String(data.email || '').toLowerCase();
  var current = listEntity_('Staff').filter(function(row) { return String(row.email || '').toLowerCase() === email; })[0];
  var id = current ? current.id : uniqueId_('Staff');
  upsertRecord_(id, { entity: 'Staff', id: id, name: data.name || 'Staff', email: data.email || '', pin: data.pin || '1111', role: data.role || 'Staff', status: data.status || 'Active' });
  return { status: 'success', id: id };
}

function deleteStaff_(data) {
  var needle = String((data && (data.email || data.id)) || data || '').toLowerCase();
  listEntity_('Staff').forEach(function(row) {
    if (String(row.email || '').toLowerCase() === needle || String(row.id || '').toLowerCase() === needle || String(row.name || '').toLowerCase() === needle) deleteRecord_(row.id);
  });
  return { status: 'success' };
}

function verifyStaffPIN_(data) {
  var login = String((data && data.email) || '').toLowerCase().trim();
  var pin = String((data && data.pin) || '');
  var matched = null;
  listEntity_('Staff').forEach(function(member) {
    if (!matched && String(member.pin || '') === pin && (!login || String(member.name || '').toLowerCase() === login || String(member.email || '').toLowerCase() === login)) matched = member;
  });
  if (matched && String(matched.status || 'Active').toLowerCase() !== 'inactive') {
    return { status: 'success', user: { name: matched.name, email: matched.email, role: matched.role || 'Staff', status: matched.status || 'Active' } };
  }
  return { status: 'error', message: 'Invalid user name/email or PIN.' };
}

function getExportData_(data) {
  var name = (data && data.name) || 'All';
  if (name === 'All' || name === 'All Sheets (Full Archive)') return listAllRecords_();
  var entityMap = { Inventory: 'Inventory', Sales: 'Sale', Repairs: 'Repair', Expenses: 'Expense', Purchases: 'Purchase', Staff: 'Staff', Settings: 'Setting' };
  return listEntity_(entityMap[name] || name);
}

function decreaseInventoryStock_(items) {
  var grouped = {};
  items.forEach(function(item) {
    var id = String(item.productId || '');
    if (id && id !== 'WALK-IN') grouped[id] = (grouped[id] || 0) + number_(item.qty, 1);
  });
  Object.keys(grouped).forEach(function(id) {
    var item = getRecordById_(id);
    if (!item) return;
    item.stock = Math.max(0, number_(item.stock, 0) - grouped[id]);
    item.updatedat = nowUS_();
    upsertRecord_(id, item);
  });
}

function increaseInventoryStock_(id, qty, unitCost, mode) {
  var item = getRecordById_(String(id || ''));
  if (!item) return;
  var oldStock = number_(item.stock, 0);
  var oldCost = number_(item.costprice, 0);
  item.stock = oldStock + qty;
  if (mode === 'new') item.costprice = unitCost;
  else if (mode === 'average' && item.stock > 0) item.costprice = ((oldCost * oldStock) + (unitCost * qty)) / item.stock;
  item.updatedat = nowUS_();
  upsertRecord_(item.id, item);
}

// ---------- Separate JSON sheet helpers ----------
function sheetNameForEntity_(entity) {
  var name = ENTITY_SHEETS[entity];
  if (!name) throw new Error('Unknown entity: ' + entity);
  return name;
}

function styleJsonSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 2).setValues([DB_HEADERS]).setFontWeight('bold').setBackground('#1a237e').setFontColor('#ffffff');
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 850);
  sheet.getRange('A:B').setNumberFormat('@');
}

function getEntitySheet_(entity) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = sheetNameForEntity_(entity);
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1, 1, 2).getDisplayValues()[0].join('|') !== 'ID|Record') {
    if (sheet.getLastRow() > 0 && sheet.getDataRange().getDisplayValues().some(function(r){ return r.join('').trim() !== ''; })) {
      throw new Error('Sheet "' + name + '" is not JSON format. Run setupDatabase() to migrate it safely.');
    }
  }
  styleJsonSheet_(sheet);
  return sheet;
}

function entityFromId_(id) {
  id = String(id || '');
  if (/^(PRD|ITEM)-/i.test(id)) return 'Inventory';
  if (/^Sale-/i.test(id)) return 'Sale';
  if (/^REP-/i.test(id)) return 'Repair';
  if (/^Purchase-/i.test(id)) return 'Purchase';
  if (/^Expense-/i.test(id)) return 'Expense';
  if (/^Staff-/i.test(id)) return 'Staff';
  if (/^Setting-/i.test(id)) return 'Setting';
  return '';
}

function appendRecord_(id, record) {
  record = record || {};
  record.id = record.id || id;
  var entity = record.entity || entityFromId_(id);
  if (!entity) throw new Error('Cannot determine sheet for record: ' + id);
  getEntitySheet_(entity).appendRow([String(id), JSON.stringify(record)]);
}

function upsertRecord_(id, record) {
  record = record || {};
  record.id = record.id || id;
  var entity = record.entity || entityFromId_(id);
  if (!entity) throw new Error('Cannot determine sheet for record: ' + id);
  var sheet = getEntitySheet_(entity);
  var row = findRecordRowInSheet_(sheet, id);
  var values = [[String(id), JSON.stringify(record)]];
  if (row > 0) sheet.getRange(row, 1, 1, 2).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 2).setValues(values);
}

function deleteRecord_(id) {
  var located = locateRecord_(id);
  if (located) located.sheet.deleteRow(located.row);
  return { status: 'success', id: id };
}

function findRecordRowInSheet_(sheet, id) {
  if (!id || sheet.getLastRow() < 2) return -1;
  var found = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return found ? found.getRow() : -1;
}

function locateRecord_(id) {
  if (!id) return null;
  var preferred = entityFromId_(id);
  var entities = Object.keys(ENTITY_SHEETS);
  if (preferred) entities = [preferred].concat(entities.filter(function(e){ return e !== preferred; }));
  for (var i = 0; i < entities.length; i++) {
    var sheet = getEntitySheet_(entities[i]);
    var row = findRecordRowInSheet_(sheet, id);
    if (row > 0) return { entity: entities[i], sheet: sheet, row: row };
  }
  return null;
}

function getRecordById_(id) {
  var located = locateRecord_(id);
  if (!located) return null;
  return safeJsonParse_(located.sheet.getRange(located.row, 2).getDisplayValue(), null);
}

function listEntity_(entity) {
  var sheet = getEntitySheet_(entity);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues().map(function(row) {
    var record = safeJsonParse_(row[1], {});
    record.id = record.id || row[0];
    record.entity = record.entity || entity;
    return record;
  }).filter(function(record) { return record && Object.keys(record).length; });
}

function listAllRecords_() {
  var all = [];
  Object.keys(ENTITY_SHEETS).forEach(function(entity) { all = all.concat(listEntity_(entity)); });
  return all;
}

// Migrates old column-based sheets and the v13 KSM_Data mixed sheet.
// Existing source sheets are preserved with a _Legacy_ or _v13_Backup suffix.
function migrateLegacyDataToSeparateJsonSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Yangon', 'yyyyMMdd_HHmmss');

  // First migrate the v13 mixed JSON sheet, if present.
  var mixed = ss.getSheetByName('KSM_Data');
  var mixedRecords = [];
  if (mixed && mixed.getLastRow() >= 2) {
    mixedRecords = mixed.getRange(2, 1, mixed.getLastRow() - 1, 2).getDisplayValues().map(function(row) {
      var rec = safeJsonParse_(row[1], {}); rec.id = rec.id || row[0]; return rec;
    }).filter(function(rec){ return rec && rec.entity; });
    mixed.setName('KSM_Data_v13_Backup_' + stamp);
  }

  var sources = {
    Inventory: ['Inventory'],
    Sale: ['Sale', 'Sales'],
    Repair: ['Repair', 'Repairs'],
    Purchase: ['Purchase', 'Purchases'],
    Expense: ['Expense', 'Expenses'],
    Staff: ['Staff'],
    Setting: ['Settings', 'Setting']
  };
  var legacyByEntity = {};

  Object.keys(sources).forEach(function(entity) {
    legacyByEntity[entity] = [];
    sources[entity].forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (!sheet || sheet.getLastRow() === 0) return;
      var head = sheet.getRange(1, 1, 1, Math.min(2, sheet.getLastColumn())).getDisplayValues()[0];
      if (head[0] === 'ID' && head[1] === 'Record') return;
      legacyByEntity[entity] = legacyByEntity[entity].concat(legacyObjects_(sheet));
      sheet.setName(name + '_Legacy_' + stamp);
    });
  });

  // Create clean target sheets before writing records.
  Object.keys(ENTITY_SHEETS).forEach(function(entity) {
    var name = ENTITY_SHEETS[entity];
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    styleJsonSheet_(sheet);
  });

  mixedRecords.forEach(function(rec) { appendRecord_(rec.id || uniqueId_(rec.entity), rec); });

  Object.keys(legacyByEntity).forEach(function(entity) {
    var rows = legacyByEntity[entity];
    if (!rows.length) return;
    if (entity === 'Sale') {
      var groups = {};
      rows.forEach(function(row) {
        var voucher = row.voucherno || row.invoiceno || uniqueId_('V');
        if (!groups[voucher]) groups[voucher] = { entity:'Sale', id:uniqueId_('Sale'), timestamp:formatUSDateTime_(row.timestamp || row.date), voucherno:voucher, customer:row.customer || 'Walk-in', phone:row.phone || '-', paymentmethod:row.paymentmethod || 'Cash', channel:row.channel || 'Walk-in', remark:row.remark || '', items:[], total:0, profit:0 };
        var item = { productId:row.productid || 'WALK-IN', model:row.type || row.model || 'General', price:number_(row.price,0), costPrice:number_(row.costprice,0), profit:number_(row.profit,0), specification:row.specification || '-', imei:row.imei || '-', warranty:row.warranty || 'No Warranty', remark:row.remark || '', qty:number_(row.qty || row.quantity,1) };
        groups[voucher].items.push(item); groups[voucher].total += item.price * item.qty; groups[voucher].profit += item.profit * item.qty;
      });
      Object.keys(groups).forEach(function(v){ appendRecord_(groups[v].id, groups[v]); });
    } else {
      rows.forEach(function(obj) {
        var id = obj.id || obj.productid || obj.ticketid || obj.purchaseid || uniqueId_(entity);
        obj.entity = entity; obj.id = id; appendRecord_(id, obj);
      });
    }
  });
}

function legacyObjects_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0].map(key_);
  return values.slice(1).filter(function(row) { return row.join('').trim() !== ''; }).map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    ['costprice','sellingprice','price','stock','fee','total','quantity','qty','unitcost','paid','paidamount','balance','amount','profit'].forEach(function(k) { if (obj[k] !== undefined && obj[k] !== '') obj[k] = number_(obj[k], 0); });
    ['timestamp','createdat','starttime','finishtime','date'].forEach(function(k) { if (obj[k]) obj[k] = formatUSDateTime_(obj[k]); });
    return obj;
  });
}

// ---------- Common helpers ----------
function jsonOutput_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function safeJsonParse_(text, fallback) { try { return JSON.parse(text); } catch (e) { return fallback; } }
function uniqueId_(prefix) { return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); }
function number_(value, fallback) { var n = Number(value); return isNaN(n) ? Number(fallback || 0) : n; }
function merge_(a, b) { var out = {}; Object.keys(a || {}).forEach(function(k){out[k]=a[k];}); Object.keys(b || {}).forEach(function(k){out[k]=b[k];}); return out; }
function key_(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function toEnglishDigits_(value) { var map={'၀':'0','၁':'1','၂':'2','၃':'3','၄':'4','၅':'5','၆':'6','၇':'7','၈':'8','၉':'9'}; return String(value === null || value === undefined ? '' : value).replace(/[၀-၉]/g,function(d){return map[d]||d;}); }
function parseFlexibleDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (value === null || value === undefined || value === '') return null;
  var original=String(value), raw=toEnglishDigits_(original).trim();
  var m=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if(m){var first=+m[1],second=+m[2],year=+m[3],hour=+(m[4]||0),minute=+(m[5]||0),sec=+(m[6]||0),ampm=String(m[7]||'').toUpperCase();var month=/[၀-၉]/.test(original)?second:first,day=/[၀-၉]/.test(original)?first:second;if(first>12){day=first;month=second;}if(second>12){month=first;day=second;}if(ampm==='PM'&&hour<12)hour+=12;if(ampm==='AM'&&hour===12)hour=0;var d=new Date(year,month-1,day,hour,minute,sec);return isNaN(d.getTime())?null:d;}
  var fallback=new Date(raw); return isNaN(fallback.getTime())?null:fallback;
}
function formatUSDateTime_(value) { var d=parseFlexibleDate_(value)||new Date(); return Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Yangon', 'MM/dd/yyyy hh:mm:ss a'); }
function nowUS_() { return formatUSDateTime_(new Date()); }
`;


export const GAS_INDEX_HTML = String.raw`<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>KSM POS Studio Web API</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #0f172a;
        color: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        text-align: center;
      }
      .card {
        background: #1e293b;
        padding: 2.5rem;
        border-radius: 1rem;
        border: 1px solid #334155;
        max-width: 480px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      }
      .badge {
        background: #22c55e;
        color: #052e16;
        font-weight: bold;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        text-transform: uppercase;
        display: inline-block;
        margin-bottom: 1rem;
      }
      h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">API Active</div>
      <h1>KSM POS Google Apps Script API</h1>
      <p>This Web App serves as the Google Sheets backend database for KSM POS & Mobile Repair Studio.</p>
    </div>
  </body>
</html>
`;
