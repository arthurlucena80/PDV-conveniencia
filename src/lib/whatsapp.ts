const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatReceiptText(order: any, clientName?: string): string {
  if (!order) return "";
  
  const discount = Number(order.discount || 0);
  const total = Number(order.total_amount || 0);
  const finalTotal = Math.max(0, total - discount);
  
  const statusIcon = order.status === "PAID" ? "[PAGO]" : "[A PAGAR]";

  let text = `Ola! Aqui esta o recibo do seu pedido.\n`;
  text += `Status: ${statusIcon}\n`;
  text += `Valor: *${BRL(finalTotal)}*\n\n`;

  if (clientName || (order.client && order.client.name)) {
    text += `Cliente: ${clientName || order.client.name}\n\n`;
  }
  
  text += `*Itens:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      const price = item.historical_price || (item.product ? item.product.price : 0);
      const totalItem = Number(price) * item.quantity;
      const productName = item.product ? item.product.name : "Produto Removido";
      text += `- ${item.quantity}x ${productName} - ${BRL(totalItem)}\n`;
    });
  } else {
    text += `Nenhum item registrado.\n`;
  }
  
  if (discount > 0) {
    text += `\nDesconto: -${BRL(discount)}\n`;
  }

  text += `\nAgradecemos a preferencia!`;

  return text;
}

export function formatDebtText(clientName: string, totalDebt: number): string {
  let text = `*Caderno PDV - Lembrete de Fiado*\n\n`;
  text += `Ola, ${clientName}!\n`;
  text += `Passando para lembrar que o seu saldo em aberto conosco e de *${BRL(totalDebt)}*.\n\n`;
  text += `Qualquer duvida, estamos a disposicao!`;
  return text;
}

export function openWhatsApp(phone: string, text: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) {
    alert("Cliente nao possui um numero de telefone valido cadastrado.");
    return;
  }
  
  let fullPhone = cleanPhone;
  if (!cleanPhone.startsWith("55") && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    fullPhone = `55${cleanPhone}`;
  }
  
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${fullPhone}?text=${encodedText}`;
  window.open(url, "_blank");
}
