const GAS_URL_KEY = 'ksm_gas_url';
const LEGACY_GAS_URL_KEY = 'googleAppsScriptUrl';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbz20HmtnoldMvzn7z4C2U2gZl4isWLkk9vsLQmCLB0Mtmp-UwDmWMc-MyDueTALAfo-sg/exec';

export function getGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) || localStorage.getItem(LEGACY_GAS_URL_KEY) || DEFAULT_GAS_URL;
}

export function saveGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_KEY, url.trim());
  localStorage.removeItem(LEGACY_GAS_URL_KEY);
}

export async function callRpc(method: string, data: unknown = {}): Promise<any> {
  const gasUrl = getGasUrl();
  if (!gasUrl) {
    if (method === 'verifyStaffPIN') {
      const payload = data as { email?: string; pin?: string };
      const name = (payload.email || '').trim().toLowerCase();
      if ((payload.pin === '1234' && (!name || name.includes('admin'))) || payload.pin === '1111') {
        return {
          status: 'success',
          user: payload.pin === '1234'
            ? { name: 'Admin', email: 'admin@ksm.local', role: 'Admin', status: 'Active' }
            : { name: 'Staff', email: 'staff@ksm.local', role: 'Staff', status: 'Active' }
        };
      }
      return { status: 'error', message: 'Invalid PIN. Connect Google Sheets or use the default Admin PIN 1234.' };
    }
    if (method.startsWith('get')) return method === 'getFinancialReport' ? { sales: 0, expenses: 0, profit: 0 } : [];
    throw new Error('Google Apps Script Web App URL is not connected. Open Settings and paste your Web App URL.');
  }

  let response: Response;
  // Images are too large for a query-string GET request, so upload them by POST.
  if (method === 'uploadProductImage') {
    response = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ method, data: data || {} })
    });
  } else {
    const url = new URL(gasUrl);
    url.searchParams.set('method', method);
    url.searchParams.set('data', JSON.stringify(data || {}));
    url.searchParams.set('_', Date.now().toString());
    response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Google Apps Script returned an invalid response. Deploy it as a Web App with access set to Anyone.');
  }
}
