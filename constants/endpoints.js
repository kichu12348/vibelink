import { io } from "socket.io-client";

const endPoint = "http://192.168.1.38:3000"; // Replace with your local IP address
const socketEndpoint = "http://192.168.1.38:3000";

const socket = io(socketEndpoint);

export { endPoint, socket};