import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly Category: 'Category';
    readonly Product: 'Product';
    readonly ProductVariant: 'ProductVariant';
    readonly ProductImage: 'ProductImage';
    readonly CustomMeasurement: 'CustomMeasurement';
    readonly User: 'User';
    readonly Account: 'Account';
    readonly Session: 'Session';
    readonly VerificationToken: 'VerificationToken';
    readonly AuthImage: 'AuthImage';
    readonly Address: 'Address';
    readonly Order: 'Order';
    readonly OrderItem: 'OrderItem';
    readonly Activity: 'Activity';
    readonly Image: 'Image';
    readonly Campaign: 'Campaign';
    readonly DeliveryZone: 'DeliveryZone';
    readonly Review: 'Review';
    readonly Notification: 'Notification';
    readonly ChatSession: 'ChatSession';
    readonly ChatMessage: 'ChatMessage';
    readonly AdminActivity: 'AdminActivity';
    readonly OrderStatusHistory: 'OrderStatusHistory';
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: 'ReadUncommitted';
    readonly ReadCommitted: 'ReadCommitted';
    readonly RepeatableRead: 'RepeatableRead';
    readonly Serializable: 'Serializable';
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const CategoryScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly slug: 'slug';
    readonly description: 'description';
    readonly active: 'active';
    readonly parentId: 'parentId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum];
export declare const ProductScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly slug: 'slug';
    readonly description: 'description';
    readonly basePrice: 'basePrice';
    readonly isCustomizable: 'isCustomizable';
    readonly isActive: 'isActive';
    readonly categoryId: 'categoryId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum];
