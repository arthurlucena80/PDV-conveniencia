import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gateway = process.env.PAYMENT_GATEWAY_ACTIVE || "mercado_pago";

    if (gateway === "mercado_pago") {
      const signature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      const dataId = url.searchParams.get("data.id") || "";
      
      const bodyText = await req.text();
      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      // Validação HMAC contra fraudes (Mercado Pago V1)
      if (process.env.MP_WEBHOOK_SECRET && signature) {
        const parts = signature.split(",");
        let ts = "";
        let v1 = "";
        for (const p of parts) {
          if (p.startsWith("ts=")) ts = p.replace("ts=", "");
          if (p.startsWith("v1=")) v1 = p.replace("v1=", "");
        }

        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET);
        hmac.update(manifest);
        const computedSignature = hmac.digest("hex");

        if (computedSignature !== v1) {
          console.error("Tentativa de fraude no Webhook: Assinatura HMAC inválida!");
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }

      // Se passou na validação de segurança, verifica se o pagamento foi aprovado
      if (body.action === "payment.updated" || body.action === "payment.created") {
        const paymentId = body.data?.id;
        
        // Faz uma requisição GET ao MP para garantir o status e pegar a referência externa
        const accessToken = process.env.MP_ACCESS_TOKEN;
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          if (paymentData.status === "approved" && paymentData.external_reference) {
            const orderId = paymentData.external_reference;
            
            // Marca o pedido como PAID
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "PAID", closed_at: new Date() }
            });
            console.log(`Pedido ${orderId} atualizado para PAID via Webhook Pix.`);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Gateway selecionado ainda não suporta webhook." });
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
