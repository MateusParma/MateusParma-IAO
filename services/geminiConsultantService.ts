
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// Retrieve API Key (Same logic as geminiService)
const getApiKey = (): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

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
if (!apiKey) {
    throw new Error("API Key não encontrada.");
}

const ai = new GoogleGenAI({ apiKey });

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

/**
 * Envia mensagem para o Consultor Empresarial IA.
 * Mantém o contexto da conversa enviando o histórico.
 */
export async function sendConsultantMessage(history: ChatMessage[], newMessage: string, companyName: string): Promise<string> {
    const model = 'gemini-2.5-flash';

    // Construção do prompt com histórico
    const contextPrompt = `
        CONTEXTO DO USUÁRIO:
        Empresa: "${companyName}" (Ramo: Canalização, Serviços Hidráulicos e Reparos).
        Localização Principal: Portugal (foco em leis PT, AT - Autoridade Tributária, Código do Trabalho).
        Objetivo: Crescimento, Organização Contábil e Expansão via Franchising.

        SUA PERSONA:
        Você é um Consultor Empresarial Sênior especializado em PMEs em Portugal.
        Você domina:
        1. Legislação Portuguesa (Código do Trabalho, Segurança Social).
        2. Fiscalidade (IVA, IRC, AT, Faturação Eletrônica).
        3. Contabilidade (Organizada vs Regime Simplificado).
        4. Franchising (Como estruturar, Manuais Operacionais, Contratos).
        
        DIRETRIZES:
        - Responda sempre em Português de Portugal (PT-PT) de forma profissional, mas clara e didática.
        - Se a pergunta for legal/fiscal, dê a resposta técnica citando as leis quando possível, mas SEMPRE adicione um aviso de isenção de responsabilidade (sugira consultar um Contabilista Certificado ou Advogado).
        - Seja encorajador sobre o crescimento da HidroClean.
        - Use formatação Markdown (negrito, listas) para facilitar a leitura.
        - Se o usuário perguntar sobre algo fora do contexto empresarial/hidráulico, gentilmente traga a conversa de volta ao foco.
    `;

    // Converte o histórico para o formato do chat
    const historyParts = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // Adiciona a nova mensagem do usuário
    const chat = ai.chats.create({
        model: model,
        config: {
            systemInstruction: contextPrompt,
        },
        history: historyParts
    });

    try {
        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "Desculpe, não consegui processar sua solicitação no momento.";
    } catch (error) {
        console.error("Erro no Consultor IA:", error);
        return "Ocorreu um erro ao conectar com o consultor. Por favor, tente novamente em instantes.";
    }
}
