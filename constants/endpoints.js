import { io } from "socket.io-client";

const endPoint = "https://vibelink.ddns.net"; 

const socket = io(endPoint);

export { endPoint, socket};