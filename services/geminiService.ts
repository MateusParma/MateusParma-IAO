
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { QuoteData, QuoteStep, Currency, TechnicalReportData, PhotoAnalysis, ReportSection } from '../types';

// Helper function to get API Key from various sources
const getApiKey = (): string | undefined => {
  // 1. Check standard process.env (Node.js/AI Studio)
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is undefined
  }

  // 2. Check Vite environment variable (Browser/Vercel)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is undefined
  }

  return undefined;
};

const apiKey = getApiKey();

if (!apiKey) {
    throw new Error("API Key não encontrada. Por favor, configure a variável de ambiente 'VITE_API_KEY' (ou 'API_KEY') nas configurações do seu projeto no Vercel.");
}

const ai = new GoogleGenAI({ apiKey });

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
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

/**
 * Executa uma operação assíncrona com tentativas automáticas em caso de erro 503 (Model Overloaded).
 */
async function runWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Tenta identificar erros de sobrecarga (503 ou mensagem específica)
    const errorCode = error?.status || error?.code || error?.error?.code;
    const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
    
    const isOverloaded = 
      errorCode === 503 || 
      (typeof errorMessage === 'string' && (
        errorMessage.includes('overloaded') || 
        errorMessage.includes('503') || 
        errorMessage.includes('UNAVAILABLE')
      ));

    if (isOverloaded && retries > 0) {
      console.warn(`Gemini API sobrecarregada. Tentando novamente em ${delay/1000}s... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Backoff exponencial: espera o dobro do tempo na próxima tentativa
      return runWithRetry(operation, retries - 1, delay * 2);
    }
    
    // Se não for erro de sobrecarga ou acabaram as tentativas, lança o erro original
    throw error;
  }
}

// Helper para extrair JSON limpo da resposta
const extractJson = (text: string): string => {
    let jsonText = (text || "").trim();
    const jsonMatch = jsonText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[2]) {
        return jsonMatch[2];
    }
    // Fallback: tenta encontrar o primeiro { e o último }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return jsonText.substring(firstBrace, lastBrace + 1);
    }
    return jsonText;
};

/**
 * Valida a descrição do serviço para identificar ambiguidades.
 */
export async function validateDescription(description: string): Promise<{ isValid: boolean; questions?: string[] }> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
        Você é um mestre de obras sênior e professor. Analise esta solicitação de serviço: "${description}".
        
        Seu objetivo é identificar se faltam informações cruciais para dar um preço (Ação, Item, Quantidade).
        
        Se a descrição for vaga (ex: "sanita", "parede", "pintura", "vazamento"), você deve listar O QUE EXATAMENTE falta saber.
        
        IMPORTANTE: Liste no MÁXIMO 3 perguntas mais importantes. Se houver muitas dúvidas, foque apenas nas 3 principais que impedem o orçamento.
        
        Retorne APENAS um JSON:
        {
            "isValid": boolean,
            "questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"]
        }

        Regras:
        - Se estiver claro o suficiente para estimar, isValid = true.
        - Se "isValid" for false, "questions" deve ser um array de strings. Cada string é uma pergunta direta sobre um item específico que ficou confuso.
    `;

    try {
        const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        }));

        const jsonText = extractJson(response.text || "");
        const parsed = JSON.parse(jsonText);
        
        // Ensure strict typing structure return
        return {
            isValid: parsed.isValid,
            questions: Array.isArray(parsed.questions) ? parsed.questions : (parsed.question ? [parsed.question] : [])
        };
    } catch (e) {
        console.warn("Validation failed, proceeding anyway.", e);
        return { isValid: true };
    }
}


export async function generateQuote(description: string, city: string, images: File[], currency: Currency, clientName: string): Promise<Omit<QuoteData, 'id' | 'date' | 'clientName' | 'clientAddress' | 'clientContact'>> {
    const model = 'gemini-2.5-flash';

    const textPart = {
        text: `
          Cliente: ${clientName}
          Descrição do Trabalho: ${description}
          Cidade para Precificação: ${city}
          Moeda para o orçamento: ${currency}

          Por favor, analise as seguintes imagens e a descrição do trabalho para gerar um orçamento detalhado.
          Use a busca para encontrar os preços de mercado justos para os serviços e materiais na cidade e moeda informadas.
          Divida o trabalho em etapas lógicas, descreva cada uma, estime uma quantidade, uma unidade (se aplicável), e um preço de mercado justo POR UNIDADE para cada etapa.
          Além disso, estime um prazo de execução razoável e uma forma de pagamento padrão para este tipo de serviço.
        `,
    };

    const imageParts = await Promise.all(images.map(fileToGenerativePart));
    
    const systemInstruction = `Você é um assistente especialista para profissionais de construção e reparos domésticos. Sua tarefa é criar orçamentos detalhados e profissionais. As descrições devem ser claras, diretas e escritas como se você, o profissional, estivesse explicando cada etapa do serviço diretamente para o cliente final (use uma linguagem como "Nesta etapa, iremos preparar...", "Aqui, faremos a instalação...").
Use a ferramenta de busca para pesquisar os custos de mão de obra e materiais na cidade e moeda especificadas pelo usuário.
Sua resposta DEVE ser um único objeto JSON, e nada mais. Não inclua \`\`\`json ou qualquer outra formatação markdown.
O JSON deve ter a seguinte estrutura:
{
  "title": "Um título conciso e profissional para o trabalho geral.",
  "summary": "Um breve resumo do trabalho a ser realizado.",
  "executionTime": "Uma estimativa do tempo total necessário (ex: '3 a 5 dias úteis').",
  "paymentTerms": "Uma sugestão de forma de pagamento comum para este serviço (ex: '50% de entrada e 50% na conclusão').",
  "steps": [
    {
      "title": "Um título curto para esta etapa específica (ex: 'Preparação da Superfície e Demolição').",
      "description": "Uma descrição detalhada das tarefas envolvidas nesta etapa, escrita como se estivesse explicando ao cliente.",
      "suggestedQuantity": "A quantidade estimada para esta etapa (ex: 5 para 5m², 1 para uma tarefa única), como um número. Use 1 como padrão se não for aplicável.",
      "suggestedPrice": {
          "unitPrice": "O preço de mercado justo estimado POR UNIDADE para esta etapa, como um número sem símbolos de moeda.",
          "unit": "A unidade de medida para o preço (ex: 'm²', 'unidade', 'hora')."
      }
    }
  ]
}`;

    // Utiliza a função de retry para chamar a API
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [textPart, ...imageParts] },
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
        },
    }));

    try {
        const jsonText = extractJson(response.text || "");
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson.title && Array.isArray(parsedJson.steps)) {
             const stepsWithUserPrice: QuoteStep[] = parsedJson.steps.map((step: any) => {
                const unitPrice = step.suggestedPrice?.unitPrice ?? step.suggestedPrice ?? 0;
                const unit = step.suggestedPrice?.unit;
                const quantity = step.suggestedQuantity ?? 1;
                return {
                    id: `step-${Date.now()}-${Math.random()}`, // Generate ID
                    title: step.title,
                    description: step.description,
                    suggestedPrice: Number(unitPrice),
                    suggestedUnit: unit,
                    quantity: Number(quantity),
                    userPrice: Number(unitPrice), 
                    taxRate: 0, 
                };
            });
            return { 
                title: parsedJson.title,
                summary: parsedJson.summary,
                executionTime: parsedJson.executionTime || "A definir",
                paymentTerms: parsedJson.paymentTerms || "A combinar",
                steps: stepsWithUserPrice, 
                currency, 
                city,
                observations: "" // Inicializa campo vazio
            } as Omit<QuoteData, 'id' | 'date' | 'clientName' | 'clientAddress' | 'clientContact'>;
        } else {
            throw new Error("A resposta da IA não corresponde ao formato esperado.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text, e);
        throw new Error("A resposta da IA não estava em um formato JSON válido.");
    }
}

export async function generateSingleQuoteStep(itemDescription: string, city: string, currency: Currency): Promise<QuoteStep> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
        Crie uma ÚNICA etapa de orçamento profissional para: "${itemDescription}".
        Cidade: ${city}. Moeda: ${currency}.
        Pesquise preços de mercado.
        Retorne APENAS um JSON válido, sem formatação markdown.
        Estrutura:
        {
            "title": "Título Curto Profissional",
            "description": "Descrição detalhada técnica para o cliente.",
            "suggestedQuantity": 1,
            "suggestedPrice": { "unitPrice": 0.00, "unit": "un/m2/h" }
        }
    `;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
            tools: [{ googleSearch: {} }],
        },
    }));

    try {
        const jsonText = extractJson(response.text || "");
        const parsed = JSON.parse(jsonText);
        
        return {
            id: `step-${Date.now()}-${Math.random()}`,
            title: parsed.title,
            description: parsed.description,
            suggestedPrice: Number(parsed.suggestedPrice?.unitPrice || parsed.suggestedPrice || 0),
            suggestedUnit: parsed.suggestedPrice?.unit || 'un',
            quantity: Number(parsed.suggestedQuantity || 1),
            userPrice: Number(parsed.suggestedPrice?.unitPrice || parsed.suggestedPrice || 0),
            taxRate: 0
        };
    } catch (e) {
        console.error("Erro ao gerar etapa única:", response.text, e);
        throw new Error("Falha ao gerar nova etapa.");
    }
}

export async function generateReportSection(topic: string): Promise<ReportSection> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
        Escreva uma seção profissional para um Laudo Técnico de Peritagem de Sinistro/Engenharia.
        Tópico da seção: "${topic}".
        
        A linguagem deve ser formal, técnica (PT-PT/PT-BR) e adequada para seguradoras.
        Retorne APENAS um JSON válido, sem markdown.
        Estrutura:
        {
            "title": "Título Sugerido para o Tópico",
            "content": "Texto técnico completo, detalhado e bem formatado (sem quebras de linha JSON inválidas)."
        }
    `;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
    }));

    try {
        const jsonText = extractJson(response.text || "");
        const parsed = JSON.parse(jsonText);
        
        return {
            id: `sec-${Date.now()}-${Math.random()}`,
            title: parsed.title || topic,
            content: parsed.content || ""
        };
    } catch (e) {
        console.error("Erro ao gerar seção de laudo:", response.text, e);
        throw new Error("Falha ao gerar conteúdo da seção.");
    }
}

