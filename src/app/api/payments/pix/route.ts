import { NextResponse } from "next/server";

// TODO: Instalar o pacote mercadopago: npm install mercadopago
// import { MercadoPagoConfig, Payment } from "mercadopago";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description } = body;

    // Quando você tiver as credenciais do Mercado Pago, adicione no .env:
    // MP_ACCESS_TOKEN=APP_USR-...
    
    // const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    // const payment = new Payment(client);
    
    // const response = await payment.create({
    //   body: {
    //     transaction_amount: amount,
    //     description: description || "Venda Caderno PDV",
    //     payment_method_id: "pix",
    //     payer: {
    //       email: "cliente@email.com",
    //     },
    //   }
    // });

    // Retorno Mockado para demonstração no Checkout
    return NextResponse.json({
      qr_code: "00020101021126...MOCK...QR...CODE",
      qr_code_base64: "base64_image_data_here",
      id: "1234567890",
    });

  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return NextResponse.json({ error: "Falha ao gerar PIX" }, { status: 500 });
  }
}
