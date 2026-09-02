import { Server } from "socket.io";
import http from "http";
interface AuthPayload {
    userId: string;
    email: string;
    role: string;
    type: "access";
}
export declare function verifySocketToken(token: string): AuthPayload | null;
export declare function getIO(): Server;
export declare function initSocket(httpServer: http.Server): Server;
export {};
//# sourceMappingURL=socket.d.ts.map