import { useRef, useState } from 'react'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'
import {
    useGetAdminProductsQuery,
    useAdminUpdateProductMutation,
    useAdminDeleteProductMutation,
    type AdminUpdateProductRequest,
} from '../../features/admin/adminApi'
import { useUploadImageMutation } from '../../features/upload/uploadApi'
import { toast } from 'sonner'

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">⚙️</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý hệ thống</h1>
                        <p className="text-gray-500 text-sm">Xin chào, {user?.fullName} — Quản trị viên</p>
                    </div>
                </div>
            </div>

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
        </div>
    )
}
