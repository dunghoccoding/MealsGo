import api from '../../app/api'

export interface Voucher {
  id: number
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderValue: number | null
  maxDiscount: number | null
  startDate: string
  endDate: string
  usageLimit: number | null
  usedCount: number
  vendorId: number | null
  vendorName: string | null
  active: boolean
  createdAt: string
}

export interface CreateVoucherRequest {
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit?: number
}

export interface ValidateVoucherResponse {
  valid: boolean
  discountAmount: number
  message: string
  voucher: Voucher | null
}

export const voucherApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActiveVouchers: builder.query<Voucher[], void>({
      query: () => '/vouchers',
      providesTags: ['Vouchers'],
    }),
    getMyVouchers: builder.query<Voucher[], void>({
      query: () => '/vouchers/my',
      providesTags: ['Vouchers'],
    }),
    getSystemVouchers: builder.query<Voucher[], void>({
      query: () => '/vouchers/system',
      providesTags: ['Vouchers'],
    }),
    createVoucher: builder.mutation<Voucher, CreateVoucherRequest>({
      query: (body) => ({
        url: '/vouchers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vouchers'],
    }),
    updateVoucher: builder.mutation<Voucher, { id: number } & Partial<CreateVoucherRequest>>({
      query: ({ id, ...body }) => ({
        url: `/vouchers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Vouchers'],
    }),
    deleteVoucher: builder.mutation<void, number>({
      query: (id) => ({
        url: `/vouchers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vouchers'],
    }),
    validateVoucher: builder.mutation<Voucher, { code: string; orderTotal: number; vendorId?: number }>({
      query: (body) => ({
        url: '/vouchers/validate',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetActiveVouchersQuery,
  useGetMyVouchersQuery,
  useGetSystemVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useValidateVoucherMutation,
} = voucherApi
