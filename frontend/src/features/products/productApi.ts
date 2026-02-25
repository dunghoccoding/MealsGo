import api from '../../app/api'

export interface Product {
    id: number
    vendorId: number
    vendorName: string
    name: string
    description: string
    basePrice: number
    region: 'NORTH' | 'CENTRAL' | 'SOUTH'
    category: string
    images: string[]
    available: boolean
    featured: boolean
    soldCount: number
    rating: number
    reviewCount: number
    variantGroups: VariantGroup[]
}

export interface VariantGroup {
    id: number
    name: string
    isMultiSelect: boolean
    isRequired: boolean
    variants: Variant[]
}

export interface Variant {
    id: number
    name: string
    priceAdjustment: number
}

export interface ProductsResponse {
    content: Product[]
    totalPages: number
    totalElements: number
    number: number
    size: number
}

export interface ProductQueryParams {
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: string
    vendorId?: number
    region?: string
    category?: string
    search?: string
    available?: boolean
}

export interface CreateProductRequest {
    name: string
    description?: string
    basePrice: number
    region: 'NORTH' | 'CENTRAL' | 'SOUTH'
    category: 'MAIN_DISH' | 'SIDE_DISH' | 'DESSERT' | 'DRINK' | 'SNACK'
    images?: string[]
    available?: boolean
    featured?: boolean
}

export const productApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<ProductsResponse, ProductQueryParams | void>({
            query: (params) => ({
                url: '/products',
                params: params ? {
                    page: params.page ?? 0,
                    size: params.size ?? 12,
                    sortBy: params.sortBy ?? 'createdAt',
                    sortDirection: params.sortDirection ?? 'DESC',
                    ...(params.region ? { region: params.region } : {}),
                    ...(params.category ? { category: params.category } : {}),
                    ...(params.vendorId ? { vendorId: params.vendorId } : {}),
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.available !== undefined ? { available: params.available } : {}),
                } : { page: 0, size: 12 }
            }),
            providesTags: ['Products']
        }),
        getProductById: builder.query<Product, number>({
            query: (id) => `/products/${id}`,
            providesTags: ['Products']
        }),
        createProduct: builder.mutation<Product, CreateProductRequest>({
            query: (body) => ({
                url: '/products',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Products'],
        }),
        deleteProduct: builder.mutation<void, number>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Products'],
        }),
    }),
})

export const { useGetProductsQuery, useGetProductByIdQuery, useCreateProductMutation, useDeleteProductMutation } = productApi
