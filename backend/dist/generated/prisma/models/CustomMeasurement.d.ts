import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model CustomMeasurement
 *
 */
export type CustomMeasurementModel = runtime.Types.Result.DefaultSelection<Prisma.$CustomMeasurementPayload>;
export type AggregateCustomMeasurement = {
    _count: CustomMeasurementCountAggregateOutputType | null;
    _avg: CustomMeasurementAvgAggregateOutputType | null;
    _sum: CustomMeasurementSumAggregateOutputType | null;
    _min: CustomMeasurementMinAggregateOutputType | null;
    _max: CustomMeasurementMaxAggregateOutputType | null;
};
export type CustomMeasurementAvgAggregateOutputType = {
    chest: runtime.Decimal | null;
    waist: runtime.Decimal | null;
    shoulder: runtime.Decimal | null;
    sleeveLength: runtime.Decimal | null;
    neck: runtime.Decimal | null;
    hip: runtime.Decimal | null;
    inseam: runtime.Decimal | null;
    thigh: runtime.Decimal | null;
    rise: runtime.Decimal | null;
    cuff: runtime.Decimal | null;
    height: runtime.Decimal | null;
};
export type CustomMeasurementSumAggregateOutputType = {
    chest: runtime.Decimal | null;
    waist: runtime.Decimal | null;
    shoulder: runtime.Decimal | null;
    sleeveLength: runtime.Decimal | null;
    neck: runtime.Decimal | null;
    hip: runtime.Decimal | null;
    inseam: runtime.Decimal | null;
    thigh: runtime.Decimal | null;
    rise: runtime.Decimal | null;
    cuff: runtime.Decimal | null;
    height: runtime.Decimal | null;
};
export type CustomMeasurementMinAggregateOutputType = {
    id: string | null;
    chest: runtime.Decimal | null;
    waist: runtime.Decimal | null;
    shoulder: runtime.Decimal | null;
    sleeveLength: runtime.Decimal | null;
    neck: runtime.Decimal | null;
    hip: runtime.Decimal | null;
    inseam: runtime.Decimal | null;
    thigh: runtime.Decimal | null;
    rise: runtime.Decimal | null;
    cuff: runtime.Decimal | null;
    height: runtime.Decimal | null;
    notes: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CustomMeasurementMaxAggregateOutputType = {
    id: string | null;
    chest: runtime.Decimal | null;
    waist: runtime.Decimal | null;
    shoulder: runtime.Decimal | null;
    sleeveLength: runtime.Decimal | null;
    neck: runtime.Decimal | null;
    hip: runtime.Decimal | null;
    inseam: runtime.Decimal | null;
    thigh: runtime.Decimal | null;
    rise: runtime.Decimal | null;
    cuff: runtime.Decimal | null;
    height: runtime.Decimal | null;
    notes: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CustomMeasurementCountAggregateOutputType = {
    id: number;
    chest: number;
    waist: number;
    shoulder: number;
    sleeveLength: number;
    neck: number;
    hip: number;
    inseam: number;
    thigh: number;
    rise: number;
    cuff: number;
    height: number;
    notes: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type CustomMeasurementAvgAggregateInputType = {
    chest?: true;
    waist?: true;
    shoulder?: true;
    sleeveLength?: true;
    neck?: true;
    hip?: true;
    inseam?: true;
    thigh?: true;
    rise?: true;
    cuff?: true;
    height?: true;
};
export type CustomMeasurementSumAggregateInputType = {
    chest?: true;
    waist?: true;
    shoulder?: true;
    sleeveLength?: true;
    neck?: true;
    hip?: true;
    inseam?: true;
    thigh?: true;
    rise?: true;
    cuff?: true;
    height?: true;
};
export type CustomMeasurementMinAggregateInputType = {
    id?: true;
    chest?: true;
    waist?: true;
    shoulder?: true;
    sleeveLength?: true;
    neck?: true;
    hip?: true;
    inseam?: true;
    thigh?: true;
    rise?: true;
    cuff?: true;
    height?: true;
    notes?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CustomMeasurementMaxAggregateInputType = {
    id?: true;
    chest?: true;
    waist?: true;
    shoulder?: true;
    sleeveLength?: true;
    neck?: true;
    hip?: true;
    inseam?: true;
    thigh?: true;
    rise?: true;
    cuff?: true;
    height?: true;
    notes?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CustomMeasurementCountAggregateInputType = {
    id?: true;
    chest?: true;
    waist?: true;
    shoulder?: true;
    sleeveLength?: true;
    neck?: true;
    hip?: true;
    inseam?: true;
    thigh?: true;
    rise?: true;
    cuff?: true;
    height?: true;
    notes?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type CustomMeasurementAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which CustomMeasurement to aggregate.
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CustomMeasurements to fetch.
     */
    orderBy?: Prisma.CustomMeasurementOrderByWithRelationInput | Prisma.CustomMeasurementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.CustomMeasurementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CustomMeasurements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CustomMeasurements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CustomMeasurements
    **/
    _count?: true | CustomMeasurementCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CustomMeasurementAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CustomMeasurementSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CustomMeasurementMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CustomMeasurementMaxAggregateInputType;
};
export type GetCustomMeasurementAggregateType<T extends CustomMeasurementAggregateArgs> = {
    [P in keyof T & keyof AggregateCustomMeasurement]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCustomMeasurement[P]> : Prisma.GetScalarType<T[P], AggregateCustomMeasurement[P]>;
};
export type CustomMeasurementGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CustomMeasurementWhereInput;
    orderBy?: Prisma.CustomMeasurementOrderByWithAggregationInput | Prisma.CustomMeasurementOrderByWithAggregationInput[];
    by: Prisma.CustomMeasurementScalarFieldEnum[] | Prisma.CustomMeasurementScalarFieldEnum;
    having?: Prisma.CustomMeasurementScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CustomMeasurementCountAggregateInputType | true;
    _avg?: CustomMeasurementAvgAggregateInputType;
    _sum?: CustomMeasurementSumAggregateInputType;
    _min?: CustomMeasurementMinAggregateInputType;
    _max?: CustomMeasurementMaxAggregateInputType;
};
export type CustomMeasurementGroupByOutputType = {
    id: string;
    chest: runtime.Decimal | null;
    waist: runtime.Decimal | null;
    shoulder: runtime.Decimal | null;
    sleeveLength: runtime.Decimal | null;
    neck: runtime.Decimal | null;
    hip: runtime.Decimal | null;
    inseam: runtime.Decimal | null;
    thigh: runtime.Decimal | null;
    rise: runtime.Decimal | null;
    cuff: runtime.Decimal | null;
    height: runtime.Decimal | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: CustomMeasurementCountAggregateOutputType | null;
    _avg: CustomMeasurementAvgAggregateOutputType | null;
    _sum: CustomMeasurementSumAggregateOutputType | null;
    _min: CustomMeasurementMinAggregateOutputType | null;
    _max: CustomMeasurementMaxAggregateOutputType | null;
};
export type GetCustomMeasurementGroupByPayload<T extends CustomMeasurementGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CustomMeasurementGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CustomMeasurementGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CustomMeasurementGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CustomMeasurementGroupByOutputType[P]>;
}>>;
export type CustomMeasurementWhereInput = {
    AND?: Prisma.CustomMeasurementWhereInput | Prisma.CustomMeasurementWhereInput[];
    OR?: Prisma.CustomMeasurementWhereInput[];
    NOT?: Prisma.CustomMeasurementWhereInput | Prisma.CustomMeasurementWhereInput[];
    id?: Prisma.StringFilter<"CustomMeasurement"> | string;
    chest?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.StringNullableFilter<"CustomMeasurement"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"CustomMeasurement"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"CustomMeasurement"> | Date | string;
    orderItem?: Prisma.XOR<Prisma.OrderItemNullableScalarRelationFilter, Prisma.OrderItemWhereInput> | null;
};
export type CustomMeasurementOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    chest?: Prisma.SortOrderInput | Prisma.SortOrder;
    waist?: Prisma.SortOrderInput | Prisma.SortOrder;
    shoulder?: Prisma.SortOrderInput | Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrderInput | Prisma.SortOrder;
    neck?: Prisma.SortOrderInput | Prisma.SortOrder;
    hip?: Prisma.SortOrderInput | Prisma.SortOrder;
    inseam?: Prisma.SortOrderInput | Prisma.SortOrder;
    thigh?: Prisma.SortOrderInput | Prisma.SortOrder;
    rise?: Prisma.SortOrderInput | Prisma.SortOrder;
    cuff?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    notes?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    orderItem?: Prisma.OrderItemOrderByWithRelationInput;
};
export type CustomMeasurementWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.CustomMeasurementWhereInput | Prisma.CustomMeasurementWhereInput[];
    OR?: Prisma.CustomMeasurementWhereInput[];
    NOT?: Prisma.CustomMeasurementWhereInput | Prisma.CustomMeasurementWhereInput[];
    chest?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.DecimalNullableFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.StringNullableFilter<"CustomMeasurement"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"CustomMeasurement"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"CustomMeasurement"> | Date | string;
    orderItem?: Prisma.XOR<Prisma.OrderItemNullableScalarRelationFilter, Prisma.OrderItemWhereInput> | null;
}, "id">;
export type CustomMeasurementOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    chest?: Prisma.SortOrderInput | Prisma.SortOrder;
    waist?: Prisma.SortOrderInput | Prisma.SortOrder;
    shoulder?: Prisma.SortOrderInput | Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrderInput | Prisma.SortOrder;
    neck?: Prisma.SortOrderInput | Prisma.SortOrder;
    hip?: Prisma.SortOrderInput | Prisma.SortOrder;
    inseam?: Prisma.SortOrderInput | Prisma.SortOrder;
    thigh?: Prisma.SortOrderInput | Prisma.SortOrder;
    rise?: Prisma.SortOrderInput | Prisma.SortOrder;
    cuff?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    notes?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.CustomMeasurementCountOrderByAggregateInput;
    _avg?: Prisma.CustomMeasurementAvgOrderByAggregateInput;
    _max?: Prisma.CustomMeasurementMaxOrderByAggregateInput;
    _min?: Prisma.CustomMeasurementMinOrderByAggregateInput;
    _sum?: Prisma.CustomMeasurementSumOrderByAggregateInput;
};
export type CustomMeasurementScalarWhereWithAggregatesInput = {
    AND?: Prisma.CustomMeasurementScalarWhereWithAggregatesInput | Prisma.CustomMeasurementScalarWhereWithAggregatesInput[];
    OR?: Prisma.CustomMeasurementScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CustomMeasurementScalarWhereWithAggregatesInput | Prisma.CustomMeasurementScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"CustomMeasurement"> | string;
    chest?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.DecimalNullableWithAggregatesFilter<"CustomMeasurement"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.StringNullableWithAggregatesFilter<"CustomMeasurement"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"CustomMeasurement"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"CustomMeasurement"> | Date | string;
};
export type CustomMeasurementCreateInput = {
    id?: string;
    chest?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    orderItem?: Prisma.OrderItemCreateNestedOneWithoutCustomMeasurementInput;
};
export type CustomMeasurementUncheckedCreateInput = {
    id?: string;
    chest?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    orderItem?: Prisma.OrderItemUncheckedCreateNestedOneWithoutCustomMeasurementInput;
};
export type CustomMeasurementUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    orderItem?: Prisma.OrderItemUpdateOneWithoutCustomMeasurementNestedInput;
};
export type CustomMeasurementUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    orderItem?: Prisma.OrderItemUncheckedUpdateOneWithoutCustomMeasurementNestedInput;
};
export type CustomMeasurementCreateManyInput = {
    id?: string;
    chest?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CustomMeasurementUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CustomMeasurementUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CustomMeasurementCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chest?: Prisma.SortOrder;
    waist?: Prisma.SortOrder;
    shoulder?: Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrder;
    neck?: Prisma.SortOrder;
    hip?: Prisma.SortOrder;
    inseam?: Prisma.SortOrder;
    thigh?: Prisma.SortOrder;
    rise?: Prisma.SortOrder;
    cuff?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    notes?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CustomMeasurementAvgOrderByAggregateInput = {
    chest?: Prisma.SortOrder;
    waist?: Prisma.SortOrder;
    shoulder?: Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrder;
    neck?: Prisma.SortOrder;
    hip?: Prisma.SortOrder;
    inseam?: Prisma.SortOrder;
    thigh?: Prisma.SortOrder;
    rise?: Prisma.SortOrder;
    cuff?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type CustomMeasurementMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chest?: Prisma.SortOrder;
    waist?: Prisma.SortOrder;
    shoulder?: Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrder;
    neck?: Prisma.SortOrder;
    hip?: Prisma.SortOrder;
    inseam?: Prisma.SortOrder;
    thigh?: Prisma.SortOrder;
    rise?: Prisma.SortOrder;
    cuff?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    notes?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CustomMeasurementMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    chest?: Prisma.SortOrder;
    waist?: Prisma.SortOrder;
    shoulder?: Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrder;
    neck?: Prisma.SortOrder;
    hip?: Prisma.SortOrder;
    inseam?: Prisma.SortOrder;
    thigh?: Prisma.SortOrder;
    rise?: Prisma.SortOrder;
    cuff?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    notes?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CustomMeasurementSumOrderByAggregateInput = {
    chest?: Prisma.SortOrder;
    waist?: Prisma.SortOrder;
    shoulder?: Prisma.SortOrder;
    sleeveLength?: Prisma.SortOrder;
    neck?: Prisma.SortOrder;
    hip?: Prisma.SortOrder;
    inseam?: Prisma.SortOrder;
    thigh?: Prisma.SortOrder;
    rise?: Prisma.SortOrder;
    cuff?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type CustomMeasurementNullableScalarRelationFilter = {
    is?: Prisma.CustomMeasurementWhereInput | null;
    isNot?: Prisma.CustomMeasurementWhereInput | null;
};
export type CustomMeasurementCreateNestedOneWithoutOrderItemInput = {
    create?: Prisma.XOR<Prisma.CustomMeasurementCreateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedCreateWithoutOrderItemInput>;
    connectOrCreate?: Prisma.CustomMeasurementCreateOrConnectWithoutOrderItemInput;
    connect?: Prisma.CustomMeasurementWhereUniqueInput;
};
export type CustomMeasurementUpdateOneWithoutOrderItemNestedInput = {
    create?: Prisma.XOR<Prisma.CustomMeasurementCreateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedCreateWithoutOrderItemInput>;
    connectOrCreate?: Prisma.CustomMeasurementCreateOrConnectWithoutOrderItemInput;
    upsert?: Prisma.CustomMeasurementUpsertWithoutOrderItemInput;
    disconnect?: Prisma.CustomMeasurementWhereInput | boolean;
    delete?: Prisma.CustomMeasurementWhereInput | boolean;
    connect?: Prisma.CustomMeasurementWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CustomMeasurementUpdateToOneWithWhereWithoutOrderItemInput, Prisma.CustomMeasurementUpdateWithoutOrderItemInput>, Prisma.CustomMeasurementUncheckedUpdateWithoutOrderItemInput>;
};
export type CustomMeasurementCreateWithoutOrderItemInput = {
    id?: string;
    chest?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CustomMeasurementUncheckedCreateWithoutOrderItemInput = {
    id?: string;
    chest?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CustomMeasurementCreateOrConnectWithoutOrderItemInput = {
    where: Prisma.CustomMeasurementWhereUniqueInput;
    create: Prisma.XOR<Prisma.CustomMeasurementCreateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedCreateWithoutOrderItemInput>;
};
export type CustomMeasurementUpsertWithoutOrderItemInput = {
    update: Prisma.XOR<Prisma.CustomMeasurementUpdateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedUpdateWithoutOrderItemInput>;
    create: Prisma.XOR<Prisma.CustomMeasurementCreateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedCreateWithoutOrderItemInput>;
    where?: Prisma.CustomMeasurementWhereInput;
};
export type CustomMeasurementUpdateToOneWithWhereWithoutOrderItemInput = {
    where?: Prisma.CustomMeasurementWhereInput;
    data: Prisma.XOR<Prisma.CustomMeasurementUpdateWithoutOrderItemInput, Prisma.CustomMeasurementUncheckedUpdateWithoutOrderItemInput>;
};
export type CustomMeasurementUpdateWithoutOrderItemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CustomMeasurementUncheckedUpdateWithoutOrderItemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    chest?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    waist?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    shoulder?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    sleeveLength?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    neck?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    hip?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    inseam?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    thigh?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    rise?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    cuff?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    height?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    notes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CustomMeasurementSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chest?: boolean;
    waist?: boolean;
    shoulder?: boolean;
    sleeveLength?: boolean;
    neck?: boolean;
    hip?: boolean;
    inseam?: boolean;
    thigh?: boolean;
    rise?: boolean;
    cuff?: boolean;
    height?: boolean;
    notes?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    orderItem?: boolean | Prisma.CustomMeasurement$orderItemArgs<ExtArgs>;
}, ExtArgs["result"]["customMeasurement"]>;
export type CustomMeasurementSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chest?: boolean;
    waist?: boolean;
    shoulder?: boolean;
    sleeveLength?: boolean;
    neck?: boolean;
    hip?: boolean;
    inseam?: boolean;
    thigh?: boolean;
    rise?: boolean;
    cuff?: boolean;
    height?: boolean;
    notes?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["customMeasurement"]>;
export type CustomMeasurementSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    chest?: boolean;
    waist?: boolean;
    shoulder?: boolean;
    sleeveLength?: boolean;
    neck?: boolean;
    hip?: boolean;
    inseam?: boolean;
    thigh?: boolean;
    rise?: boolean;
    cuff?: boolean;
    height?: boolean;
    notes?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["customMeasurement"]>;
export type CustomMeasurementSelectScalar = {
    id?: boolean;
    chest?: boolean;
    waist?: boolean;
    shoulder?: boolean;
    sleeveLength?: boolean;
    neck?: boolean;
    hip?: boolean;
    inseam?: boolean;
    thigh?: boolean;
    rise?: boolean;
    cuff?: boolean;
    height?: boolean;
    notes?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type CustomMeasurementOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "chest" | "waist" | "shoulder" | "sleeveLength" | "neck" | "hip" | "inseam" | "thigh" | "rise" | "cuff" | "height" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["customMeasurement"]>;
export type CustomMeasurementInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    orderItem?: boolean | Prisma.CustomMeasurement$orderItemArgs<ExtArgs>;
};
export type CustomMeasurementIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type CustomMeasurementIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $CustomMeasurementPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "CustomMeasurement";
    objects: {
        orderItem: Prisma.$OrderItemPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        chest: runtime.Decimal | null;
        waist: runtime.Decimal | null;
        shoulder: runtime.Decimal | null;
        sleeveLength: runtime.Decimal | null;
        neck: runtime.Decimal | null;
        hip: runtime.Decimal | null;
        inseam: runtime.Decimal | null;
        thigh: runtime.Decimal | null;
        rise: runtime.Decimal | null;
        cuff: runtime.Decimal | null;
        height: runtime.Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["customMeasurement"]>;
    composites: {};
};
export type CustomMeasurementGetPayload<S extends boolean | null | undefined | CustomMeasurementDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload, S>;
export type CustomMeasurementCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CustomMeasurementFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CustomMeasurementCountAggregateInputType | true;
};
export interface CustomMeasurementDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['CustomMeasurement'];
        meta: {
            name: 'CustomMeasurement';
        };
    };
    /**
     * Find zero or one CustomMeasurement that matches the filter.
     * @param {CustomMeasurementFindUniqueArgs} args - Arguments to find a CustomMeasurement
     * @example
     * // Get one CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomMeasurementFindUniqueArgs>(args: Prisma.SelectSubset<T, CustomMeasurementFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one CustomMeasurement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomMeasurementFindUniqueOrThrowArgs} args - Arguments to find a CustomMeasurement
     * @example
     * // Get one CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomMeasurementFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CustomMeasurementFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first CustomMeasurement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementFindFirstArgs} args - Arguments to find a CustomMeasurement
     * @example
     * // Get one CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomMeasurementFindFirstArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementFindFirstArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first CustomMeasurement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementFindFirstOrThrowArgs} args - Arguments to find a CustomMeasurement
     * @example
     * // Get one CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomMeasurementFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more CustomMeasurements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomMeasurements
     * const customMeasurements = await prisma.customMeasurement.findMany()
     *
     * // Get first 10 CustomMeasurements
     * const customMeasurements = await prisma.customMeasurement.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const customMeasurementWithIdOnly = await prisma.customMeasurement.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CustomMeasurementFindManyArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a CustomMeasurement.
     * @param {CustomMeasurementCreateArgs} args - Arguments to create a CustomMeasurement.
     * @example
     * // Create one CustomMeasurement
     * const CustomMeasurement = await prisma.customMeasurement.create({
     *   data: {
     *     // ... data to create a CustomMeasurement
     *   }
     * })
     *
     */
    create<T extends CustomMeasurementCreateArgs>(args: Prisma.SelectSubset<T, CustomMeasurementCreateArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many CustomMeasurements.
     * @param {CustomMeasurementCreateManyArgs} args - Arguments to create many CustomMeasurements.
     * @example
     * // Create many CustomMeasurements
     * const customMeasurement = await prisma.customMeasurement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CustomMeasurementCreateManyArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many CustomMeasurements and returns the data saved in the database.
     * @param {CustomMeasurementCreateManyAndReturnArgs} args - Arguments to create many CustomMeasurements.
     * @example
     * // Create many CustomMeasurements
     * const customMeasurement = await prisma.customMeasurement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CustomMeasurements and only return the `id`
     * const customMeasurementWithIdOnly = await prisma.customMeasurement.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CustomMeasurementCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a CustomMeasurement.
     * @param {CustomMeasurementDeleteArgs} args - Arguments to delete one CustomMeasurement.
     * @example
     * // Delete one CustomMeasurement
     * const CustomMeasurement = await prisma.customMeasurement.delete({
     *   where: {
     *     // ... filter to delete one CustomMeasurement
     *   }
     * })
     *
     */
    delete<T extends CustomMeasurementDeleteArgs>(args: Prisma.SelectSubset<T, CustomMeasurementDeleteArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one CustomMeasurement.
     * @param {CustomMeasurementUpdateArgs} args - Arguments to update one CustomMeasurement.
     * @example
     * // Update one CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CustomMeasurementUpdateArgs>(args: Prisma.SelectSubset<T, CustomMeasurementUpdateArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more CustomMeasurements.
     * @param {CustomMeasurementDeleteManyArgs} args - Arguments to filter CustomMeasurements to delete.
     * @example
     * // Delete a few CustomMeasurements
     * const { count } = await prisma.customMeasurement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CustomMeasurementDeleteManyArgs>(args?: Prisma.SelectSubset<T, CustomMeasurementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more CustomMeasurements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomMeasurements
     * const customMeasurement = await prisma.customMeasurement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CustomMeasurementUpdateManyArgs>(args: Prisma.SelectSubset<T, CustomMeasurementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more CustomMeasurements and returns the data updated in the database.
     * @param {CustomMeasurementUpdateManyAndReturnArgs} args - Arguments to update many CustomMeasurements.
     * @example
     * // Update many CustomMeasurements
     * const customMeasurement = await prisma.customMeasurement.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CustomMeasurements and only return the `id`
     * const customMeasurementWithIdOnly = await prisma.customMeasurement.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CustomMeasurementUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, CustomMeasurementUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one CustomMeasurement.
     * @param {CustomMeasurementUpsertArgs} args - Arguments to update or create a CustomMeasurement.
     * @example
     * // Update or create a CustomMeasurement
     * const customMeasurement = await prisma.customMeasurement.upsert({
     *   create: {
     *     // ... data to create a CustomMeasurement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomMeasurement we want to update
     *   }
     * })
     */
    upsert<T extends CustomMeasurementUpsertArgs>(args: Prisma.SelectSubset<T, CustomMeasurementUpsertArgs<ExtArgs>>): Prisma.Prisma__CustomMeasurementClient<runtime.Types.Result.GetResult<Prisma.$CustomMeasurementPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of CustomMeasurements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementCountArgs} args - Arguments to filter CustomMeasurements to count.
     * @example
     * // Count the number of CustomMeasurements
     * const count = await prisma.customMeasurement.count({
     *   where: {
     *     // ... the filter for the CustomMeasurements we want to count
     *   }
     * })
    **/
    count<T extends CustomMeasurementCountArgs>(args?: Prisma.Subset<T, CustomMeasurementCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CustomMeasurementCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a CustomMeasurement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CustomMeasurementAggregateArgs>(args: Prisma.Subset<T, CustomMeasurementAggregateArgs>): Prisma.PrismaPromise<GetCustomMeasurementAggregateType<T>>;
    /**
     * Group by CustomMeasurement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomMeasurementGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends CustomMeasurementGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CustomMeasurementGroupByArgs['orderBy'];
    } : {
        orderBy?: CustomMeasurementGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CustomMeasurementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomMeasurementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the CustomMeasurement model
     */
    readonly fields: CustomMeasurementFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for CustomMeasurement.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__CustomMeasurementClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    orderItem<T extends Prisma.CustomMeasurement$orderItemArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.CustomMeasurement$orderItemArgs<ExtArgs>>): Prisma.Prisma__OrderItemClient<runtime.Types.Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the CustomMeasurement model
 */
export interface CustomMeasurementFieldRefs {
    readonly id: Prisma.FieldRef<"CustomMeasurement", 'String'>;
    readonly chest: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly waist: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly shoulder: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly sleeveLength: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly neck: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly hip: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly inseam: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly thigh: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly rise: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly cuff: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly height: Prisma.FieldRef<"CustomMeasurement", 'Decimal'>;
    readonly notes: Prisma.FieldRef<"CustomMeasurement", 'String'>;
    readonly createdAt: Prisma.FieldRef<"CustomMeasurement", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"CustomMeasurement", 'DateTime'>;
}
/**
 * CustomMeasurement findUnique
 */
export type CustomMeasurementFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter, which CustomMeasurement to fetch.
     */
    where: Prisma.CustomMeasurementWhereUniqueInput;
};
/**
 * CustomMeasurement findUniqueOrThrow
 */
export type CustomMeasurementFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter, which CustomMeasurement to fetch.
     */
    where: Prisma.CustomMeasurementWhereUniqueInput;
};
/**
 * CustomMeasurement findFirst
 */
export type CustomMeasurementFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter, which CustomMeasurement to fetch.
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CustomMeasurements to fetch.
     */
    orderBy?: Prisma.CustomMeasurementOrderByWithRelationInput | Prisma.CustomMeasurementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CustomMeasurements.
     */
    cursor?: Prisma.CustomMeasurementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CustomMeasurements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CustomMeasurements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CustomMeasurements.
     */
    distinct?: Prisma.CustomMeasurementScalarFieldEnum | Prisma.CustomMeasurementScalarFieldEnum[];
};
/**
 * CustomMeasurement findFirstOrThrow
 */
export type CustomMeasurementFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter, which CustomMeasurement to fetch.
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CustomMeasurements to fetch.
     */
    orderBy?: Prisma.CustomMeasurementOrderByWithRelationInput | Prisma.CustomMeasurementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CustomMeasurements.
     */
    cursor?: Prisma.CustomMeasurementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CustomMeasurements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CustomMeasurements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CustomMeasurements.
     */
    distinct?: Prisma.CustomMeasurementScalarFieldEnum | Prisma.CustomMeasurementScalarFieldEnum[];
};
/**
 * CustomMeasurement findMany
 */
export type CustomMeasurementFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter, which CustomMeasurements to fetch.
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CustomMeasurements to fetch.
     */
    orderBy?: Prisma.CustomMeasurementOrderByWithRelationInput | Prisma.CustomMeasurementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CustomMeasurements.
     */
    cursor?: Prisma.CustomMeasurementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CustomMeasurements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CustomMeasurements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CustomMeasurements.
     */
    distinct?: Prisma.CustomMeasurementScalarFieldEnum | Prisma.CustomMeasurementScalarFieldEnum[];
};
/**
 * CustomMeasurement create
 */
