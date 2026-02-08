const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store connected users
const connectedUsers = new Map();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // User joins with their ID
        socket.on('user-join', (userId) => {
            connectedUsers.set(socket.id, userId);
            socket.userId = userId;

            // Broadcast user online status
            io.emit('user-online', userId);
            console.log(`User ${userId} is now online`);
        });

        // Join a channel room
        socket.on('join-channel', (channelId) => {
            socket.join(`channel-${channelId}`);
            console.log(`Socket ${socket.id} joined channel-${channelId}`);
        });

        // Leave a channel room
        socket.on('leave-channel', (channelId) => {
            socket.leave(`channel-${channelId}`);
        });

        // Join DM room
        socket.on('join-dm', (recipientId) => {
            const roomId = [socket.userId, recipientId].sort().join('-');
            socket.join(`dm-${roomId}`);
        });

        // New message in channel
        socket.on('channel-message', (data) => {
            io.to(`channel-${data.channelId}`).emit('new-message', data);
        });

        // New direct message
        socket.on('dm-message', (data) => {
            const roomId = [data.senderId, data.recipientId].sort().join('-');
            io.to(`dm-${roomId}`).emit('new-dm', data);
        });

        // Typing indicator
        socket.on('typing-start', (data) => {
            if (data.channelId) {
                socket.to(`channel-${data.channelId}`).emit('user-typing', {
                    userId: socket.userId,
                    channelId: data.channelId
                });
            } else if (data.recipientId) {
                const roomId = [socket.userId, data.recipientId].sort().join('-');
                socket.to(`dm-${roomId}`).emit('user-typing', {
                    userId: socket.userId
                });
            }
        });

        socket.on('typing-stop', (data) => {
            if (data.channelId) {
                socket.to(`channel-${data.channelId}`).emit('user-stopped-typing', {
                    userId: socket.userId,
                    channelId: data.channelId
                });
            }
        });

        // Reaction added
        socket.on('reaction-added', (data) => {
            if (data.channelId) {
                io.to(`channel-${data.channelId}`).emit('new-reaction', data);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            const userId = connectedUsers.get(socket.id);
            if (userId) {
                connectedUsers.delete(socket.id);
                io.emit('user-offline', userId);
                console.log(`User ${userId} is now offline`);
            }
            console.log('Client disconnected:', socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
