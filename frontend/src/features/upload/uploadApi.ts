import api from '../../app/api'

export interface UploadResponse {
    url: string
    publicId: string
    format: string
    size: number
    width: number
    height: number
}

export const uploadApi = api.injectEndpoints({
    endpoints: (builder) => ({
        uploadImage: builder.mutation<UploadResponse, FormData>({
            query: (formData) => ({
                url: '/upload/image',
                method: 'POST',
                body: formData,
                formData: true,
            }),
        }),
    }),
})

export const { useUploadImageMutation } = uploadApi
