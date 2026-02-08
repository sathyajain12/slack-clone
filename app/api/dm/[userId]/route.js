import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/dm/[userId] - Get DM messages with a user
export async function GET(request, { params }) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { userId } = await params;
        const otherUserId = parseInt(userId);

        // Get pagination params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const before = searchParams.get('before');

        const whereClause = {
            OR: [
                { senderId: payload.userId, recipientId: otherUserId },
                { senderId: otherUserId, recipientId: payload.userId }
            ]
        };

        if (before) {
            whereClause.id = {
                lt: parseInt(before)
            };
        }

        const messages = await prisma.directMessage.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        status: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Mark messages as read
        await prisma.directMessage.updateMany({
            where: {
                senderId: otherUserId,
                recipientId: payload.userId,
                isRead: false
            },
            data: { isRead: true }
        });

        // Reverse to get chronological order
        messages.reverse();

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Get DM messages error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/dm/[userId] - Send a DM to a user
export async function POST(request, { params }) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { userId } = await params;
        const recipientId = parseInt(userId);
        const { content, fileUrl } = await request.json();

        if (!content && !fileUrl) {
            return NextResponse.json(
                { error: 'Message content or file is required' },
                { status: 400 }
            );
        }

        // Verify recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId }
        });

        if (!recipient) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const message = await prisma.directMessage.create({
            data: {
                content: content || '',
                fileUrl: fileUrl || null,
                senderId: payload.userId,
                recipientId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        status: true
                    }
                }
            }
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Send DM error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
