import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/messages/[id]/reactions - Get reactions for a message
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
        const messageId = parseInt(id);

        const reactions = await prisma.reaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        // Group reactions by emoji
        const grouped = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                    userReacted: false
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user);
            if (reaction.userId === payload.userId) {
                acc[reaction.emoji].userReacted = true;
            }
            return acc;
        }, {});

        return NextResponse.json({ reactions: Object.values(grouped) });
    } catch (error) {
        console.error('Get reactions error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/messages/[id]/reactions - Add a reaction
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
        const messageId = parseInt(id);
        const { emoji } = await request.json();

        if (!emoji) {
            return NextResponse.json(
                { error: 'Emoji is required' },
                { status: 400 }
            );
        }

        // Check if reaction already exists
        const existing = await prisma.reaction.findFirst({
            where: {
                userId: payload.userId,
                messageId,
                emoji
            }
        });

        if (existing) {
            // Remove reaction (toggle off)
            await prisma.reaction.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ removed: true, emoji });
        }

        // Add new reaction
        const reaction = await prisma.reaction.create({
            data: {
                emoji,
                userId: payload.userId,
                messageId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        return NextResponse.json({ reaction, added: true });
    } catch (error) {
        console.error('Add reaction error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
