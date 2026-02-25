import api from '../../app/api'

export interface AddressResponse {
    id: number
    recipientName: string
    recipientPhone: string
    addressLine: string
    ward: string
    district: string
    city: string
    fullAddress: string
    isDefault: boolean
    label: string
}

export interface AddressRequest {
    recipientName: string
    recipientPhone: string
    addressLine: string
    ward: string
    district: string
    city: string
    isDefault?: boolean
    label?: string
}

export const addressApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAddresses: builder.query<AddressResponse[], void>({
            query: () => '/addresses',
            providesTags: ['Addresses'],
        }),
        createAddress: builder.mutation<AddressResponse, AddressRequest>({
            query: (body) => ({
                url: '/addresses',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Addresses'],
        }),
        updateAddress: builder.mutation<AddressResponse, { id: number; data: AddressRequest }>({
            query: ({ id, data }) => ({
                url: `/addresses/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Addresses'],
        }),
        deleteAddress: builder.mutation<void, number>({
            query: (id) => ({
                url: `/addresses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Addresses'],
        }),
        setDefaultAddress: builder.mutation<AddressResponse, number>({
            query: (id) => ({
                url: `/addresses/${id}/set-default`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Addresses'],
        }),
    }),
})

export const {
    useGetAddressesQuery,
    useCreateAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useSetDefaultAddressMutation,
} = addressApi
