import { io } from "socket.io-client";

const endPoint = "http://34.47.218.65"; 
const socketEndpoint = "http://34.47.218.65";

const socket = io(socketEndpoint);

export { endPoint, socket};