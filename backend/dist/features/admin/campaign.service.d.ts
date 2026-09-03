export declare class CampaignError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface CampaignListParams {
    page: number;
    limit: number;
    search?: string;
}
export interface CreateCampaignInput {
    title: string;
    description?: string;
    imageId: string;
    startDate: string;
    endDate: string;
    discount: number;
    active?: boolean;
}
export interface UpdateCampaignInput {
    title?: string;
    description?: string;
    imageId?: string;
    startDate?: string;
    endDate?: string;
    discount?: number;
    active?: boolean;
}
export declare function listCampaigns(params: CampaignListParams): Promise<{
    data: ({
        image: {
            alt: string | null;
            id: string;
            name: string;
            url: string;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        imageId: string;
        startDate: Date;
        endDate: Date;
        discount: number;
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
export declare function createCampaign(input: CreateCampaignInput): Promise<{
    image: {
        alt: string | null;
        id: string;
        name: string;
        url: string;
    };
} & {
    id: string;
    title: string;
    description: string | null;
    imageId: string;
    startDate: Date;
    endDate: Date;
    discount: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<{
    image: {
        alt: string | null;
        id: string;
        name: string;
        url: string;
    };
} & {
    id: string;
    title: string;
    description: string | null;
    imageId: string;
    startDate: Date;
    endDate: Date;
    discount: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteCampaign(campaignId: string): Promise<{
    deleted: boolean;
    campaignId: string;
}>;
export declare function setCampaignsActive(ids: string[], active: boolean): Promise<{
    updated: number;
    active: boolean;
}>;
//# sourceMappingURL=campaign.service.d.ts.map