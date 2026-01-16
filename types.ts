
export interface QuoteStep {
  id?: string;
  title: string;
  description: string;
  suggestedPrice: number;
  suggestedUnit?: string;
  userPrice: number;
  quantity: number;
  taxRate: number;
  discountValue?: number;
  discountType?: 'percent' | 'fixed';
}

export type Currency = 'BRL' | 'EUR' | 'USD';

export type PaymentMethodType = 'a_vista' | '50_50' | '50_30_20';

export interface PaymentInstallment {
  label: string;
  amount: number;
  dueDate: string;
}

export interface PromoVoucherData {
  id: string;
  code: string;
  date: string;
  clientName: string;
  offerTitle: string;
  discountDescription: string;
  conditions: string;
  expiryDate: string;
}

export interface DiscountVoucherData {
  id: string;
  code: string;
  date: string;
  clientName: string;
  baseValue: number;
  discountValue: number;
  type: 'percentage' | 'fixed';
  taxRate: number;
  currency: Currency;
  reason: string;
  expiryDate: string;
  finalValue: number;
  taxAmount: number;
}

export interface QuoteData {
  id: string;
  code?: string;
  date: string;
  title: string;
  summary: string;
  steps: QuoteStep[];
  currency: Currency;
  city: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  executionTime?: string; 
  paymentTerms?: string;
  paymentMethodType?: PaymentMethodType;
  observations?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  customTotal?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
}

export interface UserSettings {
  companyName: string;
  companySlogan?: string;
  companyAddress: string;
  companyTaxId: string;
  companyLogo: string;
  savedLogos?: {
    hidroClean?: string;
    gilmarRocha?: string;
  };
}

export interface ReportSection {
  id?: string;
  title: string;
  content: string;
}

export interface PhotoAnalysis {
  photoIndex: number;
  legend: string;
  description: string;
}

export interface TechnicalReportData {
  id?: string;
  code?: string;
  relatedQuoteCode?: string;
  title: string;
  clientInfo: {
    name: string;
    nif?: string;
    address: string;
    contact?: string;
    date: string;
    technician: string;
    interestedParty?: string;
    buildingType: string;
  };
  objective: string;
  methodology: string[];
  development: ReportSection[];
  photoAnalysis: PhotoAnalysis[];
  images?: string[];
  conclusion: {
    diagnosis: string;
    technicalProof: string;
    consequences: string;
    activeLeak: boolean;
  };
  recommendations: {
    repairType: string;
    materials: string[];
    estimatedTime: string;
    notes: string;
  };
}

export interface WarrantyData {
  id?: string;
  code?: string;
  clientName: string;
  clientNif?: string;
  clientAddress: string;
  serviceDescription: string;
  startDate: string;
  warrantyPeriod: string;
  terms: string[];
  exclusions: string;
}

export interface ReceiptData {
  id: string;
  code: string;
  date: string;
  clientName: string;
  clientNif?: string;
  amount: number;
  currency: Currency;
  description: string;
  paymentMethod: string;
}
