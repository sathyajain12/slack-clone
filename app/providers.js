'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SocketProvider } from '@/context/SocketContext';

export function Providers({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SocketProvider>
                    <ChatProvider>
                        {children}
                    </ChatProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
