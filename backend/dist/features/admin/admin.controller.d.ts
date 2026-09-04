import { Request, Response } from "express";
export declare function handleGetDashboardStats(_req: Request, res: Response): Promise<void>;
export declare function handleListOrders(req: Request, res: Response): Promise<void>;
export declare function handleGetOrder(req: Request, res: Response): Promise<void>;
export declare function handleUpdateOrderStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleAdminListProducts(req: Request, res: Response): Promise<void>;
export declare function handleGetProduct(req: Request, res: Response): Promise<void>;
export declare function handleCreateProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleUpdateProduct(req: Request, res: Response): Promise<void>;
export declare function handleDeleteProduct(req: Request, res: Response): Promise<void>;
export declare function handleListCategories(_req: Request, res: Response): Promise<void>;
export declare function handleCreateCategory(req: Request, res: Response): Promise<void>;
export declare function handleUpdateCategory(req: Request, res: Response): Promise<void>;
export declare function handleDeleteCategory(req: Request, res: Response): Promise<void>;
export declare function handleCreateVariant(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function handleUpdateVariant(req: Request, res: Response): Promise<void>;
export declare function handleDeleteVariant(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map