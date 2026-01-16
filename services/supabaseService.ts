
import type { QuoteData, TechnicalReportData, WarrantyData, UserSettings, ReceiptData, DiscountVoucherData, PromoVoucherData } from '../types';

// --- VOUCHERS PROMOCIONAIS ---
export const fetchPromoVouchers = async (): Promise<PromoVoucherData[]> => {
  try {
    const data = localStorage.getItem('savedPromoVouchers');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const savePromoVoucherToDb = async (voucher: PromoVoucherData) => {
  try {
    const vouchers = await fetchPromoVouchers();
    const index = vouchers.findIndex(v => v.id === voucher.id);
    if (index >= 0) {
      vouchers[index] = voucher;
    } else {
      vouchers.unshift(voucher);
    }
    localStorage.setItem('savedPromoVouchers', JSON.stringify(vouchers));
  } catch (e) {}
};

export const deletePromoVoucherFromDb = async (id: string) => {
  try {
    const vouchers = await fetchPromoVouchers();
    localStorage.setItem('savedPromoVouchers', JSON.stringify(vouchers.filter(v => v.id !== id)));
  } catch (e) {}
};

// --- RECIBOS ---

export const fetchReceipts = async (): Promise<ReceiptData[]> => {
  try {
    const data = localStorage.getItem('savedReceipts');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveReceiptToDb = async (receipt: ReceiptData) => {
  try {
    const receipts = await fetchReceipts();
    const index = receipts.findIndex(r => r.id === receipt.id);
    if (index >= 0) {
      receipts[index] = receipt;
    } else {
      receipts.unshift(receipt);
    }
    localStorage.setItem('savedReceipts', JSON.stringify(receipts));
  } catch (e) {
    console.error("Erro ao salvar recibo localmente:", e);
  }
};

export const deleteReceiptFromDb = async (id: string) => {
  try {
    const receipts = await fetchReceipts();
    const newReceipts = receipts.filter(r => r.id !== id);
    localStorage.setItem('savedReceipts', JSON.stringify(newReceipts));
  } catch (e) {
    console.error("Erro ao deletar recibo localmente:", e);
  }
};

// --- VALES DESCONTO ---

export const fetchVouchers = async (): Promise<DiscountVoucherData[]> => {
  try {
    const data = localStorage.getItem('savedVouchers');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveVoucherToDb = async (voucher: DiscountVoucherData) => {
  try {
    const vouchers = await fetchVouchers();
    const index = vouchers.findIndex(v => v.id === voucher.id);
    if (index >= 0) {
      vouchers[index] = voucher;
    } else {
      vouchers.unshift(voucher);
    }
    localStorage.setItem('savedVouchers', JSON.stringify(vouchers));
  } catch (e) {}
};

export const deleteVoucherFromDb = async (id: string) => {
  try {
    const vouchers = await fetchVouchers();
    localStorage.setItem('savedVouchers', JSON.stringify(vouchers.filter(v => v.id !== id)));
  } catch (e) {}
};

// --- ORÇAMENTOS ---
export const fetchQuotes = async (): Promise<QuoteData[]> => {
  try {
    const data = localStorage.getItem('savedQuotes');
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveQuoteToDb = async (quote: QuoteData) => {
  try {
    const quotes = await fetchQuotes();
    const index = quotes.findIndex(q => q.id === quote.id);
    if (index >= 0) quotes[index] = quote; else quotes.unshift(quote);
    localStorage.setItem('savedQuotes', JSON.stringify(quotes));
  } catch (e) {}
};

export const deleteQuoteFromDb = async (id: string) => {
  try {
    const quotes = await fetchQuotes();
    localStorage.setItem('savedQuotes', JSON.stringify(quotes.filter(q => q.id !== id)));
  } catch (e) {}
};

// --- LAUDOS ---
export const fetchReports = async (): Promise<TechnicalReportData[]> => {
  try {
    const data = localStorage.getItem('savedReports');
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveReportToDb = async (report: TechnicalReportData) => {
  try {
    const reports = await fetchReports();
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) reports[index] = report; else reports.unshift(report);
    localStorage.setItem('savedReports', JSON.stringify(reports));
  } catch (e) {}
};

export const deleteReportFromDb = async (id: string) => {
  try {
    const reports = await fetchReports();
    localStorage.setItem('savedReports', JSON.stringify(reports.filter(r => r.id !== id)));
  } catch (e) {}
};

// --- GARANTIAS ---
export const fetchWarranties = async (): Promise<WarrantyData[]> => {
  try {
    const data = localStorage.getItem('savedWarranties');
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveWarrantyToDb = async (warranty: WarrantyData) => {
  try {
    const warranties = await fetchWarranties();
    const index = warranties.findIndex(w => w.id === warranty.id);
    if (index >= 0) warranties[index] = warranty; else warranties.unshift(warranty);
    localStorage.setItem('savedWarranties', JSON.stringify(warranties));
  } catch (e) {}
};

export const deleteWarrantyFromDb = async (id: string) => {
  try {
    const warranties = await fetchWarranties();
    localStorage.setItem('savedWarranties', JSON.stringify(warranties.filter(w => w.id !== id)));
  } catch (e) {}
};

// --- CONFIGURAÇÕES ---
export const fetchSettings = async (): Promise<UserSettings | null> => {
  try {
    const data = localStorage.getItem('userSettings');
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const saveSettingsToDb = async (settings: UserSettings) => {
  try { localStorage.setItem('userSettings', JSON.stringify(settings)); } catch (e) {}
};
