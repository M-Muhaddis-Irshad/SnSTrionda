import { Request, Response } from "express";
export declare function handleRegister(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleRefresh(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleLogout(req: Request, res: Response): void;
export declare function handleMe(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleAdminCheck(req: Request, res: Response): void;
export declare function handleGetAuthImage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.controller.d.ts.map