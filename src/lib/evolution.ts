import { formatReceiptText, formatDebtText } from "./whatsapp";

// Pegando as variáveis de ambiente
const API_URL = process.env.EVOLUTION_API_URL || "";
const API_KEY = process.env.EVOLUTION_API_KEY || "";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "";

/**
 * Envia uma mensagem de texto usando a Evolution API.
 * @param phone Número de telefone com DDI (ex: 5511999999999)
 * @param text O texto da mensagem a ser enviada
 */
export async function sendEvolutionMessage(phone: string, text: string) {
  if (!API_URL || !API_KEY || !INSTANCE_NAME) {
    console.warn("⚠️ Evolution API não está configurada no .env. Mensagem cancelada.");
    return { success: false, error: "API_NOT_CONFIGURED" };
  }

  // Limpa o número de telefone (apenas números)
  let cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return { success: false, error: "INVALID_PHONE" };
  
  // Adiciona 55 se o número tiver 10 ou 11 dígitos e não começar com 55
  if (!cleanPhone.startsWith("55") && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    cleanPhone = `55${cleanPhone}`;
  }

  try {
    const url = `${API_URL}/message/sendText/${INSTANCE_NAME}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY
      },
      body: JSON.stringify({
        number: cleanPhone,
        options: {
          delay: 1200,
          presence: "composing", // Mostra "escrevendo..." antes de enviar
          linkPreview: false
        },
        textMessage: {
          text: text
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("❌ Erro ao enviar mensagem via Evolution API:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("❌ Falha na conexão com a Evolution API:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Utilitário para enviar um recibo da comanda automaticamente
 */
export async function sendReceiptViaEvolution(order: any, phoneOverride?: string) {
  const targetPhone = phoneOverride || (order.client && order.client.phone);
  
  if (!targetPhone) {
    return { success: false, error: "NO_CLIENT_PHONE" };
  }

  const clientName = order.client?.name || "Cliente Balcão";
  const text = formatReceiptText(order, clientName);
  return await sendEvolutionMessage(targetPhone, text);
}

/**
 * Utilitário para enviar lembrete de fiado
 */
export async function sendDebtReminderViaEvolution(client: any) {
  if (!client || !client.phone) {
    return { success: false, error: "NO_CLIENT_PHONE" };
  }

  const text = formatDebtText(client.name, Number(client.total_debt));
  return await sendEvolutionMessage(client.phone, text);
}
