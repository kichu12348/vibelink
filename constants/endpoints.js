import { io } from "socket.io-client";

const endPoint = "https://vibelink.onthewifi.com"; 

const socket = io(endPoint);

export { endPoint, socket};