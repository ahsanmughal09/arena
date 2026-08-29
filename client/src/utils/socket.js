import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000' 
    : 'https://server-whc0.onrender.com'
);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true
});
