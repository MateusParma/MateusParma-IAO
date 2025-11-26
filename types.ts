
export interface QuoteStep {
  id?: string; // Novo: ID para controle de lista (React Keys)
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
  code?: string; // Novo: Código sequencial (ex: ORC-001)
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
  observations?: string; // Novo: Campo de observações gerais
  status?: 'pending' | 'accepted' | 'rejected'; // Novo: Status do orçamento
  customTotal?: number; // Novo: Permite sobrescrever o valor total calculado
}

export interface UserSettings {
  companyName: string;
  companySlogan?: string; // Novo: Slogan da empresa
  companyAddress: string;
  companyTaxId: string;
  companyLogo: string; // Base64 string (Logo Ativa)
  savedLogos?: {
    hidroClean?: string; // Logo salva para perfil PT
    gilmarRocha?: string; // Logo salva para perfil BR
  };
}

export interface ReportSection {
  id?: string; // Novo: ID para controle de lista
  title: string;
  content: string;
}

export interface PhotoAnalysis {
  photoIndex: number;
  legend: string;
  description: string;
}

export interface TechnicalReportData {
  id?: string; // Novo: ID único
  code?: string; // Novo: Código sequencial (ex: REL-001)
  relatedQuoteCode?: string; // Novo: Código do orçamento original se houver
  title: string;
  clientInfo: {
    name: string;
    nif?: string;
    address: string;
    contact?: string; // Novo: Contato do cliente no laudo
    date: string;
    technician: string;
    interestedParty?: string;
    buildingType: string;
  };
  objective: string;
  methodology: string[];
  development: ReportSection[];
  photoAnalysis: PhotoAnalysis[];
  images?: string[]; // Novo: Persistência de imagens em Base64
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
  warrantyPeriod: string; // "12 meses" ou "30 dias"
  terms: string[]; // Lista de cláusulas
  exclusions: string;
}
