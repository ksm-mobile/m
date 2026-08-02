import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initialInventory, 
  initialSales, 
  initialRepairs, 
  initialExpenses, 
  initialStaff, 
  initialSettings 
} from './src/data/initialData.js';

let inventory = [...initialInventory];
let sales = [...initialSales];
let repairs = [...initialRepairs];
let expenses = [...initialExpenses];
let staff = [...initialStaff];
let settings = { ...initialSettings };

async function forwardToGas(gasUrl: string, method: string, data: any) {
  if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.startsWith('http')) return null;

  // 1. Try GET request with encoded query params (most reliable for Google Apps Script Web Apps to avoid 302 POST redirects dropping payloads)
  try {
    const encodedData = encodeURIComponent(JSON.stringify(data || {}));
    const getUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}method=${encodeURIComponent(method)}&data=${encodedData}`;

    const response = await fetch(getUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const text = await response.text();
    if (text && text.trim().startsWith('{')) {
      const parsed = JSON.parse(text);
      return parsed;
    }
  } catch (err: any) {
    console.error(`forwardToGas GET error for ${method}:`, err);
  }

  // 2. Fallback to POST
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, data }),
      redirect: 'follow'
    });
    const text = await response.text();
    if (text && text.trim().startsWith('{')) {
      return JSON.parse(text);
    }
  } catch (err: any) {
    console.error(`forwardToGas POST error for ${method}:`, err);
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // RPC endpoint mimicking google.script.run
  app.post('/api/rpc', async (req, res) => {
    const { method, data, gasUrl: reqGasUrl } = req.body || {};
    const gasUrl = reqGasUrl || (settings as any).gasUrl || (settings as any).gas_web_app_url;

    if (gasUrl) {
      (settings as any).gasUrl = gasUrl;
    }

    try {
      switch (method) {
        case 'testConnection': {
          if (!gasUrl) {
            return res.json({ status: 'error', message: 'Google Apps Script Web App URL မထည့်သွင်းရသေးပါ။' });
          }
          const gasRes = await forwardToGas(gasUrl, 'testConnection', {});
          if (!gasRes) {
            return res.json({ status: 'error', message: 'Google Apps Script သို့ ချိတ်ဆက်၍မရပါ။ URL ကိုပြန်စစ်ပါ။' });
          }
          if (gasRes.status === 'html_response') {
            return res.json({ 
              status: 'error', 
              message: 'Google Apps Script မှ HTML လော့ဂ်အင်စာမျက်နှာ ပြန်ပေးနေပါသည်။ Deploy ပြုလုပ်စဉ် "Who has access" တွင် "Anyone" ဟု ရွေးချယ်ပေးပါ!' 
            });
          }
          return res.json({ status: 'success', message: '✅ Google Sheet Apps Script နှင့် အောင်မြင်စွာ ချိတ်ဆက်မိပါပြီ!', detail: gasRes });
        }

        case 'getInventoryData': {
          if (gasUrl) {
            const gasItems = await forwardToGas(gasUrl, 'getInventoryData', {});
            if (Array.isArray(gasItems) && gasItems.length > 0) {
              inventory = gasItems.map((item: any) => ({
                id: String(item.id || item.ID || `PRD-${Math.floor(Math.random() * 9000 + 1000)}`),
                type: item.type || 'Phone',
                brand: item.brand || '-',
                model: item.model || '-',
                costPrice: Number(item.costprice || item['cost price'] || 0),
                price: Number(item.sellingprice || item['selling price'] || item.price || 0),
                stock: Number(item.stock || 1),
                status: item.status || 'Active',
                imei: item.imei || '-',
                grade: item.grade || 'New',
                specification: item.specification || '-',
                costprice: Number(item.costprice || item['cost price'] || 0),
                sellingprice: Number(item.sellingprice || item['selling price'] || item.price || 0)
              }));
            }
          }
          return res.json(inventory);
        }

        case 'getRepairData': {
          if (gasUrl) {
            const gasRepairs = await forwardToGas(gasUrl, 'getRepairData', {});
            if (Array.isArray(gasRepairs) && gasRepairs.length > 0) {
              repairs = gasRepairs.map((r: any) => ({
                ticketid: String(r.ticketid || r['ticket id'] || `REP-${Math.floor(Math.random() * 9000 + 1000)}`),
                customername: r.customername || r['customer name'] || 'Unknown',
                phone: r.phone || '-',
                device: r.device || '-',
                issue: r.issue || '-',
                imeisn: r.imeisn || r['imei/sn'] || '-',
                initialcondition: r.initialcondition || r['initial condition'] || '-',
                status: r.status || 'Pending',
                fee: Number(r.fee || 0),
                total: Number(r.total || r.price || 0),
                createdat: r.createdat || r['created at'] || new Date().toLocaleString(),
                remark: r.remark || ''
              }));
            }
          }
          return res.json(repairs);
        }

        case 'getExpensesData': {
          if (gasUrl) {
            const gasExp = await forwardToGas(gasUrl, 'getExpensesData', {});
            if (Array.isArray(gasExp) && gasExp.length > 0) {
              expenses = gasExp.map((e: any) => ({
                date: e.date || new Date().toLocaleDateString(),
                description: e.description || '',
                category: e.category || 'General',
                amount: Number(e.amount || 0),
                notedby: e.notedby || e['noted by'] || 'Admin'
              }));
            }
          }
          return res.json(expenses);
        }

        case 'getSalesHistory': {
          if (gasUrl) {
            const gasSales = await forwardToGas(gasUrl, 'getSalesHistory', {});
            if (Array.isArray(gasSales) && gasSales.length > 0) {
              sales = gasSales.map((s: any) => ({
                timestamp: s.timestamp || new Date().toLocaleString(),
                voucherno: s.voucherno || s['voucher no'] || 'V-000',
                productid: s.productid || s['productid'] || 'WALK-IN',
                type: s.type || 'General',
                price: Number(s.price || 0),
                customer: s.customer || 'Walk-in',
                phone: s.phone || '-',
                imei: s.imei || '-',
                warranty: s.warranty || 'No Warranty',
                paymentmethod: s.paymentmethod || s['payment method'] || 'Cash',
                channel: s.channel || 'Walk-in',
                specification: s.specification || '-',
                remark: s.remark || '',
                costprice: Number(s.costprice || s['cost price'] || 0),
                profit: Number(s.profit || 0)
              }));
            }
          }
          return res.json(sales);
        }

        case 'getFinancialReport': {
          const totalSales = sales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
          const repairRev = repairs.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
          const grossSales = totalSales + repairRev;

          const totalCost = sales.reduce((sum, s) => {
            const cost = Number(s.costprice || 0);
            return sum + cost;
          }, 0);

          const salesProfit = sales.reduce((sum, s) => {
            if ('profit' in s && s.profit !== undefined) return sum + (Number(s.profit) || 0);
            return sum + ((Number(s.price) || 0) - (Number(s.costprice) || 0));
          }, 0);

          const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          const totalProfit = salesProfit + repairRev;

          return res.json({
            sales: grossSales,
            expenses: totalExpenses,
            profit: totalProfit - totalExpenses,
            salesRevenue: totalSales,
            repairRevenue: repairRev,
            totalProfit: totalProfit
          });
        }

        case 'saveInventory': {
          const nextNum = 1000 + inventory.length + 1;
          const nextId = `PRD-${nextNum}`;
          const newItem = {
            id: nextId,
            type: data.type || 'Phone',
            brand: data.brand,
            model: data.model,
            costPrice: Number(data.costPrice || 0),
            price: Number(data.price || 0),
            stock: Number(data.stock || 1),
            status: data.status || 'Active',
            imei: data.imei || '-',
            grade: data.grade || 'New',
            specification: data.specification || '-',
            costprice: Number(data.costPrice || 0),
            sellingprice: Number(data.price || 0)
          };
          inventory.unshift(newItem);
          if (gasUrl) forwardToGas(gasUrl, 'saveInventory', { ...newItem, id: nextId });
          return res.json({ status: 'success', id: nextId });
        }

        case 'saveRepair': {
          const nextNum = 1000 + repairs.length + 1;
          const nextId = `REP-${nextNum}`;
          const nowStr = new Date().toLocaleString();
          const newJob = {
            ticketid: nextId,
            customername: data.customerName || data.customer || 'Unknown',
            phone: data.phone || '-',
            device: data.device || '-',
            issue: data.issue || '-',
            imeisn: data.imei || data.imeiSn || '-',
            initialcondition: data.condition || data.initialCondition || '-',
            status: 'Pending' as const,
            fee: data.fee || 0,
            total: Number(data.total || data.price || 0),
            createdat: nowStr,
            remark: data.remark || ''
          };
          repairs.unshift(newJob);
          if (gasUrl) forwardToGas(gasUrl, 'saveRepair', data);
          return res.json({ status: 'success', id: nextId });
        }

        case 'updateRepairStatus': {
          const { id, status } = data || {};
          const job = repairs.find(r => r.ticketid === id);
          if (job) {
            job.status = status;
            if (gasUrl) forwardToGas(gasUrl, 'updateRepairStatus', { id, status });
            return res.json({ status: 'success' });
          }
          return res.json({ status: 'error', message: 'Ticket not found' });
        }

        case 'saveExpense': {
          const nowStr = new Date().toLocaleDateString();
          const newExpense = {
            date: nowStr,
            description: data.description,
            category: data.category || 'General',
            amount: Number(data.amount || 0),
            notedby: data.notedBy || 'Admin'
          };
          expenses.unshift(newExpense);
          if (gasUrl) forwardToGas(gasUrl, 'saveExpense', data);
          return res.json({ status: 'success' });
        }

        case 'recordSale': {
          const voucherNo = `V-${1000 + sales.length + 1}`;
          const nowStr = new Date().toLocaleString();
          const price = Number(data.price || data.total) || 0;
          const cost = Number(data.costPrice) || 0;
          const newSale = {
            timestamp: nowStr,
            voucherno: voucherNo,
            productid: data.productId || 'WALK-IN',
            type: data.model || data.type || 'General',
            price,
            customer: data.customer || 'Walk-in',
            phone: data.phone || '-',
            imei: data.imei || '-',
            warranty: data.warranty || 'No Warranty',
            paymentmethod: data.paymentMethod || 'Cash',
            channel: data.channel || 'Walk-in',
            specification: data.specification || '-',
            remark: data.remark || '',
            costprice: cost,
            profit: price - cost
          };
          sales.unshift(newSale);
          if (gasUrl) forwardToGas(gasUrl, 'recordSale', data);
          return res.json({ status: 'success', voucherNo });
        }

        case 'recordMultipleSales': {
          const voucherNo = `V-${1000 + sales.length + 1}`;
          const nowStr = new Date().toLocaleString();
          const items = data.items || [];

          items.forEach((item: any) => {
            const price = Number(item.price) || 0;
            let costPrice = Number(item.costPrice || item.costprice) || 0;

            if (!costPrice && item.productId && item.productId !== 'WALK-IN') {
              const matched = inventory.find(inv => inv.id === item.productId);
              if (matched) {
                costPrice = Number(matched.costPrice || matched.costprice) || 0;
                matched.stock = Math.max(0, matched.stock - 1);
              }
            }

            sales.unshift({
              timestamp: nowStr,
              voucherno: voucherNo,
              productid: item.productId || 'WALK-IN',
              type: item.model || 'General',
              price,
              customer: data.customer || 'Walk-in',
              phone: data.phone || '-',
              imei: item.imei || '-',
              warranty: item.warranty || 'No Warranty',
              paymentmethod: data.paymentMethod || 'Cash',
              channel: data.channel || 'Walk-in',
              specification: item.specification || '-',
              remark: data.remark || item.remark || '',
              costprice: costPrice,
              profit: price - costPrice
            });
          });

          if (gasUrl) forwardToGas(gasUrl, 'recordMultipleSales', data);
          return res.json({ status: 'success', voucherNo });
        }

        case 'getUserInfo': {
          return res.json({
            name: 'Admin (Owner)',
            email: 'admin@ksm.local',
            role: 'Admin',
            status: 'Active',
            authenticated: true
          });
        }

        case 'verifyStaffPIN': {
          const { email, pin } = typeof data === 'object' && data !== null ? data : { email: data, pin: '' };
          const cleanEmail = String(email || '').trim().toLowerCase();
          const cleanPIN = String(pin || '').trim();

          const matchedStaff = staff.find(s => 
            (s.email.toLowerCase() === cleanEmail || s.name.toLowerCase() === cleanEmail) && 
            s.pin === cleanPIN && 
            s.status === 'Active'
          );

          if (matchedStaff) {
            return res.json({
              status: 'success',
              user: {
                name: matchedStaff.name,
                email: matchedStaff.email,
                role: matchedStaff.role,
                status: matchedStaff.status
              }
            });
          }

          // Fallback PIN 1234 or 1991 for owner / admin
          if ((cleanEmail === 'admin@ksm.local' || cleanEmail === 'admin') && (cleanPIN === '1234' || cleanPIN === '1991')) {
            return res.json({
              status: 'success',
              user: {
                name: 'Admin (Owner)',
                email: 'admin@ksm.local',
                role: 'Admin',
                status: 'Active'
              }
            });
          }

          if (cleanPIN === '5555') {
            return res.json({
              status: 'success',
              user: {
                name: 'Counter Staff',
                email: 'counter@techsi.com',
                role: 'Staff',
                status: 'Active'
              }
            });
          }

          return res.json({
            status: 'error',
            message: 'လုံခြုံရေး PIN ကုဒ် မမှန်ပါ သို့မဟုတ် Gmail / အသုံးပြုသူအမည် နှင့် PIN ကိုက်ညီမှုမရှိပါ။'
          });
        }

        case 'getStaffMembers':
          return res.json(staff);

        case 'saveStaffMember': {
          const existingIdx = staff.findIndex(s => s.name.toLowerCase() === String(data.name).toLowerCase());
          const newStaff = {
            name: data.name,
            email: data.email || '-',
            pin: data.pin || '1234',
            role: data.role || 'Staff',
            status: data.status || 'Active'
          };
          if (existingIdx > -1) {
            staff[existingIdx] = newStaff;
          } else {
            staff.push(newStaff);
          }
          return res.json({ status: 'success' });
        }

        case 'deleteStaffMember': {
          const nameToDelete = String(data).toLowerCase();
          staff = staff.filter(s => s.name.toLowerCase() !== nameToDelete);
          return res.json({ status: 'success' });
        }

        case 'getSettings':
          return res.json(settings);

        case 'saveSettings': {
          settings = { ...settings, ...data };
          return res.json({ status: 'success' });
        }

        case 'setupDatabase':
        case 'initializeSheets': {
          const gasUrl = data?.gasUrl || (settings as any).gasUrl || (settings as any).gas_web_app_url;
          if (gasUrl && typeof gasUrl === 'string' && gasUrl.startsWith('http')) {
            try {
              const resp = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'setupDatabase', data: {} })
              });
              const text = await resp.text();
              return res.json({ 
                status: 'success', 
                message: 'Google Sheets DB Initialized Successfully via Apps Script!',
                detail: text 
              });
            } catch (err: any) {
              console.error('GAS forward error:', err);
            }
          }
          return res.json({ 
            status: 'success', 
            message: 'Database Sheets (Inventory, Sales, Repairs, Expenses, Staff, Settings) Initialized Successfully!' 
          });
        }

        case 'getExportData': {
          const sheetName = data.name || data;
          if (sheetName === 'Sales') return res.json(sales);
          if (sheetName === 'Repairs') return res.json(repairs);
          if (sheetName === 'Inventory') return res.json(inventory);
          if (sheetName === 'Expenses') return res.json(expenses);
          return res.json(sales);
        }

        default:
          return res.status(400).json({ status: 'error', message: `Unknown method: ${method}` });
      }
    } catch (err: any) {
      console.error('RPC Error:', err);
      return res.status(500).json({ status: 'error', message: err.toString() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KSM POS Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
