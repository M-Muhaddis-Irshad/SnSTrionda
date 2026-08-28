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
    readonly Address: 'Address';
    readonly Order: 'Order';
    readonly OrderItem: 'OrderItem';
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
    readonly email: 'email';
    readonly passwordHash: 'passwordHash';
    readonly firstName: 'firstName';
    readonly lastName: 'lastName';
    readonly phone: 'phone';
    readonly role: 'role';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
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
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
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
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map