import api from '../../app/api'
import type { ProductsResponse, ProductQueryParams } from '../products/productApi'

export interface AdminUpdateProductRequest {
    name?: string
    description?: string
    basePrice?: number
    region?: 'NORTH' | 'CENTRAL' | 'SOUTH'
    category?: 'MAIN_DISH' | 'SIDE_DISH' | 'DESSERT' | 'DRINK' | 'SNACK'
    images?: string[]
    available?: boolean
    featured?: boolean
}

export const adminApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAdminProducts: builder.query<ProductsResponse, ProductQueryParams | void>({
            query: (params) => ({
                url: '/admin/products',
                params: params ? {
                    page: params.page ?? 0,
                    size: params.size ?? 50,
                    sortBy: params.sortBy ?? 'createdAt',
                    sortDirection: params.sortDirection ?? 'DESC',
                    ...(params.region ? { region: params.region } : {}),
                    ...(params.category ? { category: params.category } : {}),
                    ...(params.vendorId ? { vendorId: params.vendorId } : {}),
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.available !== undefined ? { available: params.available } : {}),
                } : { page: 0, size: 50 }
            }),
            providesTags: ['Products']
        }),
        adminUpdateProduct: builder.mutation<any, { id: number; body: AdminUpdateProductRequest }>({
            query: ({ id, body }) => ({
                url: `/admin/products/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Products'],
        }),
        adminDeleteProduct: builder.mutation<void, number>({
            query: (id) => ({
                url: `/admin/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Products'],
        }),
    }),
})

export const {
    useGetAdminProductsQuery,
    useAdminUpdateProductMutation,
    useAdminDeleteProductMutation,
} = adminApi
