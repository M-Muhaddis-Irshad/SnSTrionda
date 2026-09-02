export interface UploadImageInput {
    productId: string;
    file: Express.Multer.File;
    altText?: string;
    displayOrder?: number;
}
export declare class ImageError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function uploadProductImage(input: UploadImageInput): Promise<{
    id: string;
    url: string;
    altText: string | null;
    displayOrder: number;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
    cloudinaryPublicId: string;
}>;
export declare function deleteProductImage(productId: string, imageId: string): Promise<{
    deleted: boolean;
    imageId: string;
    cloudinaryPublicId: string | null;
}>;
//# sourceMappingURL=products.image.service.d.ts.map