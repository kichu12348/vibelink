import { io } from "socket.io-client";

const endPoint = "https://vibelink.ddns.net"; 
const socketEndpoint = "https://vibelink.ddns.net";

const socket = io(socketEndpoint);

export { endPoint, socket};