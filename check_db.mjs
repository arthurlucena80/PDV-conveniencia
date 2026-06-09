import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  console.log('=== CLIENTES ===');
  clients.forEach(c => console.log(`${c.name}: R$ ${Number(c.total_debt).toFixed(2)}`));
  
  const orders = await prisma.order.findMany({ where: { status: 'OPEN' }, include: { client: true } });
  console.log('\n=== COMANDAS ABERTAS ===');
  orders.forEach(o => console.log(`Ordem ${o.id.slice(0,8)}: R$ ${Number(o.total_amount).toFixed(2)} - ${o.client?.name || 'Avulsa'}`));
  
  await prisma.$disconnect();
}
main();
