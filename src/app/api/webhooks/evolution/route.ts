import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O webhook da Evolution API manda eventos como "MESSAGES_UPSERT", "MESSAGES_UPDATE"
    const eventType = body.event;
    
    if (eventType === "MESSAGES_UPSERT") {
      const messageInfo = body.data;
      console.log("Recebida mensagem do WhatsApp:", JSON.stringify(messageInfo, null, 2));
      
      // Aqui podemos implementar lógicas como respostas automáticas
      // ou atualizar o status do pedido no banco se for uma aprovação, etc.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no Webhook da Evolution API:", error);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
