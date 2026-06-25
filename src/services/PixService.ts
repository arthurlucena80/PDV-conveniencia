interface PixResponse {
  qr_code_base64: string;
  copia_e_cola: string;
}

export class PixService {
  static async generatePix(orderId: string, amount: number, gateway: string = "mercado_pago"): Promise<PixResponse> {
    
    // We override process.env behavior if a specific gateway is provided
    switch (gateway) {
      case "mercado_pago":
        return this.generateMercadoPago(orderId, amount);
      case "c6_bank":
        return this.generateC6Bank(orderId, amount);
      case "infinitepay":
        return this.generateInfinitePay(orderId, amount);
      case "efi":
        return this.generateEfi(orderId, amount);
      case "asaas":
        return this.generateAsaas(orderId, amount);
      default:
        throw new Error("Gateway de pagamento PIX inválido configurado.");
    }
  }

  private static async generateMercadoPago(orderId: string, amount: number): Promise<PixResponse> {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado.");

    const url = "https://api.mercadopago.com/v1/payments";
    const body = {
      transaction_amount: amount,
      payment_method_id: "pix",
      external_reference: orderId,
      payer: {
        email: "cliente@pdv.com", // Required by MP
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${orderId}-${Date.now()}` // Prevents double charges
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Erro MP:", err);
      throw new Error("Falha ao gerar PIX no Mercado Pago.");
    }

    const data = await response.json();
    return {
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      copia_e_cola: data.point_of_interaction?.transaction_data?.qr_code
    };
  }

  private static async generateC6Bank(orderId: string, amount: number): Promise<PixResponse> {
    const clientId = process.env.C6_CLIENT_ID;
    const clientSecret = process.env.C6_CLIENT_SECRET;
    const certPath = process.env.C6_CERT_PATH; // Path to .p12 or .pem

    if (!clientId || !clientSecret || !certPath) {
      throw new Error(
        "Credenciais do C6 Bank ausentes. Por favor, configure C6_CLIENT_ID, C6_CLIENT_SECRET e C6_CERT_PATH no seu arquivo .env para gerar PIX automático pelo C6."
      );
    }

    // TODO: Implementar comunicação mTLS com a API do C6 Bank usando https.Agent com o certificado.
    // Passo 1: Obter Token (Oauth2)
    // Passo 2: Criar Cobrança (Cob)
    // Passo 3: Gerar string BRCode e retornar
    throw new Error("Integração C6 Bank pendente de implementação completa com certificado digital.");
  }

  private static async generateInfinitePay(orderId: string, amount: number): Promise<PixResponse> {
    const apiKey = process.env.INFINITEPAY_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Chave de API da InfinitePay ausente. Por favor, configure INFINITEPAY_API_KEY no seu arquivo .env para gerar PIX automático."
      );
    }

    // TODO: Implementar chamada para a API da InfinitePay (geralmente via JWT ou API Key no header).
    // Passo 1: Fazer POST para endpoint de PIX dinâmico da InfinitePay
    // Passo 2: Retornar o payload de base64 e qr_code
    throw new Error("Integração InfinitePay pendente de implementação completa.");
  }

  private static async generateEfi(orderId: string, amount: number): Promise<PixResponse> {
    if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET) {
      throw new Error("Credenciais da Efí ausentes.");
    }
    // TODO: Esqueleto de implementação Efí (requer certificado .p12 lido via https.Agent)
    throw new Error("Integração Efí pendente de implementação completa com certificado p12.");
  }

  private static async generateAsaas(orderId: string, amount: number): Promise<PixResponse> {
    if (!process.env.ASAAS_API_KEY) {
      throw new Error("Chave do Asaas ausente.");
    }
    // TODO: Esqueleto de implementação Asaas
    throw new Error("Integração Asaas pendente de implementação completa.");
  }
}
