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

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUser: builder.query<UserProfile, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),
        changePassword: builder.mutation<string, ChangePasswordRequest>({
            query: (data) => ({
                url: '/auth/change-password',
                method: 'POST',
                body: data,
                responseHandler: (response) => response.text(),
            }),
        }),
    }),
})

export const { useGetCurrentUserQuery, useChangePasswordMutation } = userApi
