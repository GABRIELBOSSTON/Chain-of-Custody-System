import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding roles...');

    const roles = [
        'SUPER_ADMIN',
        'ADMIN',
        'INVESTIGATOR',
        'OFFICER',
        'AUDITOR',
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role },
        });
    }

    console.log('✅ Roles seeded successfully');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });