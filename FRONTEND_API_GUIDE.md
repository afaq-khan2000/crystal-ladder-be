# Chat System - Frontend Integration API Guide

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [REST API Endpoints](#rest-api-endpoints)
3. [Socket.io WebSocket Integration](#socketio-websocket-integration)
4. [Request/Response Examples](#requestresponse-examples)
5. [Error Handling](#error-handling)
6. [Integration Code Examples](#integration-code-examples)

---

## 🔐 Authentication

All API endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

**How to get the token:**
1. User logs in via `/auth/login` endpoint
2. Backend returns JWT token
3. Store token in localStorage/sessionStorage
4. Include token in all subsequent requests

---

## 🌐 REST API Endpoints

Base URL: `http://localhost:3000` (or your server URL)

### 1. Get Chat History

**Endpoint:** `GET /messages/chat-history`

**Description:** Retrieve paginated chat history. Parents get their own chat, Admin can get chat with specific user.

**Query Parameters:**
- `page` (optional, number): Page number, default: 1
- `limit` (optional, number): Items per page, default: 50
- `userId` (optional, number, admin only): Get chat with specific user

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**cURL Example (Parent):**
```bash
curl -X GET "http://localhost:3000/messages/chat-history?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**cURL Example (Admin - specific user):**
```bash
curl -X GET "http://localhost:3000/messages/chat-history?userId=123&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "content": "Hello, I need help with my appointment",
      "subject": null,
      "type": "direct",
      "isRead": true,
      "senderId": 123,
      "receiverId": 456,
      "attachments": [],
      "readAt": "2025-11-16T10:30:00.000Z",
      "createdAt": "2025-11-16T10:00:00.000Z",
      "updatedAt": "2025-11-16T10:30:00.000Z",
      "sender": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "parent"
      },
      "receiver": {
        "id": 456,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

### 2. Send Message (REST API)

**Endpoint:** `POST /messages/send`

**Description:** Send a message via REST API (alternative to Socket.io). Parents send to admin, Admin must specify receiverId.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello, I need help",
  "receiverId": 456,
  "attachments": ["https://example.com/file1.pdf"]
}
```

**Body Parameters:**
- `content` (required, string): Message content
- `receiverId` (optional for parent, required for admin, number): Receiver user ID
- `attachments` (optional, array of strings): Array of attachment URLs

**cURL Example (Parent):**
```bash
curl -X POST "http://localhost:3000/messages/send" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, I need help with my child appointment",
    "attachments": []
  }'
```

**cURL Example (Admin):**
```bash
curl -X POST "http://localhost:3000/messages/send" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how can I help you?",
    "receiverId": 123,
    "attachments": []
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 789,
    "content": "Hello, I need help with my child appointment",
    "senderId": 123,
    "receiverId": null,
    "isRead": false,
    "attachments": [],
    "createdAt": "2025-11-16T11:00:00.000Z",
    "sender": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 3. Get Unread Message Count

**Endpoint:** `GET /messages/unread-count`

**Description:** Get the count of unread messages for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/messages/unread-count" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### 4. Get Unread Counts by Users (Admin Only)

**Endpoint:** `GET /messages/unread-counts-by-users`

**Description:** Get unread message counts for all users (Admin only). Used to show which users have unread messages.

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/messages/unread-counts-by-users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": 123,
      "unreadCount": 3,
      "user": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "parent",
        "profileImage": "https://example.com/avatar.jpg"
      }
    },
    {
      "userId": 124,
      "unreadCount": 7,
      "user": {
        "id": 124,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "role": "parent",
        "profileImage": "https://example.com/avatar2.jpg"
      }
    }
  ]
}
```

---

### 5. Mark Message as Read

**Endpoint:** `POST /messages/mark-read/:messageId`

**Description:** Mark a specific message as read. Only the receiver can mark their messages as read.

**URL Parameters:**
- `messageId` (required, number): The ID of the message to mark as read

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/messages/mark-read/789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "id": 789,
    "content": "Hello, I need help",
    "isRead": true,
    "readAt": "2025-11-16T11:05:00.000Z"
  }
}
```

---

### 6. Delete Single Message

**Endpoint:** `DELETE /messages/:messageId`

**Description:** Delete a specific message (soft delete). Only the sender or admin can delete messages.

**URL Parameters:**
- `messageId` (required, number): The ID of the message to delete

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/messages/789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### 7. Delete Chat History