export type CustomMeasurementCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * The data needed to create a CustomMeasurement.
     */
    data: Prisma.XOR<Prisma.CustomMeasurementCreateInput, Prisma.CustomMeasurementUncheckedCreateInput>;
};
/**
 * CustomMeasurement createMany
 */
export type CustomMeasurementCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomMeasurements.
     */
    data: Prisma.CustomMeasurementCreateManyInput | Prisma.CustomMeasurementCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * CustomMeasurement createManyAndReturn
 */
export type CustomMeasurementCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * The data used to create many CustomMeasurements.
     */
    data: Prisma.CustomMeasurementCreateManyInput | Prisma.CustomMeasurementCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * CustomMeasurement update
 */
export type CustomMeasurementUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * The data needed to update a CustomMeasurement.
     */
    data: Prisma.XOR<Prisma.CustomMeasurementUpdateInput, Prisma.CustomMeasurementUncheckedUpdateInput>;
    /**
     * Choose, which CustomMeasurement to update.
     */
    where: Prisma.CustomMeasurementWhereUniqueInput;
};
/**
 * CustomMeasurement updateMany
 */
export type CustomMeasurementUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomMeasurements.
     */
    data: Prisma.XOR<Prisma.CustomMeasurementUpdateManyMutationInput, Prisma.CustomMeasurementUncheckedUpdateManyInput>;
    /**
     * Filter which CustomMeasurements to update
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * Limit how many CustomMeasurements to update.
     */
    limit?: number;
};
/**
 * CustomMeasurement updateManyAndReturn
 */
export type CustomMeasurementUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * The data used to update CustomMeasurements.
     */
    data: Prisma.XOR<Prisma.CustomMeasurementUpdateManyMutationInput, Prisma.CustomMeasurementUncheckedUpdateManyInput>;
    /**
     * Filter which CustomMeasurements to update
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * Limit how many CustomMeasurements to update.
     */
    limit?: number;
};
/**
 * CustomMeasurement upsert
 */
export type CustomMeasurementUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * The filter to search for the CustomMeasurement to update in case it exists.
     */
    where: Prisma.CustomMeasurementWhereUniqueInput;
    /**
     * In case the CustomMeasurement found by the `where` argument doesn't exist, create a new CustomMeasurement with this data.
     */
    create: Prisma.XOR<Prisma.CustomMeasurementCreateInput, Prisma.CustomMeasurementUncheckedCreateInput>;
    /**
     * In case the CustomMeasurement was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.CustomMeasurementUpdateInput, Prisma.CustomMeasurementUncheckedUpdateInput>;
};
/**
 * CustomMeasurement delete
 */
export type CustomMeasurementDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
    /**
     * Filter which CustomMeasurement to delete.
     */
    where: Prisma.CustomMeasurementWhereUniqueInput;
};
/**
 * CustomMeasurement deleteMany
 */
export type CustomMeasurementDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which CustomMeasurements to delete
     */
    where?: Prisma.CustomMeasurementWhereInput;
    /**
     * Limit how many CustomMeasurements to delete.
     */
    limit?: number;
};
/**
 * CustomMeasurement.orderItem
 */
export type CustomMeasurement$orderItemArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: Prisma.OrderItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the OrderItem
     */
    omit?: Prisma.OrderItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.OrderItemInclude<ExtArgs> | null;
    where?: Prisma.OrderItemWhereInput;
};
/**
 * CustomMeasurement without action
 */
export type CustomMeasurementDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomMeasurement
     */
    select?: Prisma.CustomMeasurementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CustomMeasurement
     */
    omit?: Prisma.CustomMeasurementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CustomMeasurementInclude<ExtArgs> | null;
};
//# sourceMappingURL=CustomMeasurement.d.ts.map