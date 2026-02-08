require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// COE team members to seed
const teamMembers = [
    { username: 'controller', displayName: 'Dr. Controller', role: 'admin' },
    { username: 'deputy_controller', displayName: 'Deputy Controller', role: 'admin' },
    { username: 'exam_officer1', displayName: 'Exam Officer - Section A', role: 'member' },
    { username: 'exam_officer2', displayName: 'Exam Officer - Section B', role: 'member' },
    { username: 'data_entry1', displayName: 'Data Entry Operator 1', role: 'member' },
    { username: 'data_entry2', displayName: 'Data Entry Operator 2', role: 'member' },
    { username: 'results_mgr', displayName: 'Results Manager', role: 'member' },
    { username: 'certificate_mgr', displayName: 'Certificate Manager', role: 'member' },
    { username: 'records_clerk', displayName: 'Records Clerk', role: 'member' },
    { username: 'dispatch_officer', displayName: 'Dispatch Officer', role: 'member' },
    { username: 'front_desk1', displayName: 'Front Desk Executive 1', role: 'member' },
    { username: 'front_desk2', displayName: 'Front Desk Executive 2', role: 'member' },
];

// Default channels to create
const defaultChannels = [
    { name: 'general', description: 'General discussions for the COE team' },
    { name: 'announcements', description: 'Important announcements and updates' },
    { name: 'exam-schedules', description: 'Examination scheduling discussions' },
    { name: 'results-processing', description: 'Results compilation and processing' },
    { name: 'certificate-issues', description: 'Certificate printing and distribution' },
    { name: 'technical-support', description: 'IT and technical issues' },
];

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Create users
    console.log('👥 Creating team members...');
    const defaultPassword = await bcrypt.hash('password123', 12);

    for (const member of teamMembers) {
        const existingUser = await prisma.user.findUnique({
            where: { username: member.username }
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    username: member.username,
                    displayName: member.displayName,
                    password: defaultPassword,
                    role: member.role,
                    status: 'offline'
                }
            });
            console.log(`  ✅ Created: ${member.displayName}`);
        } else {
            console.log(`  ⏭️  Skipped: ${member.displayName} (already exists)`);
        }
    }

    // Get the controller user for creating channels
    const controller = await prisma.user.findUnique({
        where: { username: 'controller' }
    });

    if (!controller) {
        console.log('\n❌ Controller user not found. Cannot create channels.');
        return;
    }

    // Create default channels
    console.log('\n📢 Creating default channels...');

    for (const channelData of defaultChannels) {
        const existingChannel = await prisma.channel.findUnique({
            where: { name: channelData.name }
        });

        if (!existingChannel) {
            const channel = await prisma.channel.create({
                data: {
                    name: channelData.name,
                    description: channelData.description,
                    createdById: controller.id,
                }
            });

            // Add all users to general and announcements channels
            if (channelData.name === 'general' || channelData.name === 'announcements') {
                const allUsers = await prisma.user.findMany();
                for (const user of allUsers) {
                    await prisma.channelMember.create({
                        data: {
                            channelId: channel.id,
                            userId: user.id
                        }
                    });
                }
                console.log(`  ✅ Created: #${channelData.name} (all members added)`);
            } else {
                // Just add the controller
                await prisma.channelMember.create({
                    data: {
                        channelId: channel.id,
                        userId: controller.id
                    }
                });
                console.log(`  ✅ Created: #${channelData.name}`);
            }
        } else {
            console.log(`  ⏭️  Skipped: #${channelData.name} (already exists)`);
        }
    }

    // Add a welcome message to general
    const generalChannel = await prisma.channel.findUnique({
        where: { name: 'general' }
    });

    if (generalChannel) {
        const existingMessage = await prisma.message.findFirst({
            where: { channelId: generalChannel.id }
        });

        if (!existingMessage) {
            await prisma.message.create({
                data: {
                    content: '👋 Welcome to COE Messenger! This is the official communication platform for the Controller of Examination section. Feel free to use this space for team discussions.',
                    senderId: controller.id,
                    channelId: generalChannel.id
                }
            });
            console.log('\n💬 Added welcome message to #general');
        }
    }

    console.log('\n✨ Database seed completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials for all users:');
    console.log('  Password: password123');
    console.log('  Usernames: controller, deputy_controller, exam_officer1, etc.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
