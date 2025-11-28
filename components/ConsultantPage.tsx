
import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, UserCircleIcon, CpuChipIcon, LightBulbIcon, ScaleIcon } from './AppIcons'; 
import { sendConsultantMessage, ChatMessage } from '../services/geminiConsultantService';
import type { UserSettings } from '../types';

interface ConsultantPageProps {
  userSettings: UserSettings;
}

export const ConsultantPage: React.FC<ConsultantPageProps> = ({ userSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
        role: 'model', 
        text: `Olá! Sou o seu Consultor Empresarial IA especializado para a **${userSettings.companyName}**. \n\nPosso ajudar com leis portuguesas, contabilidade, impostos (AT) ou estruturação para franchising. Como posso ajudar o seu negócio hoje?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const responseText = await sendConsultantMessage(messages, text, userSettings.companyName);
        
        const aiMsg: ChatMessage = { role: 'model', text: responseText };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema ao processar. Tente novamente." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    { icon: <ScaleIcon className="h-4 w-4" />, text: "Quais as obrigações fiscais mensais de uma empresa de canalização em Portugal?" },
    { icon: <LightBulbIcon className="h-4 w-4" />, text: "Como transformo a HidroClean em uma franquia?" },
    { icon: <ScaleIcon className="h-4 w-4" />, text: "Regras para contratar um ajudante a termo certo." },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center shadow-md shrink-0">
          <div className="bg-white/10 p-2 rounded-full mr-3">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
          </div>
          <div>
              <h2 className="text-white font-bold text-lg">Consultor Empresarial IA</h2>
              <p className="text-gray-300 text-xs">Especialista em Leis PT, Fiscalidade e Negócios</p>
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 mx-2 ${isUser ? 'bg-primary text-white' : 'bg-gray-700 text-white'}`}>
                              {isUser ? <UserCircleIcon className="h-6 w-6" /> : <CpuChipIcon className="h-6 w-6" />}
                          </div>
                          
                          {/* Bubble */}
                          <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                              isUser 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                          }`}>
                              {msg.text}
                          </div>
                      </div>
                  </div>
              );
          })}
          
          {isLoading && (
              <div className="flex justify-start">
                  <div className="flex flex-row">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 text-white flex items-center justify-center mt-1 mx-2">
                          <CpuChipIcon className="h-6 w-6" />
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only if few messages) */}
      {messages.length < 3 && !isLoading && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {suggestedQuestions.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(q.text)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-primary transition shadow-sm"
                  >
                      {q.icon}
                      {q.text}
                  </button>
              ))}
          </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          <div className="relative flex items-center gap-2">
              <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua dúvida sobre leis, impostos ou negócios..."
                  className="w-full p-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none resize-none text-sm max-h-32 transition"
                  rows={1}
                  style={{ minHeight: '44px' }}
              />
              <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 disabled:bg-gray-300 transition shadow-sm"
              >
                  <PaperAirplaneIcon className="w-5 h-5" />
              </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
              A IA pode cometer erros. Considere consultar um advogado ou contabilista para decisões críticas.
          </p>
      </div>
    </div>
  );
};