**Endpoint:** `DELETE /messages/chat-history`

**Description:** Delete entire chat history (soft delete). Parents delete their own chat, Admin must specify userId.

**Query Parameters:**
- `userId` (optional, number, admin only): Delete chat with specific user

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example (Parent):**
```bash
curl -X DELETE "http://localhost:3000/messages/chat-history" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**cURL Example (Admin):**
```bash
curl -X DELETE "http://localhost:3000/messages/chat-history?userId=123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Chat history deleted successfully"
}
```

---

### 8. Get All Messages (Admin Only)

**Endpoint:** `GET /messages/all`

**Description:** Get all messages including announcements and newsletters (Admin only).

**Query Parameters:**
- `page` (optional, number): Page number, default: 1
- `limit` (optional, number): Items per page, default: 10

**Headers:**
```
Authorization: Bearer <token>
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/messages/all?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔌 Socket.io WebSocket Integration

### Connection Setup

**Namespace:** `/chat`

**Connection URL:** `http://localhost:3000/chat`

**Required Query Parameters:**
- `userId`: Current user's ID
- `userRole`: User's role (`parent` or `admin`)

### JavaScript Example:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  query: {
    userId: 123,
    userRole: 'parent'
  }
});

// Connection established
socket.on('connect', () => {
  console.log('Connected to chat server');
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Disconnected
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

---

## 📡 Socket.io Events

### Events to EMIT (Client → Server)

#### 1. `send_message` (Parent/User)

**Description:** Parent sends message to admin

**Payload:**
```javascript
{
  content: "Hello, I need help",
  attachments: ["https://example.com/file.pdf"]
}
```

**Example:**
```javascript
socket.emit('send_message', {
  content: 'Hello, I need help with my appointment',
  attachments: []
}, (response) => {
  console.log('Response:', response);
  // response: { success: true, message: {...} }
});
```

---

#### 2. `admin_send_message` (Admin Only)

**Description:** Admin sends message to specific user

**Payload:**
```javascript
{
  content: "Hello, how can I help you?",
  receiverId: 123,
  attachments: []
}
```

**Example:**
```javascript
socket.emit('admin_send_message', {
  content: 'Hello, how can I help you?',
  receiverId: 123,
  attachments: []
}, (response) => {
  console.log('Response:', response);
});
```

---

#### 3. `message_read`

**Description:** Mark message as read

**Payload:**
```javascript
{
  messageId: 789
}
```

**Example:**
```javascript
socket.emit('message_read', {
  messageId: 789
}, (response) => {
  console.log('Response:', response);
});
```

---

#### 4. `typing_start`

**Description:** User started typing

**Payload:**
```javascript
{
  isTyping: true,
  receiverId: 123  // Required for admin
}
```

**Example (Parent):**
```javascript
socket.emit('typing_start', {
  isTyping: true
});
```

**Example (Admin):**
```javascript
socket.emit('typing_start', {
  isTyping: true,
  receiverId: 123
});
```

---

#### 5. `typing_stop`

**Description:** User stopped typing

**Payload:**
```javascript
{
  isTyping: false,
  receiverId: 123  // Required for admin
}
```

**Example:**
```javascript
socket.emit('typing_stop', {
  isTyping: false
});
```

---

#### 6. `get_unread_count`

**Description:** Get unread message count

**Example:**
```javascript
socket.emit('get_unread_count', {}, (response) => {
  console.log('Unread count:', response.unreadCount);
  // response: { success: true, unreadCount: 5 }
});
```

---

#### 7. `get_all_unread_counts` (Admin Only)

**Description:** Get unread counts for all users

**Example:**
```javascript
socket.emit('get_all_unread_counts', {}, (response) => {
  console.log('All unread counts:', response.unreadCounts);
  // response: { success: true, unreadCounts: [...] }
});
```

---

### Events to LISTEN (Server → Client)

#### 1. `new_message`

**Description:** New message received

**Payload:**
```javascript
{
  message: {
    id: 789,
    content: "Hello",
    senderId: 123,
    receiverId: 456,
    isRead: false,
    attachments: [],
    createdAt: "2025-11-16T11:00:00.000Z",
    sender: {
      id: 123,
      firstName: "John",
      lastName: "Doe"
    }
  },
  senderId: 123,
  senderRole: "parent"
}
```

**Example:**
```javascript
socket.on('new_message', (data) => {
  console.log('New message received:', data.message);
  // Add message to your chat UI
  addMessageToUI(data.message);
});
```

---

#### 2. `message_read_receipt`

**Description:** Message has been read by recipient

**Payload:**
```javascript
{
  messageId: 789,
  readBy: 456,
  readAt: "2025-11-16T11:05:00.000Z"
}
```

**Example:**
```javascript
socket.on('message_read_receipt', (data) => {
  console.log('Message read:', data.messageId);
  // Update message status in UI (show double checkmark)
  updateMessageStatus(data.messageId, 'read');
});
```

---

#### 3. `user_typing` (Admin receives)

**Description:** User is typing

**Payload:**
```javascript
{
  userId: 123,
  isTyping: true
}
```

**Example:**
```javascript
socket.on('user_typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

---

#### 4. `admin_typing_start` (User receives)

**Description:** Admin started typing

**Payload:**
```javascript
{
  adminId: 456
}
```

**Example:**
```javascript
socket.on('admin_typing_start', (data) => {
  showTypingIndicator();
});
```

---

#### 5. `admin_typing_stop` (User receives)

**Description:** Admin stopped typing

**Payload:**
```javascript
{
  adminId: 456
}
```

**Example:**
```javascript
socket.on('admin_typing_stop', (data) => {
  hideTypingIndicator();
});
```

---

#### 6. `unread_count`

**Description:** Updated unread count

**Payload:**
```javascript
{
  count: 7,
  timestamp: "2025-11-16T11:10:00.000Z"
}
```

**Example:**
```javascript
socket.on('unread_count', (data) => {
  updateUnreadBadge(data.count);
});
```

---

#### 7. `message_deleted`

**Description:** Message was deleted

**Payload:**
```javascript
{
  messageId: 789,
  timestamp: "2025-11-16T11:15:00.000Z"
}
```

**Example:**
```javascript
socket.on('message_deleted', (data) => {
  removeMessageFromUI(data.messageId);
});
```

---

#### 8. `user_connected` (Admin receives)

**Description:** User connected to chat

**Payload:**
```javascript
{
  userId: 123,
  timestamp: "2025-11-16T11:00:00.000Z"
}
```

**Example:**
```javascript
socket.on('user_connected', (data) => {
  showUserOnline(data.userId);
});
```

---

#### 9. `user_disconnected` (Admin receives)

**Description:** User disconnected from chat

**Payload:**
```javascript
{
  userId: 123,
  timestamp: "2025-11-16T11:30:00.000Z"
}
```

**Example:**
```javascript
socket.on('user_disconnected', (data) => {
  showUserOffline(data.userId);
});
```

---

## 🚨 Error Handling

### HTTP Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Unauthorized access",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Message not found",
  "error": "Not Found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 💻 Integration Code Examples

### React Hook Example

```typescript
// hooks/useChat.ts
import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number | null;
  isRead: boolean;
  createdAt: string;
  sender: any;
}

export const useChat = (userId: number, userRole: string, token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to socket
    const newSocket = io('http://localhost:3000/chat', {
      query: {
        userId,
        userRole
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat');
    });

    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('admin_typing_start', () => {
      setIsTyping(true);
    });

    newSocket.on('admin_typing_stop', () => {
      setIsTyping(false);
    });

    newSocket.on('unread_count', (data) => {
      setUnreadCount(data.count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, userRole]);

  const sendMessage = useCallback((content: string, attachments: string[] = []) => {
    if (socket && content.trim()) {
      socket.emit('send_message', {
        content,
        attachments
      }, (response) => {
        if (response.success) {
          setMessages(prev => [...prev, response.message]);
        }
      });
    }
  }, [socket]);

  const startTyping = useCallback(() => {
    socket?.emit('typing_start', { isTyping: true });
  }, [socket]);

  const stopTyping = useCallback(() => {
    socket?.emit('typing_stop', { isTyping: false });
  }, [socket]);

  return {
    messages,
    isConnected,
    isTyping,
    unreadCount,
    sendMessage,
    startTyping,
    stopTyping
  };
};
```

### React Component Example

```typescript
// components/ChatWindow.tsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

interface ChatWindowProps {
  userId: number;
  userRole: string;
  token: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ userId, userRole, token }) => {
  const [inputMessage, setInputMessage] = useState('');
  const {
    messages,
    isConnected,
    isTyping,
    unreadCount,
    sendMessage,
    startTyping,
    stopTyping
  } = useChat(userId, userRole, token);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat with Admin</h3>
        <span className={isConnected ? 'status-online' : 'status-offline'}>
          {isConnected ? '● Online' : '○ Offline'}
        </span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">Admin is typing...</div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onFocus={startTyping}
          onBlur={stopTyping}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### Fetch Chat History Example

```typescript
// utils/chatApi.ts
const API_URL = 'http://localhost:3000';

export const fetchChatHistory = async (
  token: string,
  page: number = 1,
  limit: number = 50,
  userId?: number
) => {
  try {
    let url = `${API_URL}/messages/chat-history?page=${page}&limit=${limit}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

export const getUnreadCount = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/messages/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.data.unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

export const deleteMessage = async (token: string, messageId: number) => {
  try {
    const response = await fetch(`${API_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
```

### Admin Dashboard - User List with Unread Count

```typescript
// components/AdminUserList.tsx
import React, { useEffect, useState } from 'react';

interface UserWithUnread {
  userId: number;
  unreadCount: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
  };
}

export const AdminUserList: React.FC<{ token: string; onSelectUser: (userId: number) => void }> = ({ 
  token, 
  onSelectUser 
}) => {
  const [users, setUsers] = useState<UserWithUnread[]>([]);

  useEffect(() => {
    fetchUsersWithUnreadCount();
  }, []);

  const fetchUsersWithUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:3000/messages/unread-counts-by-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div className="user-list">
      <h3>Users with Messages</h3>
      {users.map((userWithUnread) => (
        <div
          key={userWithUnread.userId}
          className="user-item"
          onClick={() => onSelectUser(userWithUnread.userId)}
        >
          <img
            src={userWithUnread.user.profileImage || '/default-avatar.png'}
            alt={`${userWithUnread.user.firstName} avatar`}
            className="user-avatar"
          />
          <div className="user-info">
            <div className="user-name">
              {userWithUnread.user.firstName} {userWithUnread.user.lastName}
            </div>
            <div className="user-email">{userWithUnread.user.email}</div>
          </div>
          {userWithUnread.unreadCount > 0 && (
            <span className="unread-badge">{userWithUnread.unreadCount}</span>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 📝 Important Notes

### 1. Message Flow

**Parent → Admin:**
- Parent emits `send_message` (no receiverId needed)
- Admin receives via `new_message` event
- Message saved with `receiverId = null`

**Admin → Parent:**
- Admin emits `admin_send_message` with `receiverId`
- Parent receives via `new_message` event
- Message saved with specific `receiverId`

### 2. Typing Indicators

- Set timeout to automatically stop typing after 3-5 seconds of inactivity
- Clear timeout on each keystroke
- Send `typing_stop` when input loses focus

### 3. Read Receipts

- Automatically mark messages as read when they're displayed
- Show single checkmark (✓) for sent
- Show double checkmark (✓✓) for read

### 4. Reconnection

Implement reconnection logic:
```javascript
socket.on('disconnect', () => {
  // Try to reconnect
  setTimeout(() => {
    socket.connect();
  }, 1000);
});
```

### 5. Performance

- Load chat history on component mount
- Use pagination for large chat histories
- Implement virtual scrolling for long message lists
- Cache messages in local state

---

## 🎨 UI/UX Recommendations

1. **Show connection status** - Indicate when user is online/offline
2. **Typing indicators** - Show "Admin is typing..." animation
3. **Message status icons** - ✓ (sent), ✓✓ (read)
4. **Unread badge** - Show count on chat icon
5. **Timestamps** - Group messages by date
6. **Auto-scroll** - Scroll to bottom on new message
7. **Sound notification** - Play sound on new message
8. **Desktop notification** - Show browser notification when tab is inactive

---

## 🔧 Testing Checklist

- [ ] User can connect to Socket.io
- [ ] User can send message via Socket.io
- [ ] User can send message via REST API
- [ ] Admin sees unread count for each user
- [ ] Typing indicators work correctly
- [ ] Messages marked as read automatically
- [ ] Read receipts update in real-time
- [ ] User can delete single message
- [ ] User can delete entire chat history
- [ ] Pagination works correctly
- [ ] Error handling displays user-friendly messages
- [ ] Reconnection works after network interruption

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify JWT token is valid
3. Ensure server is running
4. Check network tab in browser DevTools
5. Review CORS settings

---

**Last Updated:** November 16, 2025  
**API Version:** 1.0.0  
**Backend:** NestJS + Socket.io + TypeORM + PostgreSQL

