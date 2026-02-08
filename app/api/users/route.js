import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/users - Get all users
export async function GET(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                displayName: 'asc'
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
