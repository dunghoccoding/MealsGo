import api from '../../app/api'
import type { Product } from '../products/productApi'

export const recommendationApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getRelatedProducts: builder.query<Product[], { productId: number; limit?: number }>({
            query: ({ productId, limit = 4 }) => ({
                url: `/recommendations/related/${productId}`,
                params: { limit },
            }),
            providesTags: ['Products'],
        }),
        getPersonalizedRecommendations: builder.query<Product[], { limit?: number } | void>({
            query: (params) => ({
                url: '/recommendations/personalized',
                params: { limit: params?.limit ?? 4 },
            }),
            providesTags: ['Products'],
        }),
    }),
})

export const {
    useGetRelatedProductsQuery,
    useGetPersonalizedRecommendationsQuery,
} = recommendationApi
