export interface CreateCheckoutInput {
    orderId: string;
}
export interface SafepayCheckoutResult {
    checkoutUrl: string;
    trackerToken: string;
}
export declare class PaymentError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function createSafepayCheckout(input: CreateCheckoutInput, frontendBaseUrl: string): Promise<SafepayCheckoutResult>;
export declare function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, timestampHeader: string | undefined): boolean;
export declare function processWebhookEvent(eventPayload: any): Promise<void>;
//# sourceMappingURL=payments.service.d.ts.map