import api from '../../app/api'

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    fullName: string
    email: string
    password: string
    phone?: string
    role: 'CUSTOMER' | 'VENDOR'
    // Vendor-specific fields
    storeName?: string
    storeAddress?: string
    region?: string
}

export interface AuthResponse {
    token: string
    type: string
    userId: number
    email: string
    fullName: string
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    vendorId: number | null
}

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
    }),
})

export const { useLoginMutation, useRegisterMutation } = authApi
