import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

const connections: any = {};

io.on('connection', (socket: Socket) => {
  socket.on('create_user', (username) => {
    const users = Object.values(connections);
    if(users.includes(username)) {
      return socket.emit('create_user:error', 'This username is not available')
    }
    connections[socket.id] = username;

    console.log(`created user ${socket.id}: ${username}`)

    return socket.emit('create_user:success', username);
  });

  socket.on('create_room', () => {
    const roomId = uuidv4();
    return socket.emit('create_room:success', roomId);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.emit('join_room:success', roomId);
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || [];
    const users = Array.from(socketsInRoom.values()).map(socketId => {
      return connections[socketId]
    })

    console.log(`${socket.id} joined room ${roomId}`)

    return io.to(roomId).emit('users', users);
  })

  socket.on('message', ({ room, username, message }) => {
    io.to(room).emit('message', { username, message })
  })

  socket.on('disconnecting', () => {
    console.log(`user disconnecting: ${connections[socket.id]}`)
    
    delete connections[socket.id];
    
    const userRooms = Array.from(socket.rooms.values())
    
    userRooms.forEach(roomId => {
      socket.leave(roomId);
      const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || [];
      const users = Array.from(socketsInRoom.values()).map(socketId => {
        return connections[socketId]
      })
      io.to(roomId).emit('users', users);
    })
  })
})

httpServer.listen(3000)