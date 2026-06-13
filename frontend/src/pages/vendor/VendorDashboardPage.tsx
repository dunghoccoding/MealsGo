import { useRef, useState, useEffect, useMemo } from 'react'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useGetOrdersQuery, useUpdateSubOrderStatusMutation } from '../../features/orders/orderApi'
import { useGetProductsQuery, useCreateProductMutation, useDeleteProductMutation, useGetListingFeeInfoQuery, type CreateProductRequest } from '../../features/products/productApi'
import { useGetVendorStatsQuery, useTopupWalletMutation } from '../../features/vendors/vendorApi'
import { useUploadImageMutation } from '../../features/upload/uploadApi'
import { useGetMyVouchersQuery, useCreateVoucherMutation, useDeleteVoucherMutation, type CreateVoucherRequest } from '../../features/vouchers/voucherApi'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'

type Tab = 'overview' | 'orders' | 'products' | 'vouchers'
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
    const { data: feeInfo } = useGetListingFeeInfoQuery()
    const { data: myVouchers, isLoading: loadingVouchers } = useGetMyVouchersQuery()
    const [createVoucher, { isLoading: creatingVoucher }] = useCreateVoucherMutation()
    const [deleteVoucher] = useDeleteVoucherMutation()
    const [showAddForm, setShowAddForm] = useState(false)
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [showTopupModal, setShowTopupModal] = useState(false)
    const [topupAmount, setTopupAmount] = useState('')
    const [topupWallet, { isLoading: toppingUp }] = useTopupWalletMutation()
    const [showVoucherForm, setShowVoucherForm] = useState(false)
    const [voucherForm, setVoucherForm] = useState<Partial<CreateVoucherRequest>>({
        code: '', description: '', discountType: 'PERCENTAGE', discountValue: 0,
        minOrderValue: 0, maxDiscount: 0, startDate: '', endDate: '', usageLimit: undefined,
    })
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

    const handleShowFeeModal = () => {
        if (!form.name.trim()) { toast.error('Tên sản phẩm là bắt buộc'); return }
        if (!form.basePrice || Number(form.basePrice) <= 0) { toast.error('Giá phải lớn hơn 0'); return }
        if (!form.region) { toast.error('Vui lòng chọn vùng miền'); return }
        if (!form.category) { toast.error('Vui lòng chọn danh mục'); return }
        setShowFeeModal(true)
    }

    const handleCreateProduct = async () => {
        setShowFeeModal(false)
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
            const fee = feeInfo?.nextFee ?? 100000
            toast.success(`Thêm sản phẩm thành công! Phí đăng: ${formatPrice(fee)}`)
            setForm(initialProductForm)
            setUploadedImages([])
            setShowAddForm(false)
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thêm sản phẩm thất bại')
        }
    }

    const handleCreateVoucher = async () => {
        if (!voucherForm.code || !voucherForm.description || !voucherForm.startDate || !voucherForm.endDate) {
            toast.error('Vui lòng điền đầy đủ thông tin'); return
        }
        try {
            await createVoucher(voucherForm as CreateVoucherRequest).unwrap()
            toast.success('Tạo voucher thành công!')
            setVoucherForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderValue: 0, maxDiscount: 0, startDate: '', endDate: '', usageLimit: undefined })
            setShowVoucherForm(false)
        } catch (err: any) {
            toast.error(err?.data?.message || 'Tạo voucher thất bại')
        }
    }

    const handleDeleteVoucher = async (id: number, code: string) => {
        if (!confirm(`Xoá voucher "${code}"?`)) return
        try {
            await deleteVoucher(id).unwrap()
            toast.success('Đã xoá voucher')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Xoá thất bại')
        }
    }

    const tabs = [
        { id: 'overview' as Tab, label: 'Tổng quan' },
        { id: 'orders' as Tab, label: `Đơn hàng (${computedStats.totalOrders})` },
        { id: 'products' as Tab, label: `Sản phẩm (${computedStats.totalProducts})` },
        { id: 'vouchers' as Tab, label: 'Kho Voucher' },
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

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {/* Wallet Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-sm border border-orange-200">
                            <h3 className="text-sm font-medium text-orange-800">Ví Cửa Hàng</h3>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                {formatPrice(stats?.walletBalance || 0)}
                            </p>
                            <button
                                onClick={() => setShowTopupModal(true)}
                                className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors"
                            >
                                Nạp tiền
                            </button>
                        </div>
                    </div>
                    
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
                                <button onClick={handleShowFeeModal} disabled={creating} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-70 shadow-md">{creating ? 'Đang tạo...' : 'Thêm sản phẩm'}</button>
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

            {activeTab === 'vouchers' && (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Kho Voucher</h2>
                        <button onClick={() => setShowVoucherForm(!showVoucherForm)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-md">
                            {showVoucherForm ? 'Đóng' : '➕ Tạo Voucher mới'}
                        </button>
                    </div>

                    {showVoucherForm && (
                        <div className="bg-white border-2 border-primary/30 rounded-xl p-6 shadow-lg mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo Voucher mới</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher *</label>
                                    <input type="text" value={voucherForm.code || ''} onChange={e => setVoucherForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE50" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá *</label>
                                    <select value={voucherForm.discountType} onChange={e => setVoucherForm(p => ({ ...p, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' }))} className={inputClass}>
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                                    <input type="text" value={voucherForm.description || ''} onChange={e => setVoucherForm(p => ({ ...p, description: e.target.value }))} placeholder="VD: Giảm 50% cho đơn từ 200k" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm *</label>
                                    <input type="number" value={voucherForm.discountValue || ''} onChange={e => setVoucherForm(p => ({ ...p, discountValue: Number(e.target.value) }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                                    <input type="number" value={voucherForm.minOrderValue || ''} onChange={e => setVoucherForm(p => ({ ...p, minOrderValue: Number(e.target.value) }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa</label>
                                    <input type="number" value={voucherForm.maxDiscount || ''} onChange={e => setVoucherForm(p => ({ ...p, maxDiscount: Number(e.target.value) }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                                    <input type="number" value={voucherForm.usageLimit || ''} onChange={e => setVoucherForm(p => ({ ...p, usageLimit: Number(e.target.value) || undefined }))} placeholder="Không giới hạn" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                                    <input type="datetime-local" value={voucherForm.startDate || ''} onChange={e => setVoucherForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                                    <input type="datetime-local" value={voucherForm.endDate || ''} onChange={e => setVoucherForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleCreateVoucher} disabled={creatingVoucher} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-70 shadow-md">{creatingVoucher ? 'Đang tạo...' : 'Tạo Voucher'}</button>
                                <button onClick={() => setShowVoucherForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all font-medium">Huỷ</button>
                            </div>
                        </div>
                    )}

                    {loadingVouchers ? (
                        <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                    ) : myVouchers && myVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myVouchers.map(v => (
                                <div key={v.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="inline-block bg-primary/10 text-primary font-mono font-bold text-sm px-3 py-1 rounded-lg">{v.code}</span>
                                            <p className="text-sm text-gray-600 mt-2">{v.description}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {v.active ? 'Hoạt động' : 'Hết hạn'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                                        <div>Giảm: <span className="font-semibold text-gray-800">{v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatPrice(v.discountValue)}</span></div>
                                        <div>Đã dùng: <span className="font-semibold text-gray-800">{v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ''}</span></div>
                                        {v.minOrderValue && <div>Đơn tối thiểu: <span className="font-semibold text-gray-800">{formatPrice(v.minOrderValue)}</span></div>}
                                        {v.maxDiscount && <div>Giảm tối đa: <span className="font-semibold text-gray-800">{formatPrice(v.maxDiscount)}</span></div>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                                        <span>{new Date(v.startDate).toLocaleDateString('vi-VN')} — {new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                                        <button onClick={() => handleDeleteVoucher(v.id, v.code)} className="text-red-500 hover:text-red-700 font-medium">Xoá</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white border rounded-xl">
                            <div className="text-5xl mb-3">🎟️</div>
                            <p className="text-gray-500 text-lg">Chưa có voucher nào</p>
                            <p className="text-sm text-gray-400 mt-1">Tạo voucher để thu hút khách hàng</p>
                        </div>
                    )}
                </div>
            )}

            {/* Listing Fee Confirmation Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">💳 Phí đăng sản phẩm</h2>
                        
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                            <p className="text-orange-800 mb-2">Để duy trì chất lượng hệ thống, mỗi sản phẩm đăng lên sẽ bị tính phí:</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-orange-200">
                                    <span className="font-medium text-orange-900">Phí đăng sản phẩm:</span>
                                    <span className="font-bold text-orange-600">{feeInfo?.nextFee === 0 ? 'Miễn phí (0 VNĐ)' : formatPrice(feeInfo?.nextFee ?? 200000)}</span>
                                </div>
                                <div className="text-sm text-orange-700">
                                    <strong>Lưu ý quan trọng:</strong> Ví cửa hàng của bạn cần phải có tối thiểu <strong>{formatPrice((feeInfo?.nextFee ?? 200000) + 500000)}</strong> (để đảm bảo sau khi trừ phí đăng, số dư ví vẫn còn ≥ 500.000 VNĐ để thỏa mãn phí duy trì cửa hàng).
                                </div>
                                <div className="flex justify-between items-center py-2 mt-2">
                                    <span className="font-medium text-orange-900">Số dư ví hiện tại:</span>
                                    <span className={`font-bold ${(stats?.walletBalance || 0) < ((feeInfo?.nextFee ?? 200000) + 500000) ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatPrice(stats?.walletBalance || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowFeeModal(false)}
                                className="px-6 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={() => {
                                    setShowFeeModal(false)
                                    handleCreateProduct()
                                }}
                                disabled={(stats?.walletBalance || 0) < ((feeInfo?.nextFee ?? 200000) + 500000)}
                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {feeInfo?.nextFee === 0 ? 'Xác nhận & Đăng' : 'Thanh toán & Đăng'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Up Modal */}
            {showTopupModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        {/* Bonus Banner */}
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-1.5 px-4 text-center text-xs font-bold tracking-wider uppercase">
                            🔥 Khuyến mãi nạp ví tặng thêm
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-4">💰 Nạp tiền vào ví</h2>
                        
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 mt-2">
                            <p className="text-sm text-orange-800 font-semibold mb-1">🎁 Các mốc ưu đãi hiện tại:</p>
                            <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc marker:text-orange-400">
                                <li>Nạp từ 1.000.000đ &rarr; <span className="font-bold">+200.000đ</span></li>
                                <li>Nạp từ 2.000.000đ &rarr; <span className="font-bold">+500.000đ</span></li>
                                <li>Nạp từ 5.000.000đ &rarr; <span className="font-bold">+1.500.000đ</span></li>
                            </ul>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền muốn nạp (VNĐ)</label>
                            <input
                                type="number"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ví dụ: 1000000"
                            />
                            {Number(topupAmount) > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tiền nạp:</span>
                                        <span className="font-medium text-gray-900">{formatPrice(Number(topupAmount))}</span>
                                    </div>
                                    {(() => {
                                        const amount = Number(topupAmount);
                                        let bonus = 0;
                                        if (amount >= 5000000) bonus = 1500000;
                                        else if (amount >= 2000000) bonus = 500000;
                                        else if (amount >= 1000000) bonus = 200000;
                                        
                                        if (bonus > 0) {
                                            return (
                                                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                                    <span>Khuyến mãi tặng thêm:</span>
                                                    <span>+ {formatPrice(bonus)}</span>
                                                </div>
                                            )
                                        }
                                        return (
                                            <div className="text-xs text-orange-600 italic mt-1 text-center">
                                                (Nạp thêm {formatPrice(1000000 - amount)} để nhận ưu đãi 200K)
                                            </div>
                                        )
                                    })()}
                                    <div className="h-px bg-emerald-200 my-1"></div>
                                    <div className="flex justify-between text-sm font-bold text-emerald-800">
                                        <span>Tổng nhận vào ví:</span>
                                        <span>{(() => {
                                            const amount = Number(topupAmount);
                                            let bonus = 0;
                                            if (amount >= 5000000) bonus = 1500000;
                                            else if (amount >= 2000000) bonus = 500000;
                                            else if (amount >= 1000000) bonus = 200000;
                                            return formatPrice(amount + bonus);
                                        })()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowTopupModal(false)
                                    setTopupAmount('')
                                }}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await topupWallet({ amount: Number(topupAmount) }).unwrap()
                                        toast.success('Nạp tiền thành công!')
                                        setShowTopupModal(false)
                                        setTopupAmount('')
                                    } catch (err) {
                                        toast.error('Có lỗi xảy ra khi nạp tiền')
                                    }
                                }}
                                disabled={!topupAmount || toppingUp}
                                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                                {toppingUp ? 'Đang nạp...' : 'Xác nhận nạp'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
