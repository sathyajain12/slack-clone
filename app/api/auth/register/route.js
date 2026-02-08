import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

// POST /api/auth/register - Register a new user
export async function POST(request) {
    try {
        const { username, displayName, password, role } = await request.json();

        // Validate input
        if (!username || !displayName || !password) {
            return NextResponse.json(
                { error: 'Username, display name, and password are required' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 409 }
            );
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                displayName,
                password: hashedPassword,
                role: role || 'member',
                status: 'online'
            }
        });

        // Create token
        const token = await createToken(user.id, user.username);

        // Create response with cookie
        const response = NextResponse.json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role
            }
        }, { status: 201 });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
