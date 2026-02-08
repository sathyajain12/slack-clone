import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/channels/[id] - Get channel details
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

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                status: true
                            }
                        }
                    }
                }
            }
        });

        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ channel });
    } catch (error) {
        console.error('Get channel error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/channels/[id] - Delete channel
export async function DELETE(request, { params }) {
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

        // Only creator or admin can delete
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (channel.createdById !== payload.userId && user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Not authorized to delete this channel' },
                { status: 403 }
            );
        }

        await prisma.channel.delete({
            where: { id: channelId }
        });

        return NextResponse.json({ message: 'Channel deleted successfully' });
    } catch (error) {
        console.error('Delete channel error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
