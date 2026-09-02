import { Request, Response } from "express";
export declare function handleListProducts(req: Request, res: Response): Promise<void>;
export declare function handleListCategories(_req: Request, res: Response): Promise<void>;
export declare function handleGetProductBySlug(req: Request<{
    slug: string;
}>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=products.controller.d.ts.map