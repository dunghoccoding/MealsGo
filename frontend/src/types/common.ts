// Common types shared across the application

export interface User {
    id: number
    email: string
    fullName: string
    phone: string
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    createdAt: string
}

export interface Region {
    value: 'NORTH' | 'CENTRAL' | 'SOUTH'
    label: string
    color: string
}

export interface PaginationParams {
    page?: number
    size?: number
    sort?: string
}

export interface ApiError {
    message: string
    status: number
    timestamp: string
}
