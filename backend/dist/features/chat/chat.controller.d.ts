import { Request, Response } from "express";
export declare function handleCreateSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleListMySessions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleListActiveSessions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleGetSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleSendMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleMarkRead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleCloseSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=chat.controller.d.ts.map