"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([
    { text: "Olá! Sou o assistente virtual do ControleNaMão. Como posso te ajudar hoje?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInput("");
    
    // Simple logic
    setTimeout(() => {
      let reply = "Desculpe, não entendi. Você pode perguntar sobre Vendas, Fiado, Pagamentos ou Comandas.";
      const lower = text.toLowerCase();
      if (lower.includes("venda") || lower.includes("balcão")) {
        reply = "Para fazer uma venda rápida, clique nos produtos na tela principal para adicionar ao carrinho e depois clique no botão laranja 'Cobrar'.";
      } else if (lower.includes("fiado") || lower.includes("caderno") || lower.includes("dívida")) {
        reply = "Para vender no fiado, clique em 'Cobrar' e escolha a opção 'Fiado', depois selecione o cliente. Para ver a dívida, vá no menu 'Cliente'.";
      } else if (lower.includes("comanda") || lower.includes("mesa")) {
        reply = "Vá em 'Comandas / Mesas' no menu lateral e clique no (+). Para adicionar itens, vá na venda, escolha os produtos e clique em 'Voltar' em vez de cobrar.";
      } else if (lower.includes("pagamento") || lower.includes("pix") || lower.includes("cartão") || lower.includes("dinheiro")) {
        reply = "Ao clicar em 'Cobrar', você pode escolher Dinheiro (calcula troco), Cartão (escolha a máquina) ou PIX (gera QR code na tela e baixa automático!).";
      } else if (lower.includes("recibo") || lower.includes("whatsapp") || lower.includes("zap")) {
        reply = "Ao cobrar, deixe a opção 'Enviar recibo por WhatsApp' verde. O sistema abrirá seu WhatsApp com a mensagem pronta no final!";
      } else if (lower.includes("foto") || lower.includes("imagem")) {
        reply = "Para adicionar fotos aos produtos, vá em 'Cadastro de Produtos', clique no lápis do produto e clique no grande botão de 'Adicionar Foto'.";
      }
      setMessages(prev => [...prev, { text: reply, isBot: true }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-6 right-6 p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 hover:scale-105 transition-all z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-20 md:bottom-6 right-2 md:right-6 w-[calc(100vw-1rem)] max-w-sm md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} 
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Assistente ControleNaMão</h3>
              <p className="text-xs text-orange-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-300 inline-block"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-orange-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.isBot ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm' : 'bg-orange-500 text-white rounded-tr-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {['Como Vender?', 'Fiado', 'Comandas', 'WhatsApp', 'PIX'].map(s => (
              <button key={s} onClick={() => handleSend(s)} className="shrink-0 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Digite sua dúvida..." 
              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500 bg-gray-50 focus:bg-white transition-colors"
            />
            <button type="submit" disabled={!input.trim()} className="h-10 px-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 flex items-center justify-center disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
