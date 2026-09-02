import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model AuthImage
 *
 */
export type AuthImageModel = runtime.Types.Result.DefaultSelection<Prisma.$AuthImagePayload>;
export type AggregateAuthImage = {
    _count: AuthImageCountAggregateOutputType | null;
    _min: AuthImageMinAggregateOutputType | null;
    _max: AuthImageMaxAggregateOutputType | null;
};
export type AuthImageMinAggregateOutputType = {
    id: string | null;
    pageType: string | null;
    imageUrl: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AuthImageMaxAggregateOutputType = {
    id: string | null;
    pageType: string | null;
    imageUrl: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AuthImageCountAggregateOutputType = {
    id: number;
    pageType: number;
    imageUrl: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type AuthImageMinAggregateInputType = {
    id?: true;
    pageType?: true;
    imageUrl?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AuthImageMaxAggregateInputType = {
    id?: true;
    pageType?: true;
    imageUrl?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AuthImageCountAggregateInputType = {
    id?: true;
    pageType?: true;
    imageUrl?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type AuthImageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which AuthImage to aggregate.
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AuthImages to fetch.
     */
    orderBy?: Prisma.AuthImageOrderByWithRelationInput | Prisma.AuthImageOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.AuthImageWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AuthImages from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AuthImages.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned AuthImages
    **/
    _count?: true | AuthImageCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: AuthImageMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: AuthImageMaxAggregateInputType;
};
export type GetAuthImageAggregateType<T extends AuthImageAggregateArgs> = {
    [P in keyof T & keyof AggregateAuthImage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAuthImage[P]> : Prisma.GetScalarType<T[P], AggregateAuthImage[P]>;
};
export type AuthImageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuthImageWhereInput;
    orderBy?: Prisma.AuthImageOrderByWithAggregationInput | Prisma.AuthImageOrderByWithAggregationInput[];
    by: Prisma.AuthImageScalarFieldEnum[] | Prisma.AuthImageScalarFieldEnum;
    having?: Prisma.AuthImageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AuthImageCountAggregateInputType | true;
    _min?: AuthImageMinAggregateInputType;
    _max?: AuthImageMaxAggregateInputType;
};
export type AuthImageGroupByOutputType = {
    id: string;
    pageType: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    _count: AuthImageCountAggregateOutputType | null;
    _min: AuthImageMinAggregateOutputType | null;
    _max: AuthImageMaxAggregateOutputType | null;
};
export type GetAuthImageGroupByPayload<T extends AuthImageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AuthImageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AuthImageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AuthImageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AuthImageGroupByOutputType[P]>;
}>>;
export type AuthImageWhereInput = {
    AND?: Prisma.AuthImageWhereInput | Prisma.AuthImageWhereInput[];
    OR?: Prisma.AuthImageWhereInput[];
    NOT?: Prisma.AuthImageWhereInput | Prisma.AuthImageWhereInput[];
    id?: Prisma.StringFilter<"AuthImage"> | string;
    pageType?: Prisma.StringFilter<"AuthImage"> | string;
    imageUrl?: Prisma.StringFilter<"AuthImage"> | string;
    createdAt?: Prisma.DateTimeFilter<"AuthImage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"AuthImage"> | Date | string;
};
export type AuthImageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    pageType?: Prisma.SortOrder;
    imageUrl?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthImageWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.AuthImageWhereInput | Prisma.AuthImageWhereInput[];
    OR?: Prisma.AuthImageWhereInput[];
    NOT?: Prisma.AuthImageWhereInput | Prisma.AuthImageWhereInput[];
    pageType?: Prisma.StringFilter<"AuthImage"> | string;
    imageUrl?: Prisma.StringFilter<"AuthImage"> | string;
    createdAt?: Prisma.DateTimeFilter<"AuthImage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"AuthImage"> | Date | string;
}, "id">;
export type AuthImageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    pageType?: Prisma.SortOrder;
    imageUrl?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.AuthImageCountOrderByAggregateInput;
    _max?: Prisma.AuthImageMaxOrderByAggregateInput;
    _min?: Prisma.AuthImageMinOrderByAggregateInput;
};
export type AuthImageScalarWhereWithAggregatesInput = {
    AND?: Prisma.AuthImageScalarWhereWithAggregatesInput | Prisma.AuthImageScalarWhereWithAggregatesInput[];
    OR?: Prisma.AuthImageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AuthImageScalarWhereWithAggregatesInput | Prisma.AuthImageScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"AuthImage"> | string;
    pageType?: Prisma.StringWithAggregatesFilter<"AuthImage"> | string;
    imageUrl?: Prisma.StringWithAggregatesFilter<"AuthImage"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"AuthImage"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"AuthImage"> | Date | string;
};
export type AuthImageCreateInput = {
    id?: string;
    pageType: string;
    imageUrl: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthImageUncheckedCreateInput = {
    id?: string;
    pageType: string;
    imageUrl: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthImageUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    pageType?: Prisma.StringFieldUpdateOperationsInput | string;
    imageUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthImageUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    pageType?: Prisma.StringFieldUpdateOperationsInput | string;
    imageUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthImageCreateManyInput = {
    id?: string;
    pageType: string;
    imageUrl: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthImageUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    pageType?: Prisma.StringFieldUpdateOperationsInput | string;
    imageUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthImageUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    pageType?: Prisma.StringFieldUpdateOperationsInput | string;
    imageUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthImageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pageType?: Prisma.SortOrder;
    imageUrl?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthImageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pageType?: Prisma.SortOrder;
    imageUrl?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthImageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pageType?: Prisma.SortOrder;
    imageUrl?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthImageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    pageType?: boolean;
    imageUrl?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["authImage"]>;
export type AuthImageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    pageType?: boolean;
    imageUrl?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["authImage"]>;
export type AuthImageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    pageType?: boolean;
    imageUrl?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["authImage"]>;
export type AuthImageSelectScalar = {
    id?: boolean;
    pageType?: boolean;
    imageUrl?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type AuthImageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "pageType" | "imageUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["authImage"]>;
export type $AuthImagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AuthImage";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        pageType: string;
        imageUrl: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["authImage"]>;
    composites: {};
};
export type AuthImageGetPayload<S extends boolean | null | undefined | AuthImageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AuthImagePayload, S>;
export type AuthImageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AuthImageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AuthImageCountAggregateInputType | true;
};
export interface AuthImageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AuthImage'];
        meta: {
            name: 'AuthImage';
        };
    };
    /**
     * Find zero or one AuthImage that matches the filter.
     * @param {AuthImageFindUniqueArgs} args - Arguments to find a AuthImage
     * @example
     * // Get one AuthImage
     * const authImage = await prisma.authImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuthImageFindUniqueArgs>(args: Prisma.SelectSubset<T, AuthImageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one AuthImage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuthImageFindUniqueOrThrowArgs} args - Arguments to find a AuthImage
     * @example
     * // Get one AuthImage
     * const authImage = await prisma.authImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuthImageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AuthImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first AuthImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageFindFirstArgs} args - Arguments to find a AuthImage
     * @example
     * // Get one AuthImage
     * const authImage = await prisma.authImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuthImageFindFirstArgs>(args?: Prisma.SelectSubset<T, AuthImageFindFirstArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first AuthImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageFindFirstOrThrowArgs} args - Arguments to find a AuthImage
     * @example
     * // Get one AuthImage
     * const authImage = await prisma.authImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuthImageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AuthImageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more AuthImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuthImages
     * const authImages = await prisma.authImage.findMany()
     *
     * // Get first 10 AuthImages
     * const authImages = await prisma.authImage.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const authImageWithIdOnly = await prisma.authImage.findMany({ select: { id: true } })
     *
     */
    findMany<T extends AuthImageFindManyArgs>(args?: Prisma.SelectSubset<T, AuthImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a AuthImage.
     * @param {AuthImageCreateArgs} args - Arguments to create a AuthImage.
     * @example
     * // Create one AuthImage
     * const AuthImage = await prisma.authImage.create({
     *   data: {
     *     // ... data to create a AuthImage
     *   }
     * })
     *
     */
    create<T extends AuthImageCreateArgs>(args: Prisma.SelectSubset<T, AuthImageCreateArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many AuthImages.
     * @param {AuthImageCreateManyArgs} args - Arguments to create many AuthImages.
     * @example
     * // Create many AuthImages
     * const authImage = await prisma.authImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends AuthImageCreateManyArgs>(args?: Prisma.SelectSubset<T, AuthImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many AuthImages and returns the data saved in the database.
     * @param {AuthImageCreateManyAndReturnArgs} args - Arguments to create many AuthImages.
     * @example
     * // Create many AuthImages
     * const authImage = await prisma.authImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many AuthImages and only return the `id`
     * const authImageWithIdOnly = await prisma.authImage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends AuthImageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AuthImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a AuthImage.
     * @param {AuthImageDeleteArgs} args - Arguments to delete one AuthImage.
     * @example
     * // Delete one AuthImage
     * const AuthImage = await prisma.authImage.delete({
     *   where: {
     *     // ... filter to delete one AuthImage
     *   }
     * })
     *
     */
    delete<T extends AuthImageDeleteArgs>(args: Prisma.SelectSubset<T, AuthImageDeleteArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one AuthImage.
     * @param {AuthImageUpdateArgs} args - Arguments to update one AuthImage.
     * @example
     * // Update one AuthImage
     * const authImage = await prisma.authImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends AuthImageUpdateArgs>(args: Prisma.SelectSubset<T, AuthImageUpdateArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more AuthImages.
     * @param {AuthImageDeleteManyArgs} args - Arguments to filter AuthImages to delete.
     * @example
     * // Delete a few AuthImages
     * const { count } = await prisma.authImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends AuthImageDeleteManyArgs>(args?: Prisma.SelectSubset<T, AuthImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more AuthImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuthImages
     * const authImage = await prisma.authImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends AuthImageUpdateManyArgs>(args: Prisma.SelectSubset<T, AuthImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more AuthImages and returns the data updated in the database.
     * @param {AuthImageUpdateManyAndReturnArgs} args - Arguments to update many AuthImages.
     * @example
     * // Update many AuthImages
     * const authImage = await prisma.authImage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more AuthImages and only return the `id`
     * const authImageWithIdOnly = await prisma.authImage.updateManyAndReturn({
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
    updateManyAndReturn<T extends AuthImageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AuthImageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one AuthImage.
     * @param {AuthImageUpsertArgs} args - Arguments to update or create a AuthImage.
     * @example
     * // Update or create a AuthImage
     * const authImage = await prisma.authImage.upsert({
     *   create: {
     *     // ... data to create a AuthImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuthImage we want to update
     *   }
     * })
     */
    upsert<T extends AuthImageUpsertArgs>(args: Prisma.SelectSubset<T, AuthImageUpsertArgs<ExtArgs>>): Prisma.Prisma__AuthImageClient<runtime.Types.Result.GetResult<Prisma.$AuthImagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of AuthImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageCountArgs} args - Arguments to filter AuthImages to count.
     * @example
     * // Count the number of AuthImages
     * const count = await prisma.authImage.count({
     *   where: {
     *     // ... the filter for the AuthImages we want to count
     *   }
     * })
    **/
    count<T extends AuthImageCountArgs>(args?: Prisma.Subset<T, AuthImageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AuthImageCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a AuthImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AuthImageAggregateArgs>(args: Prisma.Subset<T, AuthImageAggregateArgs>): Prisma.PrismaPromise<GetAuthImageAggregateType<T>>;
    /**
     * Group by AuthImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuthImageGroupByArgs} args - Group by arguments.
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
    groupBy<T extends AuthImageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AuthImageGroupByArgs['orderBy'];
    } : {
        orderBy?: AuthImageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AuthImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuthImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the AuthImage model
     */
    readonly fields: AuthImageFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for AuthImage.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__AuthImageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
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
 * Fields of the AuthImage model
 */
export interface AuthImageFieldRefs {
    readonly id: Prisma.FieldRef<"AuthImage", 'String'>;
    readonly pageType: Prisma.FieldRef<"AuthImage", 'String'>;
    readonly imageUrl: Prisma.FieldRef<"AuthImage", 'String'>;
    readonly createdAt: Prisma.FieldRef<"AuthImage", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"AuthImage", 'DateTime'>;
}
/**
 * AuthImage findUnique
 */
export type AuthImageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter, which AuthImage to fetch.
     */
    where: Prisma.AuthImageWhereUniqueInput;
};
/**
 * AuthImage findUniqueOrThrow
 */
export type AuthImageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter, which AuthImage to fetch.
     */
    where: Prisma.AuthImageWhereUniqueInput;
};
/**
 * AuthImage findFirst
 */
export type AuthImageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter, which AuthImage to fetch.
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AuthImages to fetch.
     */
    orderBy?: Prisma.AuthImageOrderByWithRelationInput | Prisma.AuthImageOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for AuthImages.
     */
    cursor?: Prisma.AuthImageWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AuthImages from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AuthImages.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AuthImages.
     */
    distinct?: Prisma.AuthImageScalarFieldEnum | Prisma.AuthImageScalarFieldEnum[];
};
/**
 * AuthImage findFirstOrThrow
 */
export type AuthImageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter, which AuthImage to fetch.
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AuthImages to fetch.
     */
    orderBy?: Prisma.AuthImageOrderByWithRelationInput | Prisma.AuthImageOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for AuthImages.
     */
    cursor?: Prisma.AuthImageWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AuthImages from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AuthImages.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AuthImages.
     */
    distinct?: Prisma.AuthImageScalarFieldEnum | Prisma.AuthImageScalarFieldEnum[];
};
/**
 * AuthImage findMany
 */
export type AuthImageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter, which AuthImages to fetch.
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AuthImages to fetch.
     */
    orderBy?: Prisma.AuthImageOrderByWithRelationInput | Prisma.AuthImageOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing AuthImages.
     */
    cursor?: Prisma.AuthImageWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AuthImages from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AuthImages.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AuthImages.
     */
    distinct?: Prisma.AuthImageScalarFieldEnum | Prisma.AuthImageScalarFieldEnum[];
};
/**
 * AuthImage create
 */
export type AuthImageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * The data needed to create a AuthImage.
     */
    data: Prisma.XOR<Prisma.AuthImageCreateInput, Prisma.AuthImageUncheckedCreateInput>;
};
/**
 * AuthImage createMany
 */
export type AuthImageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuthImages.
     */
    data: Prisma.AuthImageCreateManyInput | Prisma.AuthImageCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * AuthImage createManyAndReturn
 */
export type AuthImageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * The data used to create many AuthImages.
     */
    data: Prisma.AuthImageCreateManyInput | Prisma.AuthImageCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * AuthImage update
 */
export type AuthImageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * The data needed to update a AuthImage.
     */
    data: Prisma.XOR<Prisma.AuthImageUpdateInput, Prisma.AuthImageUncheckedUpdateInput>;
    /**
     * Choose, which AuthImage to update.
     */
    where: Prisma.AuthImageWhereUniqueInput;
};
/**
 * AuthImage updateMany
 */
export type AuthImageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update AuthImages.
     */
    data: Prisma.XOR<Prisma.AuthImageUpdateManyMutationInput, Prisma.AuthImageUncheckedUpdateManyInput>;
    /**
     * Filter which AuthImages to update
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * Limit how many AuthImages to update.
     */
    limit?: number;
};
/**
 * AuthImage updateManyAndReturn
 */
export type AuthImageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * The data used to update AuthImages.
     */
    data: Prisma.XOR<Prisma.AuthImageUpdateManyMutationInput, Prisma.AuthImageUncheckedUpdateManyInput>;
    /**
     * Filter which AuthImages to update
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * Limit how many AuthImages to update.
     */
    limit?: number;
};
/**
 * AuthImage upsert
 */
export type AuthImageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * The filter to search for the AuthImage to update in case it exists.
     */
    where: Prisma.AuthImageWhereUniqueInput;
    /**
     * In case the AuthImage found by the `where` argument doesn't exist, create a new AuthImage with this data.
     */
    create: Prisma.XOR<Prisma.AuthImageCreateInput, Prisma.AuthImageUncheckedCreateInput>;
    /**
     * In case the AuthImage was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.AuthImageUpdateInput, Prisma.AuthImageUncheckedUpdateInput>;
};
/**
 * AuthImage delete
 */
export type AuthImageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
    /**
     * Filter which AuthImage to delete.
     */
    where: Prisma.AuthImageWhereUniqueInput;
};
/**
 * AuthImage deleteMany
 */
export type AuthImageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which AuthImages to delete
     */
    where?: Prisma.AuthImageWhereInput;
    /**
     * Limit how many AuthImages to delete.
     */
    limit?: number;
};
/**
 * AuthImage without action
 */
export type AuthImageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuthImage
     */
    select?: Prisma.AuthImageSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuthImage
     */
    omit?: Prisma.AuthImageOmit<ExtArgs> | null;
};
//# sourceMappingURL=AuthImage.d.ts.map