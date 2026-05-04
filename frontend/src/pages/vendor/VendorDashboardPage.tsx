import { useRef, useState, useEffect, useMemo } from 'react'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useGetOrdersQuery, useUpdateSubOrderStatusMutation } from '../../features/orders/orderApi'
import { useGetProductsQuery, useCreateProductMutation, useDeleteProductMutation, type CreateProductRequest } from '../../features/products/productApi'
import { useGetVendorStatsQuery } from '../../features/vendors/vendorApi'
import { useUploadImageMutation } from '../../features/upload/uploadApi'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'

type Tab = 'overview' | 'orders' | 'products'
type OrderTab = 'PENDING' | 'COOKING' | 'READY' | 'DELIVERING' | 'HISTORY'

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

const initialProductForm = {
    name: '',
    description: '',
    basePrice: '',
    region: '' as string,
    category: '' as string,
    available: true,
    featured: false,
}

export default function VendorDashboardPage() {
    const user = useAppSelector(selectCurrentUser)
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>('PENDING')
    const { data: orders, isLoading: loadingOrders, isFetching: fetchingOrders, isError: ordersError, refetch: refetchOrders } = useGetOrdersQuery(undefined, {
        pollingInterval: 15000
    })
    const { data: productsData, isLoading: loadingProducts } = useGetProductsQuery({ vendorId: user?.vendorId ?? undefined })
    const { data: stats, isLoading: loadingStats } = useGetVendorStatsQuery(undefined, {
        pollingInterval: 30000
    })
    const [createProduct, { isLoading: creating }] = useCreateProductMutation()
    const [deleteProduct] = useDeleteProductMutation()
    const [uploadImage] = useUploadImageMutation()
    const [updateSubOrderStatus, { isLoading: updatingStatus }] = useUpdateSubOrderStatusMutation()
    const [showAddForm, setShowAddForm] = useState(false)
    const [form, setForm] = useState(initialProductForm)
    const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId: string }[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Countdown state: { subOrderId: secondsRemaining }
    const [countdowns, setCountdowns] = useState<Record<number, number>>({})

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Chờ xử lý',
            CONFIRMED: 'Đã xác nhận',
            PROCESSING: 'Đang xử lý',
            COOKING: 'Đang nấu',
            READY: 'Sẵn sàng',
            PICKED_UP: 'Shipper đã lấy',
            DELIVERING: 'Đang giao',
            DELIVERED: 'Đã giao',
            COMPLETED: 'Hoàn thành',
            CANCELLED: 'Đã huỷ',
        }
        return labels[status] || status
    }

    const handleUpdateStatus = async (subOrderId: number, newStatus: string) => {
        try {
            await updateSubOrderStatus({ subOrderId, status: newStatus as any }).unwrap()
            toast.success('Đã cập nhật trạng thái đơn hàng')

            // If starting cooking, start countdown
            if (newStatus === 'COOKING') {
                setCountdowns(prev => ({ ...prev, [subOrderId]: 30 }))
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Cập nhật thất bại')
        }
    }

    // Effect to handle countdowns
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdowns(prev => {
                const next = { ...prev }
                let changed = false

                Object.keys(next).forEach(key => {
                    const id = Number(key)
                    if (next[id] > 0) {
                        next[id] -= 1
                        changed = true
                    }
                })

                return changed ? next : prev
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        Object.entries(countdowns).forEach(([idStr, seconds]) => {
            const id = Number(idStr)
            if (seconds === 0) {
                setCountdowns(prev => {
                    const next = { ...prev }
                    delete next[id]
                    return next
                })
                updateSubOrderStatus({ subOrderId: id, status: 'READY' as any })
                    .unwrap()
                    .then(() => toast.success(`Đơn #${id} đã tự động chuyển sang Sẵn sàng`))
                    .catch(() => toast.error(`Lỗi tự động cập nhật đơn #${id}`))
            }
        })
    }, [countdowns, updateSubOrderStatus])

    const products = productsData?.content || []

    const revenueData = useMemo(() => {
        if (!stats?.revenueChart) return []
        return [...stats.revenueChart].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => ({
                ...item,
                displayName: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
            }))
    }, [stats])

    // Robust stats calculation with fallbacks
    const computedStats = useMemo(() => {
        const localStats = {
            totalRevenue: 0,
            totalOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalProducts: products.length
        }

        if (orders) {
            localStats.totalOrders = orders.length
            orders.forEach(o => {
                const vendorSubOrders = o.subOrders || []
                vendorSubOrders.forEach(s => {
                    if (s.status === 'DELIVERED' || o.status === 'COMPLETED') {
                        localStats.completedOrders++
                        localStats.totalRevenue += (s.subtotal || 0)
                    } else if (s.status === 'PENDING' && o.status !== 'CANCELLED') {
                        localStats.pendingOrders++
                    } else if (s.status === 'CANCELLED' || o.status === 'CANCELLED') {
                        localStats.cancelledOrders++
                    } else {
                        localStats.processingOrders++
                    }
                })
            })
        }

        return {
            totalRevenue: stats?.totalRevenue ?? localStats.totalRevenue,
            totalOrders: stats?.totalOrders ?? localStats.totalOrders,
            pendingOrders: stats?.pendingOrders ?? localStats.pendingOrders,
            processingOrders: stats?.processingOrders ?? localStats.processingOrders,
            completedOrders: stats?.completedOrders ?? localStats.completedOrders,
            cancelledOrders: stats?.cancelledOrders ?? localStats.cancelledOrders,
            totalProducts: localStats.totalProducts
        }
    }, [stats, orders, products.length])

    const orderStatusData = useMemo(() => {
        if (!stats) return []
        return [
            { name: 'Hoàn thành', value: computedStats.completedOrders, color: '#10B981' },
            { name: 'Đang xử lý', value: computedStats.processingOrders, color: '#3B82F6' },
            { name: 'Chờ xử lý', value: computedStats.pendingOrders, color: '#F59E0B' },
            { name: 'Đã huỷ', value: computedStats.cancelledOrders, color: '#EF4444' },
        ].filter(d => d.value > 0)
    }, [stats, computedStats])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... existing upload logic ...
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
                setUploadedImages(prev => [...prev, { url: result.url, publicId: result.publicId }])
                toast.success(`Đã tải "${file.name}"`)
            }
        } catch (err: any) {
            console.error('Upload error:', err)
            const msg = err?.data?.message || err?.data?.error || err?.message || 'Tải ảnh thất bại'
            toast.error(msg)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeUploadedImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleCreateProduct = async () => {
        // ... existing create logic ...
        if (!form.name.trim()) { toast.error('Tên sản phẩm là bắt buộc'); return }
        if (!form.basePrice || Number(form.basePrice) <= 0) { toast.error('Giá phải lớn hơn 0'); return }
        if (!form.region) { toast.error('Vui lòng chọn vùng miền'); return }
        if (!form.category) { toast.error('Vui lòng chọn danh mục'); return }

        try {
            const productData: CreateProductRequest = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                basePrice: Number(form.basePrice),
                region: form.region as CreateProductRequest['region'],
                category: form.category as CreateProductRequest['category'],
                images: uploadedImages.map(img => img.url),
                available: form.available,
                featured: form.featured,
            }
            await createProduct(productData).unwrap()
            toast.success('Thêm sản phẩm thành công!')
            setForm(initialProductForm)
            setUploadedImages([])
            setShowAddForm(false)
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thêm sản phẩm thất bại')
        }
    }

    const tabs = [
        { id: 'overview' as Tab, label: 'Tổng quan' },
        { id: 'orders' as Tab, label: `Đơn hàng (${computedStats.totalOrders})` },
        { id: 'products' as Tab, label: `Sản phẩm (${computedStats.totalProducts})` },
    ]

    const orderTabs = [
        { id: 'PENDING' as OrderTab, label: 'Chờ xác nhận' },
        { id: 'COOKING' as OrderTab, label: 'Đang nấu' },
        { id: 'READY' as OrderTab, label: 'Sẵn sàng' },
        { id: 'DELIVERING' as OrderTab, label: 'Đang giao' },
        { id: 'HISTORY' as OrderTab, label: 'Lịch sử' },
    ]

    // ... existing delete logic ...
    const handleDeleteProduct = async (id: number, name: string) => {
        if (!confirm(`Xoá sản phẩm "${name}"?`)) return
        try {
            await deleteProduct(id).unwrap()
            toast.success('Đã xoá sản phẩm')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Xoá thất bại')
        }
    }

    // ... existing filter logic ...

    // ... existing filter logic ...
    const getFilteredOrders = () => {
        if (!orders) return []
        return orders.filter(order => {
            if (!order.subOrders || order.subOrders.length === 0) return false

            // Safeguard: If main order is already COMPLETED or CANCELLED, it should only be in HISTORY
            if (activeOrderTab !== 'HISTORY' && (order.status === 'COMPLETED' || order.status === 'CANCELLED')) {
                return false
            }

            return order.subOrders.some(sub => {
                if (activeOrderTab === 'HISTORY') {
                    return sub.status === 'DELIVERED' || sub.status === 'CANCELLED' || order.status === 'COMPLETED' || order.status === 'CANCELLED'
                } else if (activeOrderTab === 'DELIVERING') {
                    return sub.status === 'DELIVERING' || sub.status === 'PICKED_UP'
                }
                return sub.status === activeOrderTab
            })
        }).map(order => {
            const relevantSubOrders = order.subOrders?.filter(sub => {
                if (activeOrderTab === 'HISTORY') {
                    return sub.status === 'DELIVERED' || sub.status === 'CANCELLED' || order.status === 'COMPLETED' || order.status === 'CANCELLED'
                } else if (activeOrderTab === 'DELIVERING') {
                    return sub.status === 'DELIVERING' || sub.status === 'PICKED_UP'
                }
                return sub.status === activeOrderTab
            })
            return { ...order, subOrders: relevantSubOrders }
        }).filter(order => order.subOrders && order.subOrders.length > 0)
    }

    const filteredOrders = getFilteredOrders()
    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header, Main Tabs, Overview Tab - kept same */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý cửa hàng</h1>
                    <p className="text-gray-500 mt-1">Xin chào, {user?.fullName || 'Chủ cửa hàng'}!</p>
                </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto border-b pb-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-3 rounded-t-lg font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Tổng doanh thu</span>
                                <span className="text-2xl">💰</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 truncate">{formatPrice(computedStats.totalRevenue)}</p>
                        </div>
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Đơn hàng mới</span>
                                <span className="text-2xl">📋</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{computedStats.pendingOrders}</p>
                        </div>
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Đã hoàn thành</span>
                                <span className="text-2xl">✅</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{computedStats.completedOrders}</p>
                        </div>
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Sản phẩm</span>
                                <span className="text-2xl">🍜</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{computedStats.totalProducts}</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                📈 Xu hướng doanh thu (7 ngày qua)
                            </h3>
                            <div className="h-[300px] w-full">
                                {loadingStats ? (
                                    <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                                ) : revenueData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `${v / 1000}k`} />
                                            <Tooltip
                                                formatter={(v: any) => [formatPrice(Number(v)), 'Doanh thu']}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu doanh thu</div>
                                )}
                            </div>
                        </div>

                        {/* Order Pie Chart */}
                        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col h-full">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Tỉ lệ đơn hàng</h3>
                            <div className="flex-1 min-h-[220px] w-full relative">
                                {orderStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={orderStatusData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {orderStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">Chưa có đơn hàng</div>
                                )}
                            </div>
                            {/* Legend */}
                            {orderStatusData.length > 0 && (
                                <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
                                    {orderStatusData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* ... existing quick actions ... */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button onClick={() => setActiveTab('orders')} className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                                <span className="text-2xl">📋</span>
                                <div className="text-left"><p className="font-semibold text-gray-800">Xem đơn hàng</p><p className="text-xs text-gray-500">{computedStats.pendingOrders} đơn chờ xử lý</p></div>
                            </button>
                            <button onClick={() => { setActiveTab('products'); setShowAddForm(true) }} className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                                <span className="text-2xl">➕</span>
                                <div className="text-left"><p className="font-semibold text-gray-800">Thêm sản phẩm mới</p><p className="text-xs text-gray-500">Đăng bán món mới</p></div>
                            </button>
                            <Link to="/profile" className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                <span className="text-2xl">👤</span>
                                <div className="text-left"><p className="font-semibold text-gray-800">Tài khoản</p><p className="text-xs text-gray-500">Thông tin cá nhân</p></div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Quản lý đơn hàng {fetchingOrders && !loadingOrders && <span className="ml-3 text-sm font-normal text-gray-400 animate-pulse">Đang cập nhật...</span>}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {orderTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveOrderTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeOrderTab === tab.id ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{tab.label}</button>
                        ))}
                    </div>

                    {loadingOrders ? (
                        <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                    ) : ordersError ? (
                        <div className="text-center py-12 bg-white border border-red-200 rounded-xl">
                            <div className="text-6xl mb-4">⚠️</div>
                            <p className="text-red-500 text-lg font-semibold">Lỗi tải dữ liệu đơn hàng</p>
                            <button onClick={refetchOrders} className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-green-700">Tải lại</button>
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrders.map(order => (
                                <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-gray-800">Đơn #{order.orderNumber}</span>
                                            <span className="text-sm text-gray-500 ml-3">{new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        {order.subOrders?.map(sub => (
                                            <div key={sub.id} className="mb-3 last:mb-0 border-b last:border-0 pb-3 last:pb-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-medium text-gray-700">#{sub.subOrderNumber}</p>

                                                        {/* Show countdown if cooking */}
                                                        {sub.status === 'COOKING' && countdowns[sub.id] !== undefined && (
                                                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded animate-pulse">
                                                                ⏳ Chuẩn bị giao sau: {countdowns[sub.id]}s
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{getStatusLabel(sub.status)}</span>
                                                </div>
                                                {sub.items?.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center py-1 text-sm pl-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-700">{item.productName}</span>
                                                            <span className="text-gray-400">x{item.quantity}</span>
                                                        </div>
                                                        <span className="font-medium text-gray-800">{formatPrice(item.subtotal)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                                                    <span className="text-sm font-semibold text-primary">{formatPrice(sub.subtotal)}</span>
                                                    <div className="flex gap-2">
                                                        {sub.status === 'PENDING' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(sub.id, 'COOKING')} disabled={updatingStatus} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50">Xác nhận & Nấu</button>
                                                                <button onClick={() => handleUpdateStatus(sub.id, 'CANCELLED')} disabled={updatingStatus} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded hover:bg-red-100 transition-colors disabled:opacity-50">Huỷ đơn</button>
                                                            </>
                                                        )}
                                                        {/* COOKING -> No button, auto transition */}
                                                        {sub.status === 'COOKING' && (
                                                            <div className="text-sm text-gray-500 italic">Đang nấu món... ({countdowns[sub.id] || 0}s)</div>
                                                        )}
                                                        {/* READY button just in case manual override needed? User wanted auto. But maybe keep manual as backup? */}
                                                        {/* User said: "setup 30s đếm ngược , rồi chuyển sang phần đang giao luôn" */}

                                                        {sub.status === 'DELIVERING' && (
                                                            <button onClick={() => handleUpdateStatus(sub.id, 'DELIVERED')} disabled={updatingStatus} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50">Đã giao hàng</button>
                                                        )}

                                                        {/* If somehow stuck in READY */}
                                                        {sub.status === 'READY' && (
                                                            <button onClick={() => handleUpdateStatus(sub.id, 'PICKED_UP')} disabled={updatingStatus} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded hover:bg-purple-700 transition-colors disabled:opacity-50">Giao hàng</button>
                                                        )}

                                                        {sub.status === 'PICKED_UP' && (
                                                            <button onClick={() => handleUpdateStatus(sub.id, 'DELIVERED')} disabled={updatingStatus} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50">Đã giao hàng</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t mt-3 pt-3 space-y-1">
                                            <div className="flex justify-between items-center"><span className="text-sm text-gray-500">📍 {order.deliveryAddress}</span></div>
                                            <div className="flex gap-4 text-xs text-gray-500"><span>👤 {order.deliveryName}</span><span>📞 {order.deliveryPhone}</span>{order.notes && <span>📝 {order.notes}</span>}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white border rounded-xl"><p className="text-gray-500 text-lg">Không có đơn hàng nào</p></div>
                    )}
                </div>
            )}

            {activeTab === 'products' && (
                <div>
                    {/* ... existing products tab ... */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Sản phẩm của bạn</h2>
                        <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-md">{showAddForm ? 'Đóng' : 'Thêm sản phẩm'}</button>
                    </div>
                    {/* ... form ... */}
                    {showAddForm && (
                        <div className="bg-white border-2 border-primary/30 rounded-xl p-6 shadow-lg mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm sản phẩm mới</h3>
                            {/* ... (abbreviated form content similar to original file) ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Phở bò Hà Nội" className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                                    <input type="number" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                                        <option value="">-- Chọn danh mục --</option>
                                        {CATEGORIES.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vùng miền *</label>
                                    <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className={inputClass}>
                                        <option value="">-- Chọn vùng miền --</option>
                                        {REGIONS.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    {/* ... upload UI ... */}
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh sản phẩm</label>
                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-green-50/30 transition-all">
                                        {uploading ? <div className="flex flex-col items-center gap-2"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div><p className="text-sm text-gray-500">Đang tải ảnh lên...</p></div> : <><p className="text-sm font-medium text-gray-700">Nhấn để chọn ảnh từ máy tính</p><p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG, WebP — Tối đa 5MB mỗi ảnh</p></>}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                    {uploadedImages.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {uploadedImages.map((img, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={img.url} alt={`Ảnh ${idx + 1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                    <button onClick={() => removeUploadedImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} className="w-4 h-4 text-primary rounded" /><span className="text-sm text-gray-700">Còn hàng</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 text-primary rounded" /><span className="text-sm text-gray-700">Sản phẩm nổi bật</span></label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleCreateProduct} disabled={creating} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-70 shadow-md">{creating ? 'Đang tạo...' : 'Thêm sản phẩm'}</button>
                                <button onClick={() => { setShowAddForm(false); setForm(initialProductForm); setUploadedImages([]) }} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all font-medium">Huỷ</button>
                            </div>
                        </div>
                    )}

                    {loadingProducts ? (
                        <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map(product => (
                                <div key={product.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <Link to={`/product/${product.id}`}>
                                        <div className="h-40 bg-gray-200 overflow-hidden">
                                            {product.images && product.images.length > 0 ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-100 to-green-200">🍜</div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-primary">{formatPrice(Number(product.basePrice))}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.available ? 'Còn hàng' : 'Hết hàng'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`/product/${product.id}`} className="flex-1 text-center text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Xem</Link>
                                            <button onClick={() => handleDeleteProduct(product.id, product.name)} className="text-xs px-3 py-1.5 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 font-medium">Xoá</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white border rounded-xl">
                            <p className="text-gray-500 text-lg">Chưa có sản phẩm nào</p>
                            <p className="text-sm text-gray-400 mt-1">Hãy thêm sản phẩm đầu tiên của bạn</p>
                            {!showAddForm && <button onClick={() => setShowAddForm(true)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-md">Thêm sản phẩm đầu tiên</button>}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
