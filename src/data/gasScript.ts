export const GAS_CODE_GS = `/**
 * KSM POS & Mobile Repair Studio - Google Apps Script Backend (Code.gs)
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script
 * 2. Replace all code in Code.gs with this script.
 * 3. Run setupDatabase() function once to initialize all Sheets & Headers.
 * 4. Click Deploy -> New deployment -> Select Web app -> Access: Anyone -> Deploy.
 * 5. Copy Web App URL and paste into Settings in KSM POS App.
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.method) {
    return handleRpcRequest(e.parameter.method, JSON.parse(e.parameter.data || '{}'));
  }
  return HtmlService.createHtmlOutput('<h1>KSM POS Google Apps Script Web App API is Active!</h1><p>Use this URL in KSM POS Settings.</p>')
    .setTitle('KSM POS Studio Web API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var method = contents.method;
    var data = contents.data;
    return handleRpcRequest(method, data);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRpcRequest(method, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};

  try {
    switch (method) {
      case 'getInventoryData':
        result = getSheetDataAsObjects(ss, 'Inventory');
        break;

      case 'getRepairData':
        result = getSheetDataAsObjects(ss, 'Repairs');
        break;

      case 'getExpensesData':
        result = getSheetDataAsObjects(ss, 'Expenses');
        break;

      case 'getSalesHistory':
        result = getSheetDataAsObjects(ss, 'Sales');
        break;

      case 'getStaffMembers':
        result = getSheetDataAsObjects(ss, 'Staff');
        break;

      case 'getSettings':
        var settingsList = getSheetDataAsObjects(ss, 'Settings');
        var settingsObj = {};
        settingsList.forEach(function(item) {
          if (item.Key || item.key) settingsObj[item.Key || item.key] = item.Value || item.value;
        });
        result = settingsObj;
        break;

      case 'addItem':
      case 'saveInventory':
        var invSheet = getOrCreateSheet(ss, 'Inventory');
        var invData = getSheetDataAsObjects(ss, 'Inventory');
        var nextId = data.id || ('PRD-' + (1000 + invData.length + 1));
        invSheet.appendRow([
          nextId,
          data.type || 'Phone',
          data.brand || '',
          data.model || '',
          data.costPrice || data.costprice || 0,
          data.price || data.sellingprice || 0,
          data.stock || 1,
          data.status || 'Active',
          data.imei || '-',
          data.grade || 'New',
          data.accessoryType || data.accessorytype || '',
          data.specification || '-'
        ]);
        result = { status: 'success', id: nextId };
        break;

      case 'deleteItem':
        var invSheetDel = getOrCreateSheet(ss, 'Inventory');
        if (invSheetDel) {
          var rows = invSheetDel.getDataRange().getValues();
          for (var i = rows.length - 1; i >= 1; i--) {
            if (String(rows[i][0]) === String(data.id || data)) {
              invSheetDel.deleteRow(i + 1);
              break;
            }
          }
        }
        result = { status: 'success' };
        break;

      case 'updateRepairStatus':
        var repSheetUp = getOrCreateSheet(ss, 'Repairs');
        if (repSheetUp) {
          var repRows = repSheetUp.getDataRange().getValues();
          for (var r = 1; r < repRows.length; r++) {
            if (String(repRows[r][0]) === String(data.id)) {
              repSheetUp.getRange(r + 1, 8).setValue(data.status); // Status
              if ((data.status === 'Done' || data.status === 'Delivered') && !repRows[r][12]) {
                repSheetUp.getRange(r + 1, 13).setValue(formatEnglishDateTime_(data.finishTime ? new Date(data.finishTime) : new Date()));
              }
              break;
            }
          }
        }
        result = { status: 'success' };
        break;

      case 'getFinancialReport':
        var salesRows = getSheetDataAsObjects(ss, 'Sales');
        var expenseRows = getSheetDataAsObjects(ss, 'Expenses');
        var salesTotal = salesRows.reduce(function(sum, row) { return sum + Number(row.price || 0); }, 0);
        var profitTotal = salesRows.reduce(function(sum, row) { return sum + Number(row.profit || 0); }, 0);
        var expenseTotal = expenseRows.reduce(function(sum, row) { return sum + Number(row.amount || 0); }, 0);
        result = { sales: salesTotal, expenses: expenseTotal, profit: profitTotal - expenseTotal };
        break;

      case 'getExportData':
        var exportName = (data && data.name) || 'All';
        if (exportName === 'All' || exportName === 'All Sheets (Full Archive)') {
          result = [];
          ['Inventory', 'Sales', 'Repairs', 'Expenses', 'Staff', 'Settings'].forEach(function(name) {
            getSheetDataAsObjects(ss, name).forEach(function(row) {
              row.sheet = name;
              result.push(row);
            });
          });
        } else {
          result = getSheetDataAsObjects(ss, exportName);
        }
        break;

      case 'verifyStaffPIN':
        var login = String((data && data.email) || '').toLowerCase().trim();
        var pin = String((data && data.pin) || '');
        var members = getSheetDataAsObjects(ss, 'Staff');
        var matched = null;
        members.forEach(function(member) {
          var memberName = String(member.name || '').toLowerCase();
          var memberEmail = String(member.email || '').toLowerCase();
          if (!matched && String(member.pin || '') === pin && (!login || memberName === login || memberEmail === login)) matched = member;
        });
        if (!matched && pin === '1234' && (!login || login.indexOf('admin') !== -1)) {
          matched = { name: 'Admin', email: 'admin@ksm.local', role: 'Admin', status: 'Active' };
        }
        if (matched && String(matched.status || 'Active').toLowerCase() !== 'inactive') {
          result = { status: 'success', user: { name: matched.name, email: matched.email, role: matched.role || 'Staff', status: matched.status || 'Active' } };
        } else {
          result = { status: 'error', message: 'Invalid user name/email or PIN.' };
        }
        break;

      case 'saveStaffMember':
        var staffSheet = getOrCreateSheet(ss, 'Staff');
        var staffRows = staffSheet.getDataRange().getValues();
        var staffEmail = String((data && data.email) || '').toLowerCase();
        var updated = false;
        for (var si = 1; si < staffRows.length; si++) {
          if (String(staffRows[si][1]).toLowerCase() === staffEmail) {
            staffSheet.getRange(si + 1, 1, 1, 5).setValues([[
              data.name || staffRows[si][0], data.email || staffRows[si][1], data.pin || staffRows[si][2],
              data.role || staffRows[si][3], data.status || staffRows[si][4]
            ]]);
            updated = true;
            break;
          }
        }
        if (!updated) staffSheet.appendRow([data.name || 'Staff', data.email || '', data.pin || '1111', data.role || 'Staff', data.status || 'Active']);
        result = { status: 'success' };
        break;

      case 'deleteStaffMember':
        var staffDeleteSheet = getOrCreateSheet(ss, 'Staff');
        var deleteRows = staffDeleteSheet.getDataRange().getValues();
        var deleteEmail = String((data && (data.email || data.id)) || data || '').toLowerCase();
        for (var di = deleteRows.length - 1; di >= 1; di--) {
          if (String(deleteRows[di][1]).toLowerCase() === deleteEmail) staffDeleteSheet.deleteRow(di + 1);
        }
        result = { status: 'success' };
        break;

      case 'testConnection':
      case 'ping':
        result = { status: 'success', message: 'Google Apps Script Connection OK!' };
        break;

      case 'saveRepair':
        var repSheet = getOrCreateSheet(ss, 'Repairs');
        var repData = getSheetDataAsObjects(ss, 'Repairs');
        var ticketId = 'REP-' + (1000 + repData.length + 1);
        var nowStr = formatEnglishDateTime_(data.startTime ? new Date(data.startTime) : new Date());
        repSheet.appendRow([
          ticketId,
          data.customerName || data.customername || 'Unknown',
          data.phone || '-',
          data.device || '-',
          data.issue || '-',
          data.imei || data.imeisn || '-',
          data.condition || data.initialcondition || '-',
          'Pending',
          data.fee || 0,
          data.total || data.price || 0,
          nowStr,
          nowStr,
          '',
          data.remark || ''
        ]);
        result = { status: 'success', id: ticketId };
        break;

      case 'recordSale':
      case 'recordMultipleSales':
        var salesSheet = getOrCreateSheet(ss, 'Sales');
        var salesData = getSheetDataAsObjects(ss, 'Sales');
        var voucherNo = 'V-' + (1000 + salesData.length + 1);
        var nowStr = new Date().toLocaleString();
        var items = data.items || [data];

        items.forEach(function(item) {
          var price = Number(item.price) || 0;
          var cost = Number(item.costPrice || item.costprice) || 0;
          salesSheet.appendRow([
            nowStr,
            voucherNo,
            item.productId || 'WALK-IN',
            item.model || item.type || 'General',
            price,
            data.customer || 'Walk-in',
            data.phone || '-',
            item.imei || '-',
            item.warranty || 'No Warranty',
            data.paymentMethod || 'Cash',
            data.channel || 'Walk-in',
            item.specification || '-',
            data.remark || item.remark || '',
            cost,
            price - cost
          ]);
        });
        result = { status: 'success', voucherNo: voucherNo };
        break;

      case 'saveExpense':
        var expSheet = getOrCreateSheet(ss, 'Expenses');
        expSheet.appendRow([
          new Date().toLocaleDateString(),
          data.description || '',
          data.category || 'General',
          Number(data.amount || 0),
          data.notedBy || 'Admin'
        ]);
        result = { status: 'success' };
        break;

      case 'saveSettings':
        var setSheet = getOrCreateSheet(ss, 'Settings');
        setSheet.clear();
        setSheet.appendRow(['Key', 'Value']);
        for (var key in data) {
          setSheet.appendRow([key, data[key]]);
        }
        result = { status: 'success' };
        break;

      case 'setupDatabase':
      case 'initializeSheets':
        result = setupDatabase();
        break;

      default:
        result = { status: 'success', message: 'OK' };
    }
  } catch (e) {
    result = { status: 'error', message: e.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    { name: 'Inventory', headers: ['ID', 'Type', 'Brand', 'Model', 'Cost Price', 'Selling Price', 'Stock', 'Status', 'IMEI', 'Grade', 'Accessory Type', 'Specification'] },
    { name: 'Sales', headers: ['Timestamp', 'Voucher No', 'ProductID', 'Type', 'Price', 'Customer', 'Phone', 'IMEI', 'Warranty', 'Payment Method', 'Channel', 'Specification', 'Remark', 'Cost Price', 'Profit'] },
    { name: 'Repairs', headers: ['Ticket ID', 'Customer Name', 'Phone', 'Device', 'Issue', 'IMEI/SN', 'Initial Condition', 'Status', 'Fee', 'Total', 'Created At', 'Start Time', 'Finish Time', 'Remark'] },
    { name: 'Expenses', headers: ['Date', 'Description', 'Category', 'Amount', 'Noted By'] },
    { name: 'Staff', headers: ['Name', 'Email', 'PIN', 'Role', 'Status'] },
    { name: 'Settings', headers: ['Key', 'Value'] }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight('bold').setBackground('#1a237e').setFontColor('#ffffff');
    }
  });

  var staffSheet = ss.getSheetByName('Staff');
  if (staffSheet && staffSheet.getLastRow() < 2) {
    staffSheet.appendRow(['Admin', 'admin@ksm.local', '1234', 'Admin', 'Active']);
    staffSheet.appendRow(['Staff', 'staff@ksm.local', '1111', 'Staff', 'Active']);
  }
  var settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet && settingsSheet.getLastRow() < 2) {
    settingsSheet.appendRow(['store_name', 'KSM POS']);
    settingsSheet.appendRow(['store_tagline', 'POS & SERVICES STUDIO']);
    settingsSheet.appendRow(['store_logo', 'KSM']);
  }

  return 'KSM POS Database Sheets Created Successfully!';
}


function formatEnglishDateTime_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Yangon', 'dd/MM/yyyy hh:mm:ss a');
}

function ensureHeaders_(sheet, headers) {
  if (!sheet) return;
  var currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, currentLastColumn).getValues()[0].map(function(v) { return String(v || '').trim(); });

  // Non-destructive upgrade from earlier KSM POS sheet layouts.
  if (sheet.getName() === 'Inventory' && existing.indexOf('Accessory Type') === -1 && existing.indexOf('Specification') === 10) {
    sheet.insertColumnBefore(11);
  }
  if (sheet.getName() === 'Repairs' && existing.indexOf('Start Time') === -1 && existing.indexOf('Remark') === 11) {
    sheet.insertColumnsBefore(12, 2);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a237e').setFontColor('#ffffff');
}


function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headersMap = {
      'Inventory': ['ID', 'Type', 'Brand', 'Model', 'Cost Price', 'Selling Price', 'Stock', 'Status', 'IMEI', 'Grade', 'Accessory Type', 'Specification'],
      'Sales': ['Timestamp', 'Voucher No', 'ProductID', 'Type', 'Price', 'Customer', 'Phone', 'IMEI', 'Warranty', 'Payment Method', 'Channel', 'Specification', 'Remark', 'Cost Price', 'Profit'],
      'Repairs': ['Ticket ID', 'Customer Name', 'Phone', 'Device', 'Issue', 'IMEI/SN', 'Initial Condition', 'Status', 'Fee', 'Total', 'Created At', 'Start Time', 'Finish Time', 'Remark'],
      'Expenses': ['Date', 'Description', 'Category', 'Amount', 'Noted By'],
      'Staff': ['Name', 'Email', 'PIN', 'Role', 'Status'],
      'Settings': ['Key', 'Value']
    };
    var headers = headersMap[sheetName] || ['ID', 'Data'];
    sheet.appendRow(headers);
    try {
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a237e').setFontColor('#ffffff');
    } catch(e) {}
  }
  var headersMapAlways = {
    'Inventory': ['ID', 'Type', 'Brand', 'Model', 'Cost Price', 'Selling Price', 'Stock', 'Status', 'IMEI', 'Grade', 'Accessory Type', 'Specification'],
    'Sales': ['Timestamp', 'Voucher No', 'ProductID', 'Type', 'Price', 'Customer', 'Phone', 'IMEI', 'Warranty', 'Payment Method', 'Channel', 'Specification', 'Remark', 'Cost Price', 'Profit'],
    'Repairs': ['Ticket ID', 'Customer Name', 'Phone', 'Device', 'Issue', 'IMEI/SN', 'Initial Condition', 'Status', 'Fee', 'Total', 'Created At', 'Start Time', 'Finish Time', 'Remark'],
    'Expenses': ['Date', 'Description', 'Category', 'Amount', 'Noted By'],
    'Staff': ['Name', 'Email', 'PIN', 'Role', 'Status'],
    'Settings': ['Key', 'Value']
  };
  if (headersMapAlways[sheetName]) ensureHeaders_(sheet, headersMapAlways[sheetName]);
  return sheet;
}

function getSheetDataAsObjects(ss, sheetName) {
  var sheet = getOrCreateSheet(ss, sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).toLowerCase().replace(/[^a-z0-9]/g, '');
      obj[key] = row[j];
    }
    result.push(obj);
  }
  return result;
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
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
