import { getActiveProducts } from "@/actions/product";
import { getOpenOrders, getClosedOrders } from "@/actions/order";
import { getClients } from "@/actions/client";
import { getCategories } from "@/actions/category";
import { POSClient } from "./pos-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function POSPage() {
  const [products, openOrders, closedOrders, clients, categories] = await Promise.all([
    getActiveProducts(),
    getOpenOrders(),
    getClosedOrders(),
    getClients(),
    getCategories(),
  ]);

  // Serialize all Decimal fields to plain numbers before passing to Client Component
  const serializedProducts = products.map((p: any) => ({
    ...p,
    price: Number(p.price),
    cost_price: p.cost_price != null ? Number(p.cost_price) : null,
  }));

  const serializedClients = clients.map((c: any) => ({
    ...c,
    total_debt: Number(c.total_debt),
    credit_limit: Number(c.credit_limit),
  }));

  const serializedOpenOrders = openOrders.map((o: any) => ({
    ...o,
    total_amount: Number(o.total_amount),
    discount: Number(o.discount ?? 0),
    client: o.client
      ? {
          ...o.client,
          total_debt: Number(o.client.total_debt),
          credit_limit: Number(o.client.credit_limit ?? 0),
        }
      : null,
    items: (o.items ?? []).map((i: any) => ({
      ...i,
      historical_price: Number(i.historical_price),
      product: i.product
        ? {
            ...i.product,
            price: Number(i.product.price),
            cost_price: i.product.cost_price != null ? Number(i.product.cost_price) : null,
          }
        : undefined,
    })),
  }));

  return (
    <POSClient
      initialProducts={serializedProducts}
      openOrders={serializedOpenOrders}
      closedOrders={closedOrders}
      clients={serializedClients}
      categories={categories}
    />
  );
}
