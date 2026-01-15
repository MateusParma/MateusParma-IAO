
export interface QuoteStep {
  id?: string;
  title: string;
  description: string;
  suggestedPrice: number;
  suggestedUnit?: string;
  userPrice: number;
  quantity: number;
  taxRate: number;
}

export type Currency = 'BRL' | 'EUR' | 'USD';

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
  observations?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  customTotal?: number;
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
