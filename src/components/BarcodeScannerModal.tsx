import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, LoaderCircle, ScanLine, X } from 'lucide-react';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
  title?: string;
}

type Html5Scanner = {
  render: (
    success: (decodedText: string, decodedResult: unknown) => void,
    failure?: (errorMessage: string, error: unknown) => void,
  ) => void;
  clear: () => Promise<void>;
};

type ScannerConstructor = new (
  elementId: string,
  config: Record<string, unknown>,
  verbose?: boolean,
) => Html5Scanner;

declare global {
  interface Window {
    Html5QrcodeScanner?: ScannerConstructor;
  }
}

const SCRIPT_ID = 'ksm-html5-qrcode';
const SCRIPT_URLS = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
];

let scannerScriptPromise: Promise<void> | null = null;

function loadScannerLibrary(): Promise<void> {
  if (window.Html5QrcodeScanner) return Promise.resolve();
  if (scannerScriptPromise) return scannerScriptPromise;

  scannerScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('SCANNER_LIBRARY_FAILED')), { once: true });
      return;
    }

    const tryUrl = (index: number) => {
      if (index >= SCRIPT_URLS.length) {
        reject(new Error('SCANNER_LIBRARY_FAILED'));
        return;
      }
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URLS[index];
      script.async = true;
      script.onload = () => window.Html5QrcodeScanner ? resolve() : tryUrl(index + 1);
      script.onerror = () => {
        script.remove();
        tryUrl(index + 1);
      };
      document.head.appendChild(script);
    };

    tryUrl(0);
  }).catch(error => {
    scannerScriptPromise = null;
    throw error;
  });

  return scannerScriptPromise;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  open,
  onClose,
  onDetected,
  title = 'Scan Barcode / IMEI',
}) => {
  const scannerRef = useRef<Html5Scanner | null>(null);
  const detectedRef = useRef(false);
  const sessionRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);

  const [manual, setManual] = useState('');
  const [status, setStatus] = useState('Preparing scanner…');
  const [loading, setLoading] = useState(false);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  const clearScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try { await scanner.clear(); } catch (_) { /* already stopped */ }
    }
    const reader = document.getElementById('ksm-barcode-reader');
    if (reader) reader.innerHTML = '';
  };

  const finish = (rawValue: string) => {
    // IMPORTANT: deliver the scanned value before stopping html5-qrcode.
    // On some Android phones scanner.clear() can take a long time or never
    // resolve after a successful read. The old await prevented POS from ever
    // receiving the barcode, so the item was not added to CART.
    const value = String(rawValue || '').trim();
    if (!value || detectedRef.current) return;

    detectedRef.current = true;
    navigator.vibrate?.(100);

    // Send to POS and close immediately. Camera cleanup runs in background.
    onDetectedRef.current(value);
    onCloseRef.current();
    void clearScanner();
  };

  useEffect(() => {
    if (!open) return;

    const session = ++sessionRef.current;
    detectedRef.current = false;
    setManual('');
    setLoading(true);
    setStatus('Preparing camera scanner…');

    const initialise = async () => {
      try {
        if (!window.isSecureContext && location.hostname !== 'localhost') {
          throw new Error('HTTPS_REQUIRED');
        }

        await loadScannerLibrary();
        if (session !== sessionRef.current || !open) return;

        await clearScanner();
        const Scanner = window.Html5QrcodeScanner;
        if (!Scanner) throw new Error('SCANNER_LIBRARY_FAILED');

        const scanner = new Scanner(
          'ksm-barcode-reader',
          {
            fps: 20,
            qrbox: { width: 300, height: 120 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            useBarCodeDetectorIfSupported: true,
            supportedScanTypes: [0, 1],
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
              advanced: [{ focusMode: 'continuous' }],
            },
          },
          false,
        );

        scannerRef.current = scanner;
        scanner.render(
          decodedText => { finish(decodedText); },
          () => { /* Normal: no barcode found in this frame. */ },
        );
        setStatus('Tap “Request Camera Permissions”, choose the back camera, then hold the barcode inside the box.');
      } catch (error) {
        const text = String((error as Error)?.message || error || '');
        if (text.includes('HTTPS_REQUIRED')) {
          setStatus('Camera requires HTTPS. Open your GitHub Pages https:// link, not an HTML file from Downloads.');
        } else {
          setStatus('Scanner could not load. Check your internet connection, reload the page, and allow Camera permission in Chrome.');
        }
      } finally {
        if (session === sessionRef.current) setLoading(false);
      }
    };

    // Wait one frame so the reader div exists before html5-qrcode renders into it.
    const timer = window.setTimeout(() => { void initialise(); }, 50);
    return () => {
      window.clearTimeout(timer);
      sessionRef.current += 1;
      void clearScanner();
    };
  }, [open]);

  const close = async () => {
    sessionRef.current += 1;
    await clearScanner();
    onCloseRef.current();
  };

  const submitManual = (event: React.FormEvent) => {
    event.preventDefault();
    finish(manual);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[100dvh] overflow-y-auto">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <ScanLine className="text-blue-600 shrink-0" />
            <h3 className="font-black text-slate-800 dark:text-white truncate">{title}</h3>
          </div>
          <button type="button" onClick={() => void close()} className="p-2 text-slate-400 hover:text-slate-700" aria-label="Close scanner"><X size={22} /></button>
        </div>

        <div className="p-3 sm:p-5 space-y-4">
          <div className="ksm-scanner-shell relative min-h-[300px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700">
            <div id="ksm-barcode-reader" className="w-full min-h-[300px] text-white" />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white">
                <LoaderCircle size={34} className="animate-spin text-blue-500" />
                <span className="text-sm font-bold">Loading scanner…</span>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{status}</p>

          <form onSubmit={submitManual} className="flex flex-col sm:flex-row gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
            <div className="flex-1 relative">
              <Keyboard size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                value={manual}
                onChange={event => setManual(event.target.value)}
                inputMode="text"
                autoComplete="off"
                autoFocus={false}
                placeholder="USB/Bluetooth scanner or type code"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
              />
            </div>
            <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-black">USE CODE</button>
          </form>
        </div>
      </div>
    </div>
  );
};
