import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.updateMany({
    where: { name: 'Heineken Long Neck' },
    data: { image_url: 'https://dummyimage.com/300x300/10b54e/ffffff.png&text=Heineken' }
  });

  await prisma.product.updateMany({
    where: { name: 'Água Mineral Sem Gás' },
    data: { image_url: 'https://dummyimage.com/300x300/4eb0e3/ffffff.png&text=Agua+Mineral' }
  });

  console.log("Images updated to dummy successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
