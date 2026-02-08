import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

// Hash password for storage
export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

// Compare password with hash
export async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

// Create JWT token
export async function createToken(userId, username) {
    const token = await new SignJWT({ userId, username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

    return token;
}

// Verify JWT token
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

// Get user from request cookies
export async function getUserFromRequest(request) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        return null;
    }

    const payload = await verifyToken(token);
    return payload;
}
