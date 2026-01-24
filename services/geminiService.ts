
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { QuoteData, QuoteStep, Currency, TechnicalReportData, PhotoAnalysis, ReportSection, WarrantyData, ReceiptData, ReportType } from '../types';

const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}
  return undefined;
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
}

async function runWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  if (!apiKey) {
    throw new Error("A chave de API (API_KEY) não foi configurada.");
  }
  try {
    return await operation();
  } catch (error: any) {
    const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
    const isOverloaded = errorMessage.includes('overloaded') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE');
    if (isOverloaded && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

const extractJson = (text: string): string => {
    let jsonText = (text || "").trim();
    const jsonMatch = jsonText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[2]) return jsonMatch[2];
    const firstBrace = jsonText.indexOf('{');
    const firstBracket = jsonText.indexOf('[');
    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    const lastBrace = jsonText.lastIndexOf('}');
    const lastBracket = jsonText.lastIndexOf(']');
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;
    if (start !== -1 && end !== -1) return jsonText.substring(start, end + 1);
    return jsonText;
};

export async function generateQuote(description: string, city: string, images: File[], currency: Currency, clientName: string, includeDescriptions: boolean): Promise<Omit<QuoteData, 'id' | 'date' | 'clientName' | 'clientAddress' | 'clientContact'>> {
    const model = 'gemini-3-flash-preview';
    const textPart = {
        text: `Cliente: ${clientName}, Descrição: ${description}, Cidade: ${city}, Moeda: ${currency}. Gere um orçamento.`,
    };
    const imageParts = await Promise.all(images.map(fileToGenerativePart));
    const systemInstruction = `Você é um assistente especialista em orçamentos. Retorne APENAS JSON.
{
  "title": "Título",
  "summary": "Resumo",
  "executionTime": "Prazo",
  "paymentTerms": "Pagamento",
  "steps": [{ "title": "Etapa", "description": "${includeDescriptions ? 'Descrição' : ''}", "suggestedQuantity": 1, "suggestedPrice": 0 }]
}`;
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [textPart, ...imageParts] },
        config: { systemInstruction, tools: [{ googleSearch: {} }] },
    }));
    const parsedJson = JSON.parse(extractJson(response.text || ""));
    const stepsWithUserPrice: QuoteStep[] = parsedJson.steps.map((step: any) => ({
        id: `step-${Date.now()}-${Math.random()}`,
        title: step.title,
        description: step.description || "",
        suggestedPrice: Number(step.suggestedPrice?.unitPrice ?? step.suggestedPrice ?? 0),
        suggestedUnit: step.suggestedPrice?.unit || 'un',
        quantity: Number(step.suggestedQuantity ?? 1),
        userPrice: Number(step.suggestedPrice?.unitPrice ?? step.suggestedPrice ?? 0),
        taxRate: 23,
    }));
    return { title: parsedJson.title, summary: parsedJson.summary, executionTime: parsedJson.executionTime, paymentTerms: parsedJson.paymentTerms, steps: stepsWithUserPrice, currency, city, observations: "" };
}

export async function generateSingleQuoteStep(itemDescription: string, city: string, currency: Currency): Promise<QuoteStep> {
    const model = 'gemini-3-flash-preview';
    const prompt = `Crie uma etapa de orçamento para: "${itemDescription}". Cidade: ${city}, Moeda: ${currency}. Retorne JSON.`;
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: { tools: [{ googleSearch: {} }] },
    }));
    const parsed = JSON.parse(extractJson(response.text || ""));
    return {
        id: `step-${Date.now()}-${Math.random()}`,
        title: parsed.title,
        description: parsed.description,
        suggestedPrice: Number(parsed.suggestedPrice?.unitPrice || parsed.suggestedPrice || 0),
        suggestedUnit: parsed.suggestedPrice?.unit || 'un',
        quantity: Number(parsed.suggestedQuantity || 1),
        userPrice: Number(parsed.suggestedPrice?.unitPrice || parsed.suggestedPrice || 0),
        taxRate: 23
    };
}

