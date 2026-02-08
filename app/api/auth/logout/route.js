import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/auth/logout - User logout
export async function POST(request) {
    try {
        const payload = await getUserFromRequest(request);

        if (payload) {
            // Update user status to offline
            await prisma.user.update({
                where: { id: payload.userId },
                data: { status: 'offline' }
            });
        }

        // Clear cookie
        const response = NextResponse.json({
            message: 'Logged out successfully'
        });

        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
