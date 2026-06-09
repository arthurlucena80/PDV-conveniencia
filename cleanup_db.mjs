import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Delete all empty open orders (R$ 0,00 with no items)
  const deleted = await prisma.order.deleteMany({
    where: {
      status: 'OPEN',
      total_amount: 0,
      items: { none: {} }
    }
  });
  console.log(`Deletadas ${deleted.count} comandas vazias`);
  
  const remaining = await prisma.order.findMany({ where: { status: 'OPEN' }, include: { client: true, items: true } });
  console.log('\n=== COMANDAS RESTANTES ===');
  remaining.forEach(o => console.log(`${o.id.slice(0,8)}: R$ ${Number(o.total_amount).toFixed(2)} - ${o.client?.name || 'Avulsa'} (${o.items.length} itens)`));
  
  await prisma.$disconnect();
}
main();
