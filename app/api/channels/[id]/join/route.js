import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/channels/[id]/join - Join a channel
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

        const channel = await prisma.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found' },
                { status: 404 }
            );
        }

        // Check if already a member
        const existingMembership = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: payload.userId
                }
            }
        });

        if (existingMembership) {
            return NextResponse.json(
                { error: 'Already a member of this channel' },
                { status: 409 }
            );
        }

        // Add user to channel
        await prisma.channelMember.create({
            data: {
                channelId,
                userId: payload.userId
            }
        });

        return NextResponse.json({ message: 'Joined channel successfully' });
    } catch (error) {
        console.error('Join channel error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
