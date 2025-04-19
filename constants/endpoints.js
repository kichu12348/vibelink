import { io } from "socket.io-client";

const endPoint = "https://vibelink.kichu.space";

const socket = io(endPoint);

export { endPoint, socket };