export async function generateDirectTechnicalReport(d: string, e: string, im: File[], cn: string, ca: string, ni: string, co: string, ip: string, te: string, comp: string, type: ReportType = 'peritagem'): Promise<TechnicalReportData> {
    const model = 'gemini-3-flash-preview';
    const parts: any[] = [{ text: `RELATÓRIO TÉCNICO DE ${type.toUpperCase()}. Cliente: ${cn}, Morada: ${ca}. Contexto: ${d}. Equipamentos: ${e}. Perito: ${te}.` }];
    if (im.length > 0) parts.push(...await Promise.all(im.map(fileToGenerativePart)));
    
    const systemInstruction = `Você é um PERITO CANALIZADOR SÊNIOR. Sua linguagem deve ser técnica, formal e objetiva para Seguradoras.
    Use termos como: estanqueidade, patologia hídrica, nexo de causalidade, infiltração por capilaridade, ruptura súbita, intervenção curativa.
    
    TIPO DE RELATÓRIO: ${type === 'peritagem' ? 'DIAGNÓSTICO/BUSCA DE FUGA' : 'FINAL DE OBRA/REPARAÇÃO CONCLUÍDA'}.

    INSTRUÇÃO CRÍTICA PARA FOTOS: Foram enviadas ${im.length} fotos. Analise cada uma detalhadamente e preencha o array "photoAnalysis" com legendas e descrições técnicas individuais para cada foto na ordem em que aparecem.

    Retorne APENAS um JSON:
    {
      "title": "${type === 'peritagem' ? 'Relatório de Peritagem Técnica' : 'Auto de Conclusão de Trabalhos'}",
      "reportType": "${type}",
      "clientInfo": { "name": "${cn}", "nif": "${ni}", "address": "${ca}", "contact": "${co}", "date": "${new Date().toLocaleDateString()}", "technician": "${te}", "interestedParty": "${ip}", "buildingType": "Moradia/Apartamento" },
      "objective": "Descrição formal do objetivo técnico",
      "methodology": ["Inspeção visual armada", "Termografia infravermelha", "Teste de pressão manométrica"],
      "development": [{ "title": "Análise de Sinistro", "content": "Texto técnico detalhado..." }],
      "photoAnalysis": [
        { "photoIndex": 0, "legend": "Legenda da Foto 1", "description": "Descrição técnica detalhada do que é visto na primeira imagem." }
      ],
      "conclusion": { "diagnosis": "Conclusão técnica final", "technicalProof": "Evidência de causa", "consequences": "Danos patrimoniais", "activeLeak": ${type === 'peritagem'} },
      "recommendations": { "repairType": "Procedimento técnico sugerido", "materials": ["Tubo multicamada"], "estimatedTime": "...", "notes": "" }
    }`;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts },
        config: { systemInstruction, responseMimeType: 'application/json' },
    }));
    return JSON.parse(extractJson(response.text || "")) as TechnicalReportData;
}

export async function generateReportSection(topic: string): Promise<ReportSection> {
    const model = 'gemini-3-flash-preview';
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: `Escreva uma seção técnica formal sobre: "${topic}". Retorne APENAS JSON: {"title": "Título", "content": "Conteúdo técnico detalhado"}.`,
        config: { responseMimeType: 'application/json' }
    }));
    return JSON.parse(extractJson(response.text || "")) as ReportSection;
}

export async function analyzeImageForReport(imageBase64: string): Promise<{ legend: string, description: string }> {
    const model = 'gemini-3-flash-preview';
    
    // Crucial: Remover o prefixo data:image/...;base64, antes de enviar
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || "image/jpeg";

    const imagePart = {
        inlineData: { 
            data: base64Data, 
            mimeType: mimeType 
        }
    };

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: "Analise esta imagem tecnicamente para um laudo de canalização ou construção. Descreva a patologia, sinais de humidade, rupturas ou o trabalho técnico realizado." }, imagePart] },
        config: { 
            systemInstruction: `Persona: Perito Técnico de Engenharia Sénior. Responda em Português de Portugal. Retorne APENAS JSON: {"legend": "Título técnico curto (máx 5 palavras)", "description": "Descrição técnica detalhada da evidência (máx 2 parágrafos)"}`, 
            responseMimeType: 'application/json' 
        }
    }));
    
    try { 
        const text = response.text;
        return JSON.parse(extractJson(text || "{}")); 
    } catch (e) { 
        console.error("Erro parsing IA:", e);
        return { legend: "Evidência Fotográfica", description: "Falha ao processar análise da IA." }; 
    }
}

export async function generateWarrantyTerm(clientName: string, clientNif: string, clientAddress: string, serviceDescription: string, companyName: string): Promise<WarrantyData> {
    const model = 'gemini-3-flash-preview';
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: `Gere termo de garantia para ${clientName} sobre o serviço: ${serviceDescription}` }] },
        config: { 
          systemInstruction: `Retorne JSON: {"clientName": "${clientName}", "clientNif": "${clientNif}", "clientAddress": "${clientAddress}", "serviceDescription": "${serviceDescription}", "warrantyPeriod": "12 Meses", "terms": ["Termo 1"], "exclusions": "Exclusões"}`,
          responseMimeType: 'application/json' 
        }
    }));
    const parsed = JSON.parse(extractJson(response.text || ""));
    return { id: `war-${Date.now()}`, ...parsed, startDate: new Date().toLocaleDateString('pt-PT') };
}

export async function generateReceipt(clientName: string, amount: number, description: string, currency: Currency): Promise<Partial<ReceiptData>> {
    const model = 'gemini-3-flash-preview';
    const prompt = `Gere um recibo para: "${clientName}". Valor: ${amount} ${currency}. Referente a: "${description}".`;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
    }));

    try {
        return JSON.parse(extractJson(response.text || ""));
    } catch (e) {
        return { clientName, amount, currency, description, paymentMethod: "A combinar" };
    }
}
