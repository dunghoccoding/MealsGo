import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse } from './authApi'

export interface AuthUser {
    id: number
    email: string
    fullName: string
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    vendorId: number | null
}

interface AuthState {
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<AuthResponse>
        ) => {
            const { token, userId, email, fullName, role, vendorId } = action.payload
            const user: AuthUser = { id: userId, email, fullName, role, vendorId }
            state.user = user
            state.token = token
            state.isAuthenticated = true
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('token', token)
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        },
    },
})

export const { setCredentials, logout } = authSlice.actions

export const selectCurrentUser = (state: any) => state.auth.user
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated
export const selectToken = (state: any) => state.auth.token

export default authSlice.reducer