export async function generateTechnicalReport(quote: QuoteData, images: File[], companyName: string, referenceCode?: string): Promise<TechnicalReportData> {
    const model = 'gemini-2.5-flash';
    
    const textPart = {
        text: `
          DADOS DO SERVIÇO:
          Cliente: ${quote.clientName}
          Endereço: ${quote.clientAddress}
          Contato: ${quote.clientContact}
          Data: ${new Date().toLocaleDateString('pt-PT')}
          Descrição do Problema/Serviço: ${quote.summary}
          
          DETALHES DO ORÇAMENTO JÁ GERADO:
          ${quote.steps.map(s => `- ${s.title}: ${s.description}`).join('\n')}

          Gere um LAUDO TÉCNICO PROFISSIONAL seguindo estritamente o protocolo da empresa "${companyName || 'HidroClean'}".
          ${referenceCode ? `Este laudo é referente ao Processo ${referenceCode}.` : ''}
          
          IMPORTANTE: Se não houver imagens fornecidas, a seção "photoAnalysis" deve ser um array vazio [].
        `
    };

    const parts: any[] = [textPart];
    if (images && images.length > 0) {
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        parts.push(...imageParts);
    }

    const systemInstruction = `Você é um perito técnico da empresa ${companyName || 'HidroClean'}. Sua tarefa é criar um "Laudo Técnico" extremamente profissional.
    PROTOCOLO OBRIGATÓRIO:
    1. ANÁLISE: Identifique o tipo de problema.
    2. ESTRUTURA DO JSON DE RESPOSTA (ÚNICA SAÍDA PERMITIDA):
    {
      "title": "LAUDO TÉCNICO - RELATÓRIO DE INSPEÇÃO",
      "code": "${referenceCode ? referenceCode.replace('ORC', 'LAU') : ''}", 
      "clientInfo": {
        "name": "Nome do Cliente",
        "address": "Endereço completo",
        "contact": "Contato do Cliente",
        "date": "Data atual",
        "technician": "Técnico Responsável",
        "buildingType": "Apartamento/Moradia"
      },
      "objective": "Descrição curta e técnica.",
      "methodology": ["Lista", "de", "equipamentos"],
      "development": [
        { 
           "title": "Inspeção Inicial", 
           "content": "Texto LONGO e detalhado." 
        }
      ],
      "photoAnalysis": [
        {
           "photoIndex": 0,
           "legend": "Legenda técnica",
           "description": "Descrição técnica."
        }
      ],
      "conclusion": {
        "diagnosis": "Local exato da avaria.",
        "technicalProof": "Evidências que comprovam.",
        "consequences": "Impacto.",
        "activeLeak": true
      },
      "recommendations": {
        "repairType": "Descrição do reparo.",
        "materials": ["Lista"],
        "estimatedTime": "Tempo estimado",
        "notes": "Observações."
      }
    }
    `;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: parts },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json'
        },
    }));

    try {
        const jsonText = extractJson(response.text || "");
        const parsedJson = JSON.parse(jsonText);
        
        if(parsedJson.clientInfo) {
            parsedJson.clientInfo.contact = quote.clientContact;
        }
        
        // Force linkage if AI missed it
        if (referenceCode) {
            parsedJson.relatedQuoteCode = referenceCode;
            // If AI didn't generate a code based on ref, we force a connection logic in UI later, 
            // but hopefully the prompt handles it.
        }

        // Add IDs to sections
        if (parsedJson.development) {
            parsedJson.development = parsedJson.development.map((d: any) => ({
                ...d,
                id: `sec-${Date.now()}-${Math.random()}`
            }));
        }

        return parsedJson as TechnicalReportData;
    } catch (e) {
        console.error("Failed to parse Report JSON:", response.text, e);
        throw new Error("Não foi possível gerar o relatório técnico. Tente novamente.");
    }
}

export async function generateDirectTechnicalReport(
    description: string, 
    equipment: string, 
    images: File[], 
    clientName: string, 
    clientAddress: string, 
    clientNif: string,
    clientContact: string,
    interestedParty: string,
    technician: string,
    companyName: string
): Promise<TechnicalReportData> {
    const model = 'gemini-2.5-flash';
    
    const textPart = {
        text: `
          DADOS PARA PERÍCIA:
          Cliente (Segurado): ${clientName}
          NIF: ${clientNif || 'Não informado'}
          Local do Risco: ${clientAddress}
          Contato: ${clientContact || 'Não informado'}
          Data: ${new Date().toLocaleDateString('pt-PT')}
          Técnico Responsável: ${technician}
          Interessado/Terceiro: ${interestedParty || 'Não aplicável'}
          
          RELATO DO OCORRIDO/AVARIA:
          ${description}
          
          EQUIPAMENTOS UTILIZADOS:
          ${equipment || 'Não especificado, assumir equipamentos padrão de peritagem não destrutiva.'}
          
          Gere um LAUDO DE PERITAGEM TÉCNICA estritamente focado para SEGURADORAS.
        `
    };

    const parts: any[] = [textPart];
    if (images && images.length > 0) {
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        parts.push(...imageParts);
    }

    const systemInstruction = `Você é um Perito Avaliador de Sinistros Patrimoniais experiente.
    ESTRUTURA OBRIGATÓRIA DO JSON:
    {
      "title": "RELATÓRIO DE PERITAGEM TÉCNICA - AVERIGUAÇÃO DE SINISTRO",
      "clientInfo": {
        "name": "Nome do Segurado",
        "nif": "NIF do Segurado",
        "address": "Local do Risco",
        "contact": "Contato do Segurado",
        "date": "Data da Peritagem",
        "technician": "Perito Responsável",
        "interestedParty": "Interessado",
        "buildingType": "Tipo de Imóvel"
      },
      "objective": "Objetivo da Perícia.",
      "methodology": ["Lista", "de", "equipamentos"],
      "development": [
        { 
           "title": "1. Enquadramento e Ocorrência", 
           "content": "Descrição factual." 
        }
      ],
      "photoAnalysis": [
        {
           "photoIndex": 0, 
           "legend": "Legenda Técnica",
           "description": "Descrição da evidência."
        }
      ],
      "conclusion": {
        "diagnosis": "Resumo conclusivo.",
        "technicalProof": "Elemento irrefutável.",
        "consequences": "Riscos.",
        "activeLeak": true
      },
      "recommendations": {
        "repairType": "Plano de Trabalhos.",
        "materials": ["Materiais"],
        "estimatedTime": "Previsão",
        "notes": "Recomendações."
      }
    }`;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: parts },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json'
        },
    }));

    try {
        const jsonText = extractJson(response.text || "");
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson.clientInfo) {
            parsedJson.clientInfo.name = clientName;
            parsedJson.clientInfo.address = clientAddress;
            parsedJson.clientInfo.nif = clientNif;
            parsedJson.clientInfo.contact = clientContact;
            parsedJson.clientInfo.technician = technician;
            parsedJson.clientInfo.interestedParty = interestedParty;
        }
        
        // Add IDs to sections
        if (parsedJson.development) {
            parsedJson.development = parsedJson.development.map((d: any) => ({
                ...d,
                id: `sec-${Date.now()}-${Math.random()}`
            }));
        }

        return parsedJson as TechnicalReportData;
    } catch (e) {
        console.error("Failed to parse Report JSON:", response.text, e);
        throw new Error("Não foi possível gerar o laudo pericial. Tente novamente.");
    }
}

export async function analyzeImageForReport(image: File): Promise<{ legend: string, description: string }> {
    const model = 'gemini-2.5-flash';
    const imagePart = await fileToGenerativePart(image);
    
    const textPart = {
        text: "Analise esta imagem tecnicamente para um laudo de engenharia/manutenção."
    };

    const systemInstruction = `
        Você é um perito técnico. Analise a imagem fornecida e retorne um JSON com dois campos:
        1. "legend": Um título curto e técnico (max 5 palavras).
        2. "description": Uma descrição técnica detalhada da anomalia ou situação observada (max 2 frases).
        
        Exemplo: {"legend": "Infiltração em Parede", "description": "Observa-se mancha de humidade com eflorescência na zona inferior da alvenaria."}
    `;

    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [textPart, imagePart] },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json'
        }
    }));

    try {
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { legend: "Análise de Imagem", description: "Descrição não disponível." };
    }
}
