import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.updateMany({
    where: { name: 'Heineken Long Neck' },
    data: { image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Heineken_bottle.png/300px-Heineken_bottle.png' }
  });

  await prisma.product.updateMany({
    where: { name: 'Água Mineral Sem Gás' },
    data: { image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bottle_of_water.jpg/300px-Bottle_of_water.jpg' }
  });

  console.log("Images updated successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
