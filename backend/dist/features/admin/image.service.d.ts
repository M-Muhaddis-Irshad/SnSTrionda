export declare class MediaError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface ImageListParams {
    page: number;
    limit: number;
    category?: string;
    search?: string;
}
export interface CreateImageInput {
    name: string;
    url?: string;
    file?: Express.Multer.File;
    alt?: string;
    category: string;
    active?: boolean;
}
export interface UpdateImageInput {
    name?: string;
    url?: string;
    alt?: string;
    category?: string;
    active?: boolean;
}
export declare function listImages(params: ImageListParams): Promise<{
    data: ({
        _count: {
            campaigns: number;
        };
    } & {
        id: string;
        name: string;
        url: string;
        alt: string | null;
        category: import("../../generated/prisma/enums").SiteMediaCategory;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare function createImage(input: CreateImageInput): Promise<{
    id: string;
    name: string;
    url: string;
    alt: string | null;
    category: import("../../generated/prisma/enums").SiteMediaCategory;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateImage(imageId: string, input: UpdateImageInput): Promise<{
    _count: {
        campaigns: number;
    };
} & {
    id: string;
    name: string;
    url: string;
    alt: string | null;
    category: import("../../generated/prisma/enums").SiteMediaCategory;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getImageUsage(imageId: string): Promise<{
    image: {
        id: string;
        name: string;
        url: string;
        alt: string | null;
        category: import("../../generated/prisma/enums").SiteMediaCategory;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    usage: {
        campaigns: {
            active: boolean;
            id: string;
            title: string;
        }[];
        usedByCampaigns: number;
    };
}>;
export declare function deleteImage(imageId: string): Promise<{
    deleted: boolean;
    imageId: string;
}>;
//# sourceMappingURL=image.service.d.ts.map