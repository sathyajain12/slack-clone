import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/profile - Get current user profile
export async function GET(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/profile - Update current user profile
export async function PUT(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { displayName, status, avatarUrl } = body;

        // Validate display name
        if (displayName !== undefined) {
            if (!displayName.trim() || displayName.length < 2 || displayName.length > 50) {
                return NextResponse.json(
                    { error: 'Display name must be between 2 and 50 characters' },
                    { status: 400 }
                );
            }
        }

        // Validate status
        const validStatuses = ['online', 'away', 'offline'];
        if (status !== undefined && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be online, away, or offline' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName.trim();
        if (status !== undefined) updateData.status = status;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
