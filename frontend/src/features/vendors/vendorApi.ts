import api from '../../app/api'

export interface DailyRevenue {
    date: string
    revenue: number
    orderCount: number
}

export interface ProductSales {
    productName: string
    quantity: number
    revenue: number
}

export interface VendorStats {
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
    processingOrders: number
    completedOrders: number
    cancelledOrders: number
    revenueChart: DailyRevenue[]
    topProducts: ProductSales[]
    walletBalance: number
}

export const vendorApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getVendorStats: builder.query<VendorStats, void>({
            query: () => '/vendors/me/stats',
            providesTags: ['Orders'], // Refresh when orders change
        }),
        topupWallet: builder.mutation<any, { amount: number }>({
            query: (body) => ({
                url: '/vendors/wallet/topup',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'], // Invalidate user to fetch new balance
        }),
    }),
})

export const { useGetVendorStatsQuery, useTopupWalletMutation } = vendorApi
