import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetCartQuery } from '../../features/cart/cartApi'
import { useGetAddressesQuery, useCreateAddressMutation } from '../../features/addresses/addressApi'
import { useCreateOrderMutation } from '../../features/orders/orderApi'

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { data: cart, isLoading: loadingCart } = useGetCartQuery()
    const { data: addresses, isLoading: loadingAddr } = useGetAddressesQuery()
    const [createAddress, { isLoading: creatingAddr }] = useCreateAddressMutation()
    const [createOrder, { isLoading: ordering }] = useCreateOrderMutation()

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD')
    const [notes, setNotes] = useState('')
    const [showNewAddr, setShowNewAddr] = useState(false)
    const [addrForm, setAddrForm] = useState({
        recipientName: '', recipientPhone: '', addressLine: '', ward: '', district: '', city: '', label: 'HOME'
    })

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    // Auto-select default address
    if (addresses && addresses.length > 0 && !selectedAddressId) {
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
        setSelectedAddressId(defaultAddr.id)
    }

    const handleCreateAddress = async () => {
        if (!addrForm.recipientName || !addrForm.recipientPhone || !addrForm.addressLine || !addrForm.ward || !addrForm.district || !addrForm.city) {
            toast.error('Điền đầy đủ thông tin địa chỉ')
            return
        }
        try {
            const result = await createAddress({ ...addrForm, isDefault: !addresses || addresses.length === 0 }).unwrap()
            setSelectedAddressId(result.id)
            setShowNewAddr(false)
            toast.success('Đã thêm địa chỉ')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thất bại')
        }
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error('Vui lòng chọn địa chỉ giao hàng')
            return
        }
        try {
            const order = await createOrder({
                addressId: selectedAddressId,
                paymentMethod,
                notes: notes || undefined,
            }).unwrap()
            toast.success(`Đặt hàng thành công! Đơn #${order.orderNumber}`)
            navigate('/profile?tab=orders')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Đặt hàng thất bại')
        }
    }

    if (loadingCart || loadingAddr) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
        )
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        navigate('/cart')
        return null
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📦 Đặt hàng</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Address & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Delivery Address */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">📍 Địa chỉ giao hàng</h2>
                            <button onClick={() => setShowNewAddr(!showNewAddr)} className="text-sm text-primary font-medium hover:underline">
                                {showNewAddr ? 'Đóng' : '+ Thêm mới'}
                            </button>
                        </div>

                        {showNewAddr && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="Tên người nhận *" value={addrForm.recipientName}
                                        onChange={e => setAddrForm(p => ({ ...p, recipientName: e.target.value }))}
                                        className="px-3 py-2 border rounded-lg text-sm" />
                                    <input type="text" placeholder="Số điện thoại *" value={addrForm.recipientPhone}
                                        onChange={e => setAddrForm(p => ({ ...p, recipientPhone: e.target.value }))}
                                        className="px-3 py-2 border rounded-lg text-sm" />
                                </div>
                                <input type="text" placeholder="Số nhà, đường *" value={addrForm.addressLine}
                                    onChange={e => setAddrForm(p => ({ ...p, addressLine: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                                <div className="grid grid-cols-3 gap-3">
                                    <input type="text" placeholder="Phường/Xã *" value={addrForm.ward}
                                        onChange={e => setAddrForm(p => ({ ...p, ward: e.target.value }))}
                                        className="px-3 py-2 border rounded-lg text-sm" />
                                    <input type="text" placeholder="Quận/Huyện *" value={addrForm.district}
                                        onChange={e => setAddrForm(p => ({ ...p, district: e.target.value }))}
                                        className="px-3 py-2 border rounded-lg text-sm" />
                                    <input type="text" placeholder="Thành phố *" value={addrForm.city}
                                        onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))}
                                        className="px-3 py-2 border rounded-lg text-sm" />
                                </div>
                                <button onClick={handleCreateAddress} disabled={creatingAddr}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-70">
                                    {creatingAddr ? 'Đang lưu...' : '💾 Lưu'}
                                </button>
                            </div>
                        )}

                        {addresses && addresses.length > 0 ? (
                            <div className="space-y-2">
                                {addresses.map(addr => (
                                    <label key={addr.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-400'
                                            }`}>
                                        <input type="radio" name="address" checked={selectedAddressId === addr.id}
                                            onChange={() => setSelectedAddressId(addr.id)}
                                            className="mt-1 text-primary" />
                                        <div>
                                            <p className="font-semibold text-sm">{addr.recipientName} - {addr.recipientPhone}</p>
                                            <p className="text-sm text-gray-600">{addr.fullAddress || `${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Chưa có địa chỉ. Thêm địa chỉ mới để đặt hàng.</p>
                        )}
                    </div>

                    {/* Payment */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">💳 Phương thức thanh toán</h2>
                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-green-50' : 'border-gray-200'
                                }`}>
                                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="text-primary" />
                                <span className="font-medium">💵 Thanh toán khi nhận hàng (COD)</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-green-50' : 'border-gray-200'
                                }`}>
                                <input type="radio" name="payment" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} className="text-primary" />
                                <span className="font-medium">🏦 Chuyển khoản ngân hàng</span>
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📝 Ghi chú</h2>
                        <textarea
                            value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="VD: Giao giờ hành chính, không hành..."
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Right - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-20">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                            {cart.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                                        <p className="text-gray-500">x{item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-gray-800 whitespace-nowrap ml-2">{formatPrice(item.subtotal)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span className="font-medium">{formatPrice(cart.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Phí giao hàng:</span>
                                <span className="font-medium text-green-600">Tính khi đặt</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Tổng cộng:</span>
                                <span className="text-primary">{formatPrice(cart.totalAmount)}</span>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={ordering || !selectedAddressId}
                            className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {ordering ? 'Đang đặt hàng...' : '✅ Xác nhận đặt hàng'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
