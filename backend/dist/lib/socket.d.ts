import { Server } from "socket.io";
import http from "http";
export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
    type: "access";
}
export interface AdminStats {
    totalOrders: number;
    totalRevenue: number;
    ordersToday: number;
    revenueToday: number;
    pendingReviews: number;
    activeChats: number;
    connectedAdmins: number;
}
export declare function verifySocketToken(token: string): AuthPayload | null;
export declare function getIO(): Server;
export declare function computeAdminStats(): Promise<AdminStats>;
export declare function broadcastAdminStats(): Promise<void>;
export declare function initSocket(httpServer: http.Server): Server;
//# sourceMappingURL=socket.d.ts.map