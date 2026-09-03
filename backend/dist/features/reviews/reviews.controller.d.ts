import { Request, Response } from "express";
export declare function handleCreateReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleListMyReviews(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleListProductReviews(req: Request, res: Response): Promise<void>;
export declare function handleAdminListReviews(req: Request, res: Response): Promise<void>;
export declare function handleAdminGetReview(req: Request, res: Response): Promise<void>;
export declare function handleAdminApproveReview(req: Request, res: Response): Promise<void>;
export declare function handleAdminRejectReview(req: Request, res: Response): Promise<void>;
export declare function handleAdminUnapproveReview(req: Request, res: Response): Promise<void>;
export declare function handleAdminDeleteReview(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=reviews.controller.d.ts.map