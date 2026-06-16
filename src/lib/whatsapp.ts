const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatReceiptText(order: any, clientName?: string): string {
  if (!order) return "";
  
  const date = new Date(order.created_at || Date.now()).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  let text = `🏪 *Caderno PDV - Sua Comanda*\n`;
  text += `📅 Data: ${date}\n`;
  
  if (clientName || (order.client && order.client.name)) {
    text += `👤 Cliente: ${clientName || order.client.name}\n`;
  }
  
  text += `\n*🛒 Itens:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      // Verifica se o histórico do preço foi guardado ou pega do produto
      const price = item.historical_price || (item.product ? item.product.price : 0);
      const totalItem = Number(price) * item.quantity;
      const productName = item.product ? item.product.name : "Produto Removido";
      text += `${item.quantity}x ${productName} - ${BRL(totalItem)}\n`;
    });
  } else {
    text += `Nenhum item registrado.\n`;
  }
  
  text += `\n---\n`;
  const discount = Number(order.discount || 0);
  if (discount > 0) {
    text += `🏷️ Desconto: ${BRL(discount)}\n`;
  }
  
  const total = Number(order.total_amount || 0);
  const finalTotal = Math.max(0, total - discount);
  text += `💰 *Total: ${BRL(finalTotal)}*\n`;
  
  // Inclui se foi fiado ou pago
  if (order.status === "UNPAID") {
    text += `⚠️ *Status: Colocado no Fiado*\n`;
  } else if (order.status === "PAID") {
    text += `✅ *Status: Pago*\n`;
  }

  text += `\nObrigado pela preferência! 🤝`;

  return text;
}

export function formatDebtText(clientName: string, totalDebt: number): string {
  let text = `🏪 *Caderno PDV - Lembrete de Fiado*\n\n`;
  text += `Olá, ${clientName}!\n`;
  text += `Passando para lembrar que o seu saldo em aberto conosco é de *${BRL(totalDebt)}*.\n\n`;
  text += `Qualquer dúvida, estamos à disposição! 🤝`;
  return text;
}

export function openWhatsApp(phone: string, text: string) {
  // Remove tudo que não for número
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) {
    alert("Cliente não possui um número de telefone válido cadastrado.");
    return;
  }
  
  // Se o telefone não começar com 55 e tiver 10 ou 11 dígitos, adiciona o DDI do Brasil
  let fullPhone = cleanPhone;
  if (!cleanPhone.startsWith("55") && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    fullPhone = `55${cleanPhone}`;
  }
  
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${fullPhone}?text=${encodedText}`;
  window.open(url, "_blank");
}
