import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useGetAddressesQuery, useCreateAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation } from '../../features/addresses/addressApi'
import { useGetOrdersQuery } from '../../features/orders/orderApi'
import { useChangePasswordMutation } from '../../features/user/userApi'
import { toast } from 'sonner'

type Tab = 'profile' | 'addresses' | 'orders' | 'security'

export default function ProfilePage() {
    const [searchParams] = useSearchParams()
    const initialTab = (searchParams.get('tab') as Tab) || 'profile'
    const user = useAppSelector(selectCurrentUser)
    const [activeTab, setActiveTab] = useState<Tab>(initialTab)
    const { data: addresses, isLoading: loadingAddr } = useGetAddressesQuery()
    const { data: orders, isLoading: loadingOrders } = useGetOrdersQuery()
    const [createAddress, { isLoading: creating }] = useCreateAddressMutation()
    const [deleteAddress] = useDeleteAddressMutation()
    const [setDefault] = useSetDefaultAddressMutation()
    const [changePassword, { isLoading: changingPwd }] = useChangePasswordMutation()
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addrForm, setAddrForm] = useState({
        recipientName: '', recipientPhone: '', addressLine: '', ward: '', district: '', city: '', label: 'HOME'
    })
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false })

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
        if (pwd.length === 0) return { label: '', color: '', width: '0%' }
        if (pwd.length < 6) return { label: 'Yếu', color: 'bg-red-500', width: '25%' }
        if (pwd.length < 10 && !/[A-Z]/.test(pwd)) return { label: 'Trung bình', color: 'bg-yellow-500', width: '50%' }
        if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Rất mạnh', color: 'bg-green-500', width: '100%' }
        return { label: 'Khá mạnh', color: 'bg-blue-500', width: '75%' }
    }

    const handleChangePassword = async () => {
        if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp')
            return
        }
        if (pwdForm.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }
        try {
            await changePassword(pwdForm).unwrap()
            toast.success('Đổi mật khẩu thành công!')
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err: any) {
            toast.error(err?.data?.message || err?.data || 'Đổi mật khẩu thất bại')
        }
    }

    const handleCreateAddress = async () => {
        if (!addrForm.recipientName || !addrForm.recipientPhone || !addrForm.addressLine || !addrForm.ward || !addrForm.district || !addrForm.city) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }
        try {
            await createAddress(addrForm).unwrap()
            toast.success('Thêm địa chỉ thành công!')
            setShowAddressForm(false)
            setAddrForm({ recipientName: '', recipientPhone: '', addressLine: '', ward: '', district: '', city: '', label: 'HOME' })
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thêm địa chỉ thất bại')
        }
    }

    const handleDeleteAddress = async (id: number) => {
        if (!confirm('Xoá địa chỉ này?')) return
        try {
            await deleteAddress(id).unwrap()
            toast.success('Đã xoá')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Xoá thất bại')
        }
    }

    const handleSetDefault = async (id: number) => {
        try {
            await setDefault(id).unwrap()
            toast.success('Đã đặt mặc định')
        } catch (err: any) {
            toast.error('Thất bại')
        }
    }

    const statusLabels: Record<string, { label: string; color: string }> = {
        PENDING: { label: '⏳ Chờ xử lý', color: 'text-yellow-600 bg-yellow-50' },
        CONFIRMED: { label: '✅ Đã xác nhận', color: 'text-blue-600 bg-blue-50' },
        COOKING: { label: '🍳 Đang nấu', color: 'text-orange-600 bg-orange-50' },
        READY: { label: '📦 Sẵn sàng', color: 'text-indigo-600 bg-indigo-50' },
        DELIVERING: { label: '🚚 Đang giao', color: 'text-purple-600 bg-purple-50' },
        DELIVERED: { label: '🎉 Đã giao', color: 'text-green-600 bg-green-50' },
        CANCELLED: { label: '❌ Đã huỷ', color: 'text-red-600 bg-red-50' },
    }

    const tabs = [
        { id: 'profile' as Tab, label: '👤 Thông tin', icon: '👤' },
        { id: 'addresses' as Tab, label: '📍 Địa chỉ', icon: '📍' },
        { id: 'orders' as Tab, label: '📦 Đơn hàng', icon: '📦' },
        { id: 'security' as Tab, label: '🔒 Bảo mật', icon: '🔒' },
    ]

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto border-b pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 rounded-t-lg font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h2>
                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                                    {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{user.fullName}</h3>
                                    <p className="text-gray-500">{user.role === 'CUSTOMER' ? 'Khách hàng' : user.role === 'VENDOR' ? 'Nhà hàng' : 'Admin'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">📧 Email</p>
                                    <p className="font-semibold text-gray-800">{user.email}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">🆔 Mã tài khoản</p>
                                    <p className="font-semibold text-gray-800">#{user.id}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Chưa đăng nhập</p>
                    )}
                </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold"
                        >
                            {showAddressForm ? '✕ Đóng' : '+ Thêm địa chỉ'}
                        </button>
                    </div>

                    {/* Add Address Form */}
                    {showAddressForm && (
                        <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên người nhận *</label>
                                    <input type="text" value={addrForm.recipientName} onChange={e => setAddrForm(p => ({ ...p, recipientName: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                                    <input type="text" value={addrForm.recipientPhone} onChange={e => setAddrForm(p => ({ ...p, recipientPhone: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                                    <input type="text" value={addrForm.addressLine} onChange={e => setAddrForm(p => ({ ...p, addressLine: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Số nhà, đường..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
                                    <input type="text" value={addrForm.ward} onChange={e => setAddrForm(p => ({ ...p, ward: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
                                    <input type="text" value={addrForm.district} onChange={e => setAddrForm(p => ({ ...p, district: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố *</label>
                                    <input type="text" value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn</label>
                                    <select value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <option value="HOME">🏠 Nhà riêng</option>
                                        <option value="WORK">🏢 Văn phòng</option>
                                        <option value="OTHER">📍 Khác</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleCreateAddress}
                                disabled={creating}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-70"
                            >
                                {creating ? 'Đang lưu...' : '💾 Lưu địa chỉ'}
                            </button>
                        </div>
                    )}

                    {/* Address List */}
                    {loadingAddr ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : addresses && addresses.length > 0 ? (
                        <div className="space-y-3">
                            {addresses.map(addr => (
                                <div key={addr.id} className={`bg-white border rounded-xl p-4 shadow-sm flex items-start gap-4 ${addr.isDefault ? 'border-primary' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-800">{addr.recipientName}</span>
                                            <span className="text-gray-400">|</span>
                                            <span className="text-gray-600">{addr.recipientPhone}</span>
                                            {addr.isDefault && (
                                                <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">Mặc định</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm">{addr.fullAddress || `${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`}</p>
                                        {addr.label && (
                                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {addr.label === 'HOME' ? '🏠 Nhà' : addr.label === 'WORK' ? '🏢 VP' : '📍 Khác'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {!addr.isDefault && (
                                            <button onClick={() => handleSetDefault(addr.id)} className="text-xs px-3 py-1 border border-primary text-primary rounded-lg hover:bg-green-50">
                                                Đặt mặc định
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs px-3 py-1 border border-red-300 text-red-500 rounded-lg hover:bg-red-50">
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white border rounded-xl">
                            <p className="text-gray-500">📍 Chưa có địa chỉ nào</p>
                            <p className="text-sm text-gray-400 mt-1">Thêm địa chỉ giao hàng để đặt đơn nhanh hơn</p>
                        </div>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử đơn hàng</h2>
                    {loadingOrders ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : orders && orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map(order => {
                                const statusInfo = statusLabels[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50' }
                                return (
                                    <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold text-gray-800">Đơn #{order.orderNumber}</span>
                                                <span className="text-sm text-gray-500 ml-3">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium`}>
                                                {order.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            {order.subOrders.map(sub => (
                                                <div key={sub.id} className="mb-3 last:mb-0">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">🏪 {sub.vendorName}</p>
                                                    {sub.items.map(item => (
                                                        <div key={item.id} className="flex justify-between items-center py-1 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-700">{item.productName}</span>
                                                                <span className="text-gray-400">x{item.quantity}</span>
                                                            </div>
                                                            <span className="font-medium text-gray-800">{formatPrice(item.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            <div className="border-t mt-3 pt-3 flex justify-between items-center">
                                                <span className="text-sm text-gray-500">
                                                    📍 {order.deliveryAddress}
                                                </span>
                                                <span className="font-bold text-primary text-lg">{formatPrice(order.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white border rounded-xl">
                            <div className="text-6xl mb-4">📦</div>
                            <p className="text-gray-500">Chưa có đơn hàng nào</p>
                        </div>
                    )}
                </div>
            )}
            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white border rounded-xl p-6 shadow-sm max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h2>
                            <p className="text-sm text-gray-500">Để bảo vệ tài khoản, vui lòng không chia sẻ mật khẩu</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="current-password-input"
                                    type={showPwd.current ? 'text' : 'password'}
                                    value={pwdForm.currentPassword}
                                    onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPwd.current ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="new-password-input"
                                    type={showPwd.newPwd ? 'text' : 'password'}
                                    value={pwdForm.newPassword}
                                    onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                                    placeholder="Ít nhất 6 ký tự"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(p => ({ ...p, newPwd: !p.newPwd }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPwd.newPwd ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            {pwdForm.newPassword.length > 0 && (() => {
                                const strength = getPasswordStrength(pwdForm.newPassword)
                                return (
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: strength.width }}></div>
                                        </div>
                                        <p className={`text-xs mt-1 font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="confirm-password-input"
                                    type={showPwd.confirm ? 'text' : 'password'}
                                    value={pwdForm.confirmPassword}
                                    onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all ${
                                        pwdForm.confirmPassword && pwdForm.confirmPassword !== pwdForm.newPassword
                                            ? 'border-red-400 bg-red-50'
                                            : pwdForm.confirmPassword && pwdForm.confirmPassword === pwdForm.newPassword
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPwd.confirm ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {pwdForm.confirmPassword && pwdForm.confirmPassword !== pwdForm.newPassword && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Mật khẩu không khớp</p>
                            )}
                            {pwdForm.confirmPassword && pwdForm.confirmPassword === pwdForm.newPassword && (
                                <p className="text-xs text-green-600 mt-1">✅ Mật khẩu khớp</p>
                            )}
                        </div>

                        <button
                            id="change-password-btn"
                            onClick={handleChangePassword}
                            disabled={changingPwd}
                            className="w-full mt-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {changingPwd ? (
                                <><span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> Đang xử lý...</>
                            ) : (
                                <>🔐 Cập nhật mật khẩu</>
                            )}
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium mb-1">💡 Mẹo bảo mật</p>
                        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                            <li>Mật khẩu nên có ít nhất 8 ký tự</li>
                            <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                            <li>Không sử dụng thông tin cá nhân dễ đoán</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
