import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI } from 'otplib';

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

    console.log('🌱 Seeding default users...');

    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    const officerRole = await prisma.role.findUnique({ where: { name: 'OFFICER' } });

    if (!superAdminRole || !officerRole) {
        throw new Error('Roles not found');
    }

    const defaultAccounts = [
        {
            email: 'superadmin@police.gov',
            roleId: superAdminRole.id,
            policeId: 'SA-001',
            fullName: 'Super Administrator',
        },
        {
            email: 'officer@police.gov',
            roleId: officerRole.id,
            policeId: 'OF-001',
            fullName: 'Default Officer',
        }
    ];

    const generatedSecrets: Record<string, string> = {};

    for (const acc of defaultAccounts) {
        let user = await prisma.user.findUnique({ where: { email: acc.email } });
        let mfaSecret = await prisma.mFASecret.findUnique({ where: { userId: user?.id || '' } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: acc.email,
                    password: hashedPassword,
                    roleId: acc.roleId,
                    isActive: true,
                    policeProfile: {
                        create: {
                            policeId: acc.policeId,
                            fullName: acc.fullName,
                        }
                    }
                }
            });

            // For development consistency, automatically create MFA Secret and enable it
            const secret = generateSecret({ length: 20 });
            mfaSecret = await prisma.mFASecret.create({
                data: { userId: user.id, secret, isEnabled: true }
            });
            generatedSecrets[acc.email] = secret;
        } else {
            // Update existing users to use the new development password
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            
            if (!mfaSecret) {
                const secret = generateSecret({ length: 20 });
                mfaSecret = await prisma.mFASecret.create({
                    data: { userId: user.id, secret, isEnabled: true }
                });
            }
            generatedSecrets[acc.email] = mfaSecret.secret;
        }
    }

    console.log('✅ Users seeded successfully');
    console.log('\n--- Default Credentials ---');
    console.log(`Password for all seeded accounts: ${defaultPassword}`);
    
    for (const acc of defaultAccounts) {
        console.log(`\nAccount: ${acc.email}`);
        const secret = generatedSecrets[acc.email];
        const otpauthUrl = generateURI({ label: acc.email, issuer: 'Chain of Custody FCCMS', secret });
        console.log(`MFA Secret: ${secret}`);
        console.log(`MFA otpauth URL: ${otpauthUrl}`);
    }
    
    console.log('\n(You can copy the otpauth URL and paste it into a QR generator or import it into Google Authenticator/Authy)');
    console.log('---------------------------\n');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });