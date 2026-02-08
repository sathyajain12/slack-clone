import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/channels - Get all channels
export async function GET(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const channels = await prisma.channel.findMany({
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
                                displayName: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json({ channels });
    } catch (error) {
        console.error('Get channels error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/channels - Create a new channel
export async function POST(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { name, description, isPrivate } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'Channel name is required' },
                { status: 400 }
            );
        }

        // Normalize channel name (lowercase, no spaces)
        const normalizedName = name.toLowerCase().replace(/\s+/g, '-');

        // Check if channel already exists
        const existingChannel = await prisma.channel.findUnique({
            where: { name: normalizedName }
        });

        if (existingChannel) {
            return NextResponse.json(
                { error: 'Channel with this name already exists' },
                { status: 409 }
            );
        }

        // Create channel and add creator as member
        const channel = await prisma.channel.create({
            data: {
                name: normalizedName,
                description: description || null,
                isPrivate: isPrivate || false,
                createdById: payload.userId,
                members: {
                    create: {
                        userId: payload.userId
                    }
                }
            },
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
                                displayName: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ channel }, { status: 201 });
    } catch (error) {
        console.error('Create channel error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
