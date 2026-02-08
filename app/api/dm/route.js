import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/dm - Get all DM conversations for current user
export async function GET(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get all users the current user has exchanged messages with
        const sentMessages = await prisma.directMessage.findMany({
            where: { senderId: payload.userId },
            select: { recipientId: true },
            distinct: ['recipientId']
        });

        const receivedMessages = await prisma.directMessage.findMany({
            where: { recipientId: payload.userId },
            select: { senderId: true },
            distinct: ['senderId']
        });

        // Get unique user IDs
        const userIds = new Set([
            ...sentMessages.map(m => m.recipientId),
            ...receivedMessages.map(m => m.senderId)
        ]);

        // Get user details and last message for each conversation
        const conversations = await Promise.all(
            Array.from(userIds).map(async (userId) => {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        status: true
                    }
                });

                const lastMessage = await prisma.directMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: payload.userId, recipientId: userId },
                            { senderId: userId, recipientId: payload.userId }
                        ]
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const unreadCount = await prisma.directMessage.count({
                    where: {
                        senderId: userId,
                        recipientId: payload.userId,
                        isRead: false
                    }
                });

                return {
                    user,
                    lastMessage,
                    unreadCount
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Get DM conversations error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
