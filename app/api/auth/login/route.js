import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

// POST /api/auth/login - User login
export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Validate input
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Update user status to online
        await prisma.user.update({
            where: { id: user.id },
            data: { status: 'online' }
        });

        // Create token
        const token = await createToken(user.id, user.username);

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                status: 'online'
            }
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
