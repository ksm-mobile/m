import { formatUSDateTime } from '../utils/dateTime';
import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { ReceiptData } from '../types';
import { BrandLogo } from './BrandLogo';

interface ReceiptModalProps {
  currentReceipt: ReceiptData;
  setShowReceiptModal: (show: boolean) => void;
  storeName: string;
  storeTagline: string;
  storeLogo: string;
  storeFooter: string;
  storePaperSize: '80mm' | 'A5' | 'A4';
  handlePrint: () => void;
  refreshAll: () => void;
  lang: string;
  t: (key: string) => string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  currentReceipt,
  setShowReceiptModal,
  storeName,
  storeTagline,
  storeLogo,
  storeFooter,
  storePaperSize,
  handlePrint,
  refreshAll,
  lang,
  t,
}) => {
  const [receiptPaperSize, setReceiptPaperSize] = useState<'80mm' | 'A5' | 'A4'>(storePaperSize || '80mm');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 lg:p-8 border border-slate-200 dark:border-slate-800">
        {/* Receipt Header */}
        <div className="text-center space-y-1 mb-6">
          <BrandLogo customLogo={storeLogo} className="w-28 h-16 rounded-xl bg-white p-1.5 mx-auto shadow-md ring-1 ring-slate-200" />
          <h4 className="text-base font-black text-slate-800 dark:text-white pt-2 tracking-tight uppercase">
            {currentReceipt.type}
          </h4>
          <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase whitespace-pre-line leading-relaxed">
            {storeTagline}
          </p>
        </div>

        {/* Receipt Body */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            <span>Ref: {currentReceipt.id}</span>
            <span>{formatUSDateTime(currentReceipt.date)}</span>
          </div>

          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase">
            <div>{t('customer')}: {currentReceipt.customer} {currentReceipt.phone ? `(${currentReceipt.phone})` : ''}</div>
            {currentReceipt.channel && <div className="text-[9px] text-blue-500 mt-0.5">Via: {currentReceipt.channel}</div>}
          </div>

          <div className="space-y-3 font-sans">
            {currentReceipt.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-slate-800 dark:text-slate-300 text-xs">
                <div className="flex-1 pr-4">
                  <div className="font-extrabold uppercase">{item.model}</div>
                  {item.specification && item.specification !== '-' && <div className="text-[9px] text-slate-400 italic mt-0.5">{item.specification}</div>}
                  {item.imei && item.imei !== '-' && <div className="text-[9px] text-slate-400 font-mono font-bold uppercase mt-0.5">IMEI: {item.imei}</div>}
                  {item.warranty && <div className="text-[9px] text-blue-500 font-bold uppercase">Warranty: {item.warranty}</div>}
                  {item.issue && <div className="text-[9px] text-slate-500 italic mt-0.5">Issue: {item.issue}</div>}
                  {item.remark && <div className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase mt-0.5">Discount: {item.remark}</div>}
                </div>
                <div className="font-black text-sm shrink-0">{(item.price || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('total')} MMK</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{(currentReceipt.total || 0).toLocaleString()}</span>
            </div>

            <div className="mt-2 space-y-1.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between font-bold text-slate-500 dark:text-slate-300">
                <span>Payment</span><span>{currentReceipt.paymentMethod || '-'}</span>
              </div>
              {currentReceipt.paymentMethod === 'Cash' && (
                <>
                  <div className="flex justify-between font-bold text-slate-600 dark:text-slate-200">
                    <span>Cash received</span><span>{Number(currentReceipt.cashReceived || 0).toLocaleString()} MMK</span>
                  </div>
                  <div className="flex justify-between font-black text-blue-600 dark:text-blue-400 text-sm border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5">
                    <span>Change</span><span>{Number(currentReceipt.changeAmount || 0).toLocaleString()} MMK</span>
                  </div>
                </>
              )}
            </div>

            {currentReceipt.remark && (
              <div className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-2 font-mono">
                <strong>Note:</strong> {currentReceipt.remark}
              </div>
            )}

            {storeFooter && (
              <div className="text-center mt-4 text-[9px] text-slate-400 font-bold tracking-wide whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {storeFooter}
              </div>
            )}
          </div>
        </div>

        {/* Paper Size Selector */}
        <div className="mb-5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('receiptSize')}</span>
          <div className="flex bg-slate-200/60 dark:bg-slate-700 p-1 rounded-xl">
            {(['80mm', 'A5', 'A4'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setReceiptPaperSize(sz)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                  receiptPaperSize === sz ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="space-y-2">
          <button 
            onClick={() => {
              handlePrint();
              refreshAll();
            }}
            className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer size={16} />
            <span>{t('print')} {t('receipt')}</span>
          </button>

          <button 
            onClick={() => {
              setShowReceiptModal(false);
              refreshAll();
            }}
            className="w-full py-3 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
