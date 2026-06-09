import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with some products...');
  
  await prisma.product.create({
    data: {
      name: 'Heineken Long Neck',
      price: 12.00,
      image_url: 'https://images.tcdn.com.br/img/img_prod/805175/cerveja_heineken_long_neck_330_ml_5330_1_20201016140026.jpg'
    }
  });

  await prisma.product.create({
    data: {
      name: 'Coca-Cola Lata',
      price: 6.00,
      image_url: 'https://images.tcdn.com.br/img/img_prod/805175/refrigerante_coca_cola_lata_350ml_103_1_20201016140131.jpg'
    }
  });

  await prisma.product.create({
    data: {
      name: 'Água Mineral Sem Gás',
      price: 4.00,
      image_url: 'https://images.tcdn.com.br/img/img_prod/805175/agua_mineral_minalba_sem_gas_510ml_2254_1_20201016140156.jpg'
    }
  });

  console.log('Done seeding!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
