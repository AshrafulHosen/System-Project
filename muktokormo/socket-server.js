const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.SOCKET_PORT || 3001;

const server = http.createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify({ status: "ok", service: "MuktoKormo Real-Time Workspace Server", port: PORT }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory active presence & room states
const activeRooms = new Map(); // roomId -> Set of users { id, name, role }
const messageHistory = new Map(); // roomId -> Array of messages

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // User joins a contract or message conversation room
  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.data.user = user;
    socket.data.roomId = roomId;

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Map());
    }
    const roomUsers = activeRooms.get(roomId);
    if (user && user.id) {
      roomUsers.set(user.id, { socketId: socket.id, ...user });
    }

    console.log(`[Socket.IO] ${user?.name || socket.id} joined room: ${roomId}`);

    // Broadcast current online room members
    const onlineList = Array.from(roomUsers.values());
    io.to(roomId).emit("room_presence", onlineList);

    // Send recent room message history if available
    if (messageHistory.has(roomId)) {
      socket.emit("message_history", messageHistory.get(roomId));
    }
  });

  // User leaves a room
  socket.on("leave_room", ({ roomId, user }) => {
    socket.leave(roomId);
    if (activeRooms.has(roomId) && user?.id) {
      const roomUsers = activeRooms.get(roomId);
      roomUsers.delete(user.id);
      io.to(roomId).emit("room_presence", Array.from(roomUsers.values()));
    }
  });

  // Real-time message exchange
  socket.on("send_message", (messageData) => {
    const { roomId, message } = messageData;
    if (!roomId || !message) return;

    const fullMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sender: message.sender || "Anonymous",
      senderId: message.senderId,
      time: message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: message.text,
      isClient: Boolean(message.isClient),
      attachments: message.attachments || [],
      createdAt: new Date().toISOString(),
    };

    // Store in history (last 50 messages)
    if (!messageHistory.has(roomId)) {
      messageHistory.set(roomId, []);
    }
    const history = messageHistory.get(roomId);
    history.push(fullMessage);
    if (history.length > 50) history.shift();

    console.log(`[Socket.IO] Broadcast message in ${roomId} from ${fullMessage.sender}`);
    // Broadcast to everyone in the room including sender for confirmation
    io.to(roomId).emit("receive_message", fullMessage);
  });

  // Typing indicators
  socket.on("typing", ({ roomId, user }) => {
    socket.to(roomId).emit("user_typing", user);
  });

  socket.on("stop_typing", ({ roomId, user }) => {
    socket.to(roomId).emit("user_stop_typing", user);
  });

  // Live workspace collaboration events (milestone submitted, approved, revision requested)
  socket.on("milestone_event", ({ roomId, eventType, milestone, updatedBy }) => {
    console.log(`[Socket.IO] Milestone event '${eventType}' in ${roomId} by ${updatedBy?.name}`);
    io.to(roomId).emit("milestone_updated", {
      eventType,
      milestone,
      updatedBy,
      timestamp: new Date().toISOString(),
    });
  });

  // Live bid acceptance event: unlocks real-time messaging for this conversation
  socket.on("accept_bid", ({ roomId, threadId, acceptedBy, bidAmountBdt, freelancerName }) => {
    console.log(`[Socket.IO] Bid accepted in ${roomId} by ${acceptedBy?.name} for ৳${bidAmountBdt}`);

    const systemMsg = {
      id: `sys-${Date.now()}`,
      sender: "MuktoKormo Escrow Safe",
      senderId: "system",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `🎉 Bid of ৳${(bidAmountBdt || 0).toLocaleString()} BDT accepted by ${acceptedBy?.name || "Client"}! Real-time messaging and contract workspace are now unlocked.`,
      isClient: true,
      isSystem: true,
      createdAt: new Date().toISOString(),
    };

    if (!messageHistory.has(roomId)) {
      messageHistory.set(roomId, []);
    }
    messageHistory.get(roomId).push(systemMsg);

    io.to(roomId).emit("bid_accepted", {
      threadId,
      acceptedBy,
      bidAmountBdt,
      freelancerName,
      systemMessage: systemMsg,
      timestamp: new Date().toISOString(),
    });
    io.to(roomId).emit("receive_message", systemMsg);
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    const roomId = socket.data.roomId;
    const user = socket.data.user;

    if (roomId && activeRooms.has(roomId) && user?.id) {
      const roomUsers = activeRooms.get(roomId);
      roomUsers.delete(user.id);
      io.to(roomId).emit("room_presence", Array.from(roomUsers.values()));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[MuktoKormo] Real-Time Socket.IO Server running on port ${PORT}`);
});
