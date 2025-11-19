
export interface QuoteStep {
  title: string;
  description: string;
  suggestedPrice: number; // Unit price
  suggestedUnit?: string;
  userPrice: number; // User-defined unit price
  quantity: number;
  taxRate: number;
}

export type Currency = 'BRL' | 'EUR' | 'USD';

export interface QuoteData {
  id: string;
  date: string;
  title: string;
  summary: string;
  steps: QuoteStep[];
  currency: Currency;
  city: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  executionTime?: string; // Novo campo
  paymentTerms?: string;  // Novo campo
}

export interface UserSettings {
  companyName: string;
  companyAddress: string;
  companyTaxId: string;
  companyLogo: string; // Base64 string
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface PhotoAnalysis {
  photoIndex: number;
  description: string;
  legend: string;
}

export interface TechnicalReportData {
  title: string;
  clientInfo: {
    name: string;
    address: string;
    date: string;
    technician: string;
    buildingType: string;
  };
  objective: string;
  methodology: string[];
  development: ReportSection[];
  photoAnalysis: PhotoAnalysis[];
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