export declare const ProductVariantScalarFieldEnum: {
    readonly id: 'id';
    readonly size: 'size';
    readonly color: 'color';
    readonly fabricType: 'fabricType';
    readonly sku: 'sku';
    readonly price: 'price';
    readonly stockQuantity: 'stockQuantity';
    readonly productId: 'productId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ProductVariantScalarFieldEnum = (typeof ProductVariantScalarFieldEnum)[keyof typeof ProductVariantScalarFieldEnum];
export declare const ProductImageScalarFieldEnum: {
    readonly id: 'id';
    readonly url: 'url';
    readonly altText: 'altText';
    readonly displayOrder: 'displayOrder';
    readonly productId: 'productId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ProductImageScalarFieldEnum = (typeof ProductImageScalarFieldEnum)[keyof typeof ProductImageScalarFieldEnum];
export declare const CustomMeasurementScalarFieldEnum: {
    readonly id: 'id';
    readonly chest: 'chest';
    readonly waist: 'waist';
    readonly shoulder: 'shoulder';
    readonly sleeveLength: 'sleeveLength';
    readonly neck: 'neck';
    readonly hip: 'hip';
    readonly inseam: 'inseam';
    readonly thigh: 'thigh';
    readonly rise: 'rise';
    readonly cuff: 'cuff';
    readonly height: 'height';
    readonly notes: 'notes';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type CustomMeasurementScalarFieldEnum = (typeof CustomMeasurementScalarFieldEnum)[keyof typeof CustomMeasurementScalarFieldEnum];
export declare const UserScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly email: 'email';
    readonly emailVerified: 'emailVerified';
    readonly image: 'image';
    readonly password: 'password';
    readonly phone: 'phone';
    readonly role: 'role';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const AccountScalarFieldEnum: {
    readonly id: 'id';
    readonly userId: 'userId';
    readonly type: 'type';
    readonly provider: 'provider';
    readonly providerAccountId: 'providerAccountId';
    readonly refresh_token: 'refresh_token';
    readonly access_token: 'access_token';
    readonly expires_at: 'expires_at';
    readonly token_type: 'token_type';
    readonly scope: 'scope';
    readonly id_token: 'id_token';
    readonly session_state: 'session_state';
};
export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum];
export declare const SessionScalarFieldEnum: {
    readonly id: 'id';
    readonly sessionToken: 'sessionToken';
    readonly userId: 'userId';
    readonly expires: 'expires';
};
export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum];
export declare const VerificationTokenScalarFieldEnum: {
    readonly identifier: 'identifier';
    readonly token: 'token';
    readonly expires: 'expires';
};
export type VerificationTokenScalarFieldEnum = (typeof VerificationTokenScalarFieldEnum)[keyof typeof VerificationTokenScalarFieldEnum];
export declare const AuthImageScalarFieldEnum: {
    readonly id: 'id';
    readonly pageType: 'pageType';
    readonly imageUrl: 'imageUrl';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type AuthImageScalarFieldEnum = (typeof AuthImageScalarFieldEnum)[keyof typeof AuthImageScalarFieldEnum];
export declare const AddressScalarFieldEnum: {
    readonly id: 'id';
    readonly label: 'label';
    readonly fullName: 'fullName';
    readonly phone: 'phone';
    readonly addressLine1: 'addressLine1';
    readonly addressLine2: 'addressLine2';
    readonly city: 'city';
    readonly province: 'province';
    readonly postalCode: 'postalCode';
    readonly country: 'country';
    readonly isDefault: 'isDefault';
    readonly userId: 'userId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type AddressScalarFieldEnum = (typeof AddressScalarFieldEnum)[keyof typeof AddressScalarFieldEnum];
export declare const OrderScalarFieldEnum: {
    readonly id: 'id';
    readonly orderNumber: 'orderNumber';
    readonly status: 'status';
    readonly subtotal: 'subtotal';
    readonly shippingCost: 'shippingCost';
    readonly discount: 'discount';
    readonly promoCode: 'promoCode';
    readonly total: 'total';
    readonly paymentMethod: 'paymentMethod';
    readonly paymentStatus: 'paymentStatus';
    readonly userId: 'userId';
    readonly shippingAddressId: 'shippingAddressId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum];
export declare const OrderItemScalarFieldEnum: {
    readonly id: 'id';
    readonly quantity: 'quantity';
    readonly priceAtPurchase: 'priceAtPurchase';
    readonly orderId: 'orderId';
    readonly productVariantId: 'productVariantId';
    readonly customMeasurementId: 'customMeasurementId';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type OrderItemScalarFieldEnum = (typeof OrderItemScalarFieldEnum)[keyof typeof OrderItemScalarFieldEnum];
export declare const ActivityScalarFieldEnum: {
    readonly id: 'id';
    readonly type: 'type';
    readonly message: 'message';
    readonly metadata: 'metadata';
    readonly userId: 'userId';
    readonly createdAt: 'createdAt';
};
export type ActivityScalarFieldEnum = (typeof ActivityScalarFieldEnum)[keyof typeof ActivityScalarFieldEnum];
export declare const ImageScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly url: 'url';
    readonly alt: 'alt';
    readonly category: 'category';
    readonly active: 'active';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ImageScalarFieldEnum = (typeof ImageScalarFieldEnum)[keyof typeof ImageScalarFieldEnum];
export declare const CampaignScalarFieldEnum: {
    readonly id: 'id';
    readonly title: 'title';
    readonly description: 'description';
    readonly imageId: 'imageId';
    readonly startDate: 'startDate';
    readonly endDate: 'endDate';
    readonly discount: 'discount';
    readonly active: 'active';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type CampaignScalarFieldEnum = (typeof CampaignScalarFieldEnum)[keyof typeof CampaignScalarFieldEnum];
export declare const DeliveryZoneScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly latitude: 'latitude';
    readonly longitude: 'longitude';
    readonly deliveryCharges: 'deliveryCharges';
    readonly estimatedDays: 'estimatedDays';
    readonly active: 'active';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type DeliveryZoneScalarFieldEnum = (typeof DeliveryZoneScalarFieldEnum)[keyof typeof DeliveryZoneScalarFieldEnum];
export declare const ReviewScalarFieldEnum: {
    readonly id: 'id';
    readonly userId: 'userId';
    readonly productId: 'productId';
    readonly orderId: 'orderId';
    readonly rating: 'rating';
    readonly title: 'title';
    readonly comment: 'comment';
    readonly status: 'status';
    readonly approvedAt: 'approvedAt';
    readonly approvedBy: 'approvedBy';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ReviewScalarFieldEnum = (typeof ReviewScalarFieldEnum)[keyof typeof ReviewScalarFieldEnum];
export declare const NotificationScalarFieldEnum: {
    readonly id: 'id';
    readonly userId: 'userId';
    readonly type: 'type';
    readonly title: 'title';
    readonly message: 'message';
    readonly data: 'data';
    readonly read: 'read';
    readonly readAt: 'readAt';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum];
export declare const ChatSessionScalarFieldEnum: {
    readonly id: 'id';
    readonly subject: 'subject';
    readonly orderId: 'orderId';
    readonly customerId: 'customerId';
    readonly adminId: 'adminId';
    readonly status: 'status';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ChatSessionScalarFieldEnum = (typeof ChatSessionScalarFieldEnum)[keyof typeof ChatSessionScalarFieldEnum];
export declare const ChatMessageScalarFieldEnum: {
    readonly id: 'id';
    readonly chatSessionId: 'chatSessionId';
    readonly senderId: 'senderId';
    readonly message: 'message';
    readonly read: 'read';
    readonly readAt: 'readAt';
    readonly createdAt: 'createdAt';
};
export type ChatMessageScalarFieldEnum = (typeof ChatMessageScalarFieldEnum)[keyof typeof ChatMessageScalarFieldEnum];
export declare const AdminActivityScalarFieldEnum: {
    readonly id: 'id';
    readonly adminId: 'adminId';
    readonly action: 'action';
    readonly entityType: 'entityType';
    readonly entityId: 'entityId';
    readonly details: 'details';
    readonly createdAt: 'createdAt';
};
export type AdminActivityScalarFieldEnum = (typeof AdminActivityScalarFieldEnum)[keyof typeof AdminActivityScalarFieldEnum];
export declare const OrderStatusHistoryScalarFieldEnum: {
    readonly id: 'id';
    readonly orderId: 'orderId';
    readonly status: 'status';
    readonly statusChangedAt: 'statusChangedAt';
    readonly notes: 'notes';
};
export type OrderStatusHistoryScalarFieldEnum = (typeof OrderStatusHistoryScalarFieldEnum)[keyof typeof OrderStatusHistoryScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const QueryMode: {
    readonly default: 'default';
    readonly insensitive: 'insensitive';
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: 'first';
    readonly last: 'last';
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map