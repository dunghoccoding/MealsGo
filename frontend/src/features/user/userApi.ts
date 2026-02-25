import api from '../../app/api'

export interface UserProfile {
    id: number
    fullName: string
    email: string
    phone: string
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    avatar: string | null
    active: boolean
    createdAt: string
    vendorId: number | null
}

export const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUser: builder.query<UserProfile, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),
    }),
})

export const { useGetCurrentUserQuery } = userApi
