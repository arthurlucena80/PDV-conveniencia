"use server";

import { PixService } from "@/services/PixService";

export async function generatePixAction(orderId: string, amount: number, gateway: string = "mercado_pago") {
  try {
    const result = await PixService.generatePix(orderId, amount, gateway);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Generate PIX Error:", error);
    return { success: false, error: error.message };
  }
}
