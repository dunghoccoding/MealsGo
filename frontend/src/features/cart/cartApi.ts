import api from '../../app/api'

export interface SelectedVariant {
    variantId: number
    groupName: string
    variantName: string
    priceAdjustment: number
}

export interface CartItemProduct {
    id: number
    name: string
    basePrice: number
    images: string[]
    vendorName: string
}

export interface CartItem {
    id: number
    product: CartItemProduct
    quantity: number
    selectedVariants: SelectedVariant[]
    itemPrice: number
    subtotal: number
    vendorName: string
    vendorId: number
}

export interface CartResponse {
    id: number
    items: CartItem[]
    itemsByVendor: Record<string, CartItem[]>
    totalAmount: number
    totalItems: number
}

export interface AddToCartRequest {
    productId: number
    quantity: number
    selectedVariants?: SelectedVariant[]
}

export interface UpdateCartItemRequest {
    quantity: number
}

export const cartApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCart: builder.query<CartResponse, void>({
            query: () => '/cart',
            providesTags: ['Cart'],
        }),
        addToCart: builder.mutation<CartItem, AddToCartRequest>({
            query: (body) => ({
                url: '/cart/items',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Cart'],
        }),
        updateCartItem: builder.mutation<CartItem, { itemId: number; quantity: number }>({
            query: ({ itemId, quantity }) => ({
                url: `/cart/items/${itemId}`,
                method: 'PATCH',
                body: { quantity },
            }),
            invalidatesTags: ['Cart'],
        }),
        removeCartItem: builder.mutation<void, number>({
            query: (itemId) => ({
                url: `/cart/items/${itemId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),
        clearCart: builder.mutation<void, void>({
            query: () => ({
                url: '/cart',
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),
    }),
})

export const {
    useGetCartQuery,
    useAddToCartMutation,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
} = cartApi
