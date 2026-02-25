import api from '../../app/api'

export interface SelectedVariant {
    variantId: number
    groupName: string
    variantName: string
    priceAdjustment: number
}

export interface OrderItem {
    id: number
    productName: string
    quantity: number
    price: number
    subtotal: number
    selectedVariants: SelectedVariant[]
    productImage: string
}

export interface SubOrder {
    id: number
    subOrderNumber: string
    vendorId: number
    vendorName: string
    subtotal: number
    status: string
    items: OrderItem[]
    createdAt: string
    updatedAt: string
}

export interface OrderResponse {
    id: number
    orderNumber: string
    customerId: number
    customerName: string
    totalAmount: number
    shippingFee: number
    status: string
    paymentMethod: string
    deliveryName: string
    deliveryPhone: string
    deliveryAddress: string
    notes: string
    subOrders: SubOrder[]
    createdAt: string
    updatedAt: string
}

export interface CreateOrderRequest {
    addressId: number
    paymentMethod: 'COD' | 'BANK_TRANSFER'
    notes?: string
}

export interface UpdateSubOrderStatusRequest {
    subOrderId: number
    status: 'PENDING' | 'COOKING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'
}

export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createOrder: builder.mutation<OrderResponse, CreateOrderRequest>({
            query: (body) => ({
                url: '/orders',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Orders', 'Cart'],
        }),
        getOrders: builder.query<OrderResponse[], void>({
            query: () => '/orders',
            providesTags: ['Orders'],
        }),
        getOrderById: builder.query<OrderResponse, number>({
            query: (id) => `/orders/${id}`,
            providesTags: ['Orders'],
        }),
        updateSubOrderStatus: builder.mutation<SubOrder, UpdateSubOrderStatusRequest>({
            query: ({ subOrderId, status }) => ({
                url: `/orders/sub/${subOrderId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Orders'],
        }),
    }),
})

export const {
    useCreateOrderMutation,
    useGetOrdersQuery,
    useGetOrderByIdQuery,
    useUpdateSubOrderStatusMutation,
} = orderApi
