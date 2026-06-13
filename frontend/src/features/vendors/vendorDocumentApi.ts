import api from '../../app/api'

export interface VendorDocument {
  id: number
  vendorId: number
  documentType: 'BUSINESS_LICENSE' | 'FOOD_SAFETY_CERT' | 'ID_CARD' | 'OTHER'
  fileUrl: string
  fileName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  createdAt: string
}

export const vendorDocumentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadVendorDocument: builder.mutation<VendorDocument, FormData>({
      query: (formData) => ({
        url: '/vendors/documents',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['VendorDocuments'],
    }),
    getMyVendorDocuments: builder.query<VendorDocument[], void>({
      query: () => '/vendors/documents',
      providesTags: ['VendorDocuments'],
    }),
    // Admin endpoints
    getPendingVendors: builder.query<any[], void>({
      query: () => '/admin/vendors/pending',
      providesTags: ['VendorDocuments'],
    }),
    reviewDocument: builder.mutation<void, { id: number; status: string; reviewNote?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/vendor-documents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['VendorDocuments'],
    }),
  }),
})

export const {
  useUploadVendorDocumentMutation,
  useGetMyVendorDocumentsQuery,
  useGetPendingVendorsQuery,
  useReviewDocumentMutation,
} = vendorDocumentApi
