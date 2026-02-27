import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('https://chat-app-n18j.onrender.com');

function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('message_history', (history) => {
      setMessages(history);
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('update_users', (onlineUsers) => {
      setUsers(onlineUsers);
    });

    socket.on('user_notification', (msg) => {
      setNotification(msg);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('user_typing', (username) => {
      setTypingUser(username);
    });

    socket.on('user_stop_typing', () => {
      setTypingUser('');
    });

    return () => {
      socket.off('message_history');
      socket.off('receive_message');
      socket.off('update_users');
      socket.off('user_notification');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinChat = () => {
    if (username.trim()) {
      socket.emit('user_joined', username);
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const data = {
        username,
        message,
        time: new Date().toLocaleTimeString()
      };
      socket.emit('send_message', data);
      socket.emit('stop_typing');
      setMessage('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', username);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!joined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-white text-2xl font-bold mb-6 text-center">Join Chat</h1>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinChat()}
            className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 outline-none"
          />
          <button
            onClick={joinChat}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Online Users */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <h2 className="text-white font-bold text-lg mb-4">Online Users ({users.length})</h2>
        <div className="space-y-2">
          {users.map((user, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">{user}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 p-4 text-white text-center text-xl font-bold">
          Real-time Chat App
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-blue-600 text-white text-center text-sm py-1">
            {notification}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
            >
              <span className="text-gray-400 text-xs mb-1">{msg.username} • {msg.time}</span>
              <div
                className={`p-3 rounded-lg max-w-xs ${
                  msg.username === username
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUser && (
          <div className="px-4 py-1 text-gray-400 text-sm italic">
            {typingUser} is typing...
          </div>
        )}

        {/* Input */}
        <div className="bg-gray-800 p-4 flex gap-3">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 rounded-lg bg-gray-700 text-white outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;