import { useRef, useState } from 'react'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useGetCurrentUserQuery } from '../../features/user/userApi'
import {
    useGetAdminProductsQuery,
    useAdminUpdateProductMutation,
    useAdminDeleteProductMutation,
    type AdminUpdateProductRequest,
} from '../../features/admin/adminApi'
import { useUploadImageMutation } from '../../features/upload/uploadApi'
import { toast } from 'sonner'
import { useGetPendingVendorsQuery, useReviewDocumentMutation } from '../../features/vendors/vendorDocumentApi'
import { useGetSystemVouchersQuery, useCreateVoucherMutation, useDeleteVoucherMutation, type CreateVoucherRequest } from '../../features/vouchers/voucherApi'

const CATEGORIES = [
    { value: 'MAIN_DISH', label: '🍲 Món chính' },
    { value: 'SIDE_DISH', label: '🥗 Món phụ' },
    { value: 'DESSERT', label: '🍰 Tráng miệng' },
    { value: 'DRINK', label: '🥤 Đồ uống' },
    { value: 'SNACK', label: '🍿 Ăn vặt' },
] as const

const REGIONS = [
    { value: 'NORTH', label: '🔴 Miền Bắc' },
    { value: 'CENTRAL', label: '🟡 Miền Trung' },
    { value: 'SOUTH', label: '🟢 Miền Nam' },
] as const

const regionLabel = (r: string) => REGIONS.find(x => x.value === r)?.label || r
const categoryLabel = (c: string) => CATEGORIES.find(x => x.value === c)?.label || c

