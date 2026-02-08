import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/channels/[id]/messages - Get channel messages
export async function GET(request, { params }) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const channelId = parseInt(id);

        // Get pagination params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const before = searchParams.get('before');

        const whereClause = {
            channelId
        };

        if (before) {
            whereClause.id = {
                lt: parseInt(before)
            };
        }

        const messages = await prisma.message.findMany({
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

        // Reverse to get chronological order
        messages.reverse();

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/channels/[id]/messages - Send a message to channel
export async function POST(request, { params }) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const channelId = parseInt(id);
        const { content, fileUrl } = await request.json();

        if (!content && !fileUrl) {
            return NextResponse.json(
                { error: 'Message content or file is required' },
                { status: 400 }
            );
        }

        // Verify channel exists
        const channel = await prisma.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found' },
                { status: 404 }
            );
        }

        const message = await prisma.message.create({
            data: {
                content: content || '',
                fileUrl: fileUrl || null,
                senderId: payload.userId,
                channelId
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
        console.error('Send message error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
