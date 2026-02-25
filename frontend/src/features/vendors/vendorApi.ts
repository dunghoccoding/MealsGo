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
}

export const vendorApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getVendorStats: builder.query<VendorStats, void>({
            query: () => '/vendors/me/stats',
            providesTags: ['Orders'], // Refresh when orders change
        }),
    }),
})

export const { useGetVendorStatsQuery } = vendorApi