export default function AdminDashboardPage() {
    const user = useAppSelector(selectCurrentUser)
    const { data: meData } = useGetCurrentUserQuery(undefined, { pollingInterval: 15000 })
    const { data: productsData, isLoading } = useGetAdminProductsQuery({ size: 50 })
    const [updateProduct, { isLoading: updating }] = useAdminUpdateProductMutation()
    const [deleteProduct] = useAdminDeleteProductMutation()
    const [uploadImage] = useUploadImageMutation()

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<AdminUpdateProductRequest>({})
    const [editImages, setEditImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [searchFilter, setSearchFilter] = useState('')
    const [regionFilter, setRegionFilter] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    type Tab = 'products' | 'vendors' | 'vouchers'
    const [activeTab, setActiveTab] = useState<Tab>('products')

    // Vendor Document Hooks
    const { data: pendingVendors, isLoading: loadingVendors } = useGetPendingVendorsQuery()
    const [reviewDocument] = useReviewDocumentMutation()
    const [reviewNote, setReviewNote] = useState('')

    // Voucher Hooks
    const { data: systemVouchers, isLoading: loadingVouchers } = useGetSystemVouchersQuery()
    const [createVoucher, { isLoading: creatingVoucher }] = useCreateVoucherMutation()
    const [deleteVoucher] = useDeleteVoucherMutation()
    const [showVoucherForm, setShowVoucherForm] = useState(false)
    const [voucherForm, setVoucherForm] = useState<Partial<CreateVoucherRequest>>({ discountType: 'PERCENTAGE' })

    const handleReviewDoc = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await reviewDocument({ id, status, reviewNote }).unwrap()
            toast.success(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} tài liệu`)
            setReviewNote('')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thao tác thất bại')
        }
    }

    const handleCreateVoucher = async () => {
        try {
            if (!voucherForm.code || !voucherForm.discountValue || !voucherForm.startDate || !voucherForm.endDate) {
                return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            }
            await createVoucher(voucherForm as CreateVoucherRequest).unwrap()
            toast.success('Tạo Voucher hệ thống thành công!')
            setVoucherForm({ discountType: 'PERCENTAGE' })
            setShowVoucherForm(false)
        } catch (err: any) {
            toast.error(err?.data?.message || 'Tạo Voucher thất bại')
        }
    }

    const handleDeleteVoucher = async (id: number, code: string) => {
        if (!confirm(`Xoá voucher "${code}"?`)) return
        try {
            await deleteVoucher(id).unwrap()
            toast.success('Đã xoá voucher')
        } catch (err: any) {
            toast.error('Xoá thất bại')
        }
    }

    const products = productsData?.content || []

    const filteredProducts = products.filter(p => {
        const matchesSearch = !searchFilter || p.name.toLowerCase().includes(searchFilter.toLowerCase())
        const matchesRegion = !regionFilter || p.region === regionFilter
        return matchesSearch && matchesRegion
    })

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const startEdit = (product: any) => {
        setEditingId(product.id)
        setEditForm({
            name: product.name,
            description: product.description || '',
            basePrice: Number(product.basePrice),
            region: product.region,
            category: product.category,
            available: product.available,
            featured: product.featured,
        })
        setEditImages(product.images || [])
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({})
        setEditImages([])
    }

    const handleSave = async () => {
        if (editingId === null) return
        try {
            await updateProduct({
                id: editingId,
                body: { ...editForm, images: editImages },
            }).unwrap()
            toast.success('Cập nhật sản phẩm thành công!')
            cancelEdit()
        } catch (err: any) {
            toast.error(err?.data?.message || 'Cập nhật thất bại')
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Xoá sản phẩm "${name}"? Thao tác này không thể hoàn tác.`)) return
        try {
            await deleteProduct(id).unwrap()
            toast.success('Đã xoá sản phẩm')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Xoá thất bại')
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        setUploading(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file.type.startsWith('image/')) { toast.error(`"${file.name}" không phải file ảnh`); continue }
                if (file.size > 5 * 1024 * 1024) { toast.error(`"${file.name}" quá lớn (tối đa 5MB)`); continue }
                const formData = new FormData()
                formData.append('file', file)
                const result = await uploadImage(formData).unwrap()
                setEditImages(prev => [...prev, result.url])
                toast.success(`Đã tải "${file.name}"`)
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Tải ảnh thất bại')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeImage = (index: number) => {
        setEditImages(prev => prev.filter((_, i) => i !== index))
    }

    if (user?.role !== 'ADMIN') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
                <p className="text-gray-500">Chỉ tài khoản Admin mới có thể truy cập trang này.</p>
            </div>
        )
    }

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"

    return (
        <div>
            {/* Header */}
            <div className="bg-white p-6 shadow-sm border-b">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản trị viên</h1>
                        <p className="text-gray-500">Xin chào, {user?.fullName}</p>
                    </div>
                    
                    {/* Admin Wallet */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 px-6 py-3 rounded-xl border border-green-200 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center text-xl shadow-inner">
                            💰
                        </div>
                        <div>
                            <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Ví Hoa Hồng</p>
                            <p className="text-xl font-bold text-green-700">{formatPrice(meData?.balance || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
                <button 
                    onClick={() => setActiveTab('products')} 
                    className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sản phẩm
                </button>
                <button 
                    onClick={() => setActiveTab('vendors')} 
                    className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'vendors' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Duyệt cửa hàng
                </button>
                <button 
                    onClick={() => setActiveTab('vouchers')} 
                    className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'vouchers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kho Voucher Hệ Thống
                </button>
            </div>

            {activeTab === 'products' && (
                <>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Tổng sản phẩm</div>
                    <div className="text-3xl font-bold text-gray-900">{products.length}</div>
                </div>
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Miền Bắc</div>
                    <div className="text-3xl font-bold text-red-500">{products.filter(p => p.region === 'NORTH').length}</div>
                </div>
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Miền Trung</div>
                    <div className="text-3xl font-bold text-yellow-500">{products.filter(p => p.region === 'CENTRAL').length}</div>
                </div>
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Miền Nam</div>
                    <div className="text-3xl font-bold text-green-500">{products.filter(p => p.region === 'SOUTH').length}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="🔍 Tìm sản phẩm..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <select
                    value={regionFilter}
                    onChange={e => setRegionFilter(e.target.value)}
                    className={inputClass + ' max-w-[200px]'}
                >
                    <option value="">Tất cả vùng miền</option>
                    {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="text-sm text-gray-500">
                    Hiển thị {filteredProducts.length}/{products.length} sản phẩm
                </div>
            </div>

            {/* Product List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-500">Đang tải...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white border rounded-xl">
                    <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {editingId === product.id ? (
                                /* ========== EDIT MODE ========== */
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">✏️ Chỉnh sửa sản phẩm #{product.id}</h3>
                                        <span className="text-xs text-gray-400">Vendor: {product.vendorName}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                                            <input type="text" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                            <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                                            <input type="number" value={editForm.basePrice || ''} onChange={e => setEditForm(p => ({ ...p, basePrice: Number(e.target.value) }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                                            <select value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value as any }))} className={inputClass}>
                                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vùng miền</label>
                                            <select value={editForm.region || ''} onChange={e => setEditForm(p => ({ ...p, region: e.target.value as any }))} className={inputClass}>
                                                {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-end gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={editForm.available ?? true} onChange={e => setEditForm(p => ({ ...p, available: e.target.checked }))} className="w-4 h-4 text-indigo-500 rounded" />
                                                <span className="text-sm text-gray-700">Còn hàng</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={editForm.featured ?? false} onChange={e => setEditForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 text-indigo-500 rounded" />
                                                <span className="text-sm text-gray-700">Nổi bật</span>
                                            </label>
                                        </div>
                                        {/* Images */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh sản phẩm</label>
                                            <div className="flex flex-wrap gap-3 mb-3">
                                                {editImages.map((url, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <img src={url} alt={`Ảnh ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                                                        <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
                                                >
                                                    {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div> : '+'}
                                                </button>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4 pt-4 border-t">
                                        <button onClick={handleSave} disabled={updating} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50 transition-colors">
                                            {updating ? 'Đang lưu...' : '💾 Lưu'}
                                        </button>
                                        <button onClick={cancelEdit} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Huỷ</button>
                                    </div>
                                </div>
                            ) : (
                                /* ========== VIEW MODE ========== */
                                <div className="flex items-center gap-4 p-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        {product.images && product.images.length > 0 ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-green-100 to-green-200">🍜</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                                            {product.featured && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">⭐ Nổi bật</span>}
                                            {!product.available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Hết hàng</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{product.description}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>{regionLabel(product.region)}</span>
                                            <span>•</span>
                                            <span>{categoryLabel(product.category)}</span>
                                            <span>•</span>
                                            <span>🏪 {product.vendorName}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-lg font-bold text-indigo-600">{formatPrice(Number(product.basePrice))}</div>
                                        <div className="text-xs text-gray-400">Đã bán: {product.soldCount || 0}</div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => startEdit(product)}
                                            className="px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            className="px-3 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            🗑️ Xoá
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
                </>
            )}

            {activeTab === 'vendors' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Duyệt hồ sơ cửa hàng</h2>
                    {loadingVendors ? (
                        <div className="text-center py-8 text-gray-500">Đang tải...</div>
                    ) : pendingVendors && pendingVendors.length > 0 ? (
                        pendingVendors.map(vendor => (
                            <div key={vendor.id} className="bg-white border rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-lg mb-2">🏪 {vendor.storeName}</h3>
                                <p className="text-sm text-gray-600 mb-4">Chủ sở hữu: {vendor.user?.fullName} | {vendor.user?.email}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {vendor.documents?.map((doc: any) => (
                                        <div key={doc.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-sm text-indigo-700">{doc.documentType}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                                    doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline mb-4 truncate">
                                                Xem tài liệu: {doc.fileName}
                                            </a>
                                            
                                            {doc.status === 'PENDING' && (
                                                <div className="mt-auto space-y-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ghi chú (nếu từ chối)..." 
                                                        value={reviewNote} 
                                                        onChange={e => setReviewNote(e.target.value)}
                                                        className="w-full text-sm px-2 py-1 border rounded"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleReviewDoc(doc.id, 'APPROVED')} className="flex-1 bg-green-500 text-white text-xs py-1.5 rounded hover:bg-green-600">Duyệt</button>
                                                        <button onClick={() => handleReviewDoc(doc.id, 'REJECTED')} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded hover:bg-red-600">Từ chối</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
                            Không có hồ sơ nào đang chờ duyệt.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'vouchers' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Kho Voucher Hệ Thống</h2>
                        <button onClick={() => setShowVoucherForm(!showVoucherForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-sm">
                            {showVoucherForm ? 'Đóng' : '➕ Tạo Voucher Hệ Thống'}
                        </button>
                    </div>

                    {showVoucherForm && (
                        <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
                            <h3 className="font-bold mb-4">Tạo Voucher Mới</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input type="text" value={voucherForm.code || ''} onChange={e => setVoucherForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Mã Code (VD: FREESHIP)" className={inputClass} />
                                <select value={voucherForm.discountType} onChange={e => setVoucherForm(p => ({ ...p, discountType: e.target.value as any }))} className={inputClass}>
                                    <option value="PERCENTAGE">Giảm theo %</option>
                                    <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
                                </select>
                                <input type="text" value={voucherForm.description || ''} onChange={e => setVoucherForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả" className={inputClass} />
                                <input type="number" value={voucherForm.discountValue || ''} onChange={e => setVoucherForm(p => ({ ...p, discountValue: Number(e.target.value) }))} placeholder="Mức giảm" className={inputClass} />
                                <input type="number" value={voucherForm.minOrderValue || ''} onChange={e => setVoucherForm(p => ({ ...p, minOrderValue: Number(e.target.value) }))} placeholder="Đơn tối thiểu (VNĐ)" className={inputClass} />
                                <input type="number" value={voucherForm.maxDiscount || ''} onChange={e => setVoucherForm(p => ({ ...p, maxDiscount: Number(e.target.value) }))} placeholder="Giảm tối đa (VNĐ)" className={inputClass} />
                                <input type="datetime-local" value={voucherForm.startDate || ''} onChange={e => setVoucherForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} />
                                <input type="datetime-local" value={voucherForm.endDate || ''} onChange={e => setVoucherForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} />
                                <input type="number" value={voucherForm.usageLimit || ''} onChange={e => setVoucherForm(p => ({ ...p, usageLimit: Number(e.target.value) || undefined }))} placeholder="Số lượt sử dụng (để trống = vô hạn)" className={inputClass} />
                            </div>
                            <button onClick={handleCreateVoucher} disabled={creatingVoucher} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">
                                {creatingVoucher ? 'Đang tạo...' : 'Tạo Voucher'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingVouchers ? (
                            <div className="col-span-full text-center py-8">Đang tải...</div>
                        ) : systemVouchers && systemVouchers.length > 0 ? (
                            systemVouchers.map(v => (
                                <div key={v.id} className="border bg-white rounded-xl shadow-sm p-4 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        SYSTEM
                                    </div>
                                    <h4 className="font-bold text-lg text-indigo-700 mb-1">{v.code}</h4>
                                    <p className="text-sm text-gray-600 mb-2 font-medium">{v.description}</p>
                                    <div className="text-xs text-gray-500 space-y-1 mb-4 flex-1">
                                        <p>Giảm: <span className="font-bold text-gray-900">{v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatPrice(v.discountValue)}</span></p>
                                        <p>Từ: {new Date(v.startDate).toLocaleDateString()} - Đến: {new Date(v.endDate).toLocaleDateString()}</p>
                                        <p>Đã dùng: {v.usedCount} {v.usageLimit ? `/ ${v.usageLimit}` : '(Không giới hạn)'}</p>
                                    </div>
                                    <button onClick={() => handleDeleteVoucher(v.id, v.code)} className="w-full py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                                        Xoá Voucher
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-500 bg-white border rounded-xl">Chưa có voucher hệ thống nào.</div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}
