import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation, useClearCartMutation } from '../../features/cart/cartApi'

export default function CartPage() {
    const navigate = useNavigate()
    const { data: cart, isLoading, error } = useGetCartQuery()
    const [updateItem] = useUpdateCartItemMutation()
    const [removeItem] = useRemoveCartItemMutation()
    const [clearCart] = useClearCartMutation()

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const handleUpdateQty = async (itemId: number, qty: number) => {
        if (qty < 1) return
        try {
            await updateItem({ itemId, quantity: qty }).unwrap()
        } catch (err: any) {
            toast.error(err?.data?.message || 'Cập nhật thất bại')
        }
    }

    const handleRemove = async (itemId: number) => {
        try {
            await removeItem(itemId).unwrap()
            toast.success('Đã xoá khỏi giỏ hàng')
        } catch (err: any) {
            toast.error('Xoá thất bại')
        }
    }

    const handleClearCart = async () => {
        if (!confirm('Bạn có chắc muốn xoá toàn bộ giỏ hàng?')) return
        try {
            await clearCart().unwrap()
            toast.success('Đã xoá giỏ hàng')
        } catch (err: any) {
            toast.error('Xoá giỏ hàng thất bại')
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <p className="text-red-600 text-xl">❌ Không thể tải giỏ hàng</p>
            </div>
        )
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="text-8xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
                <p className="text-gray-500 mb-6">Hãy thêm món ăn yêu thích vào giỏ hàng nhé!</p>
                <Link to="/" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg">
                    🍜 Khám phá món ngon
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">🛒 Giỏ hàng ({cart.totalItems} món)</h1>
                <button onClick={handleClearCart} className="text-sm text-red-500 hover:text-red-700 font-medium">
                    🗑️ Xoá tất cả
                </button>
            </div>

            {/* Cart Items grouped by vendor */}
            <div className="space-y-6 mb-8">
                {cart.itemsByVendor && Object.entries(cart.itemsByVendor).map(([vendorName, items]) => (
                    <div key={vendorName} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b">
                            <h3 className="font-semibold text-gray-800">🏪 {vendorName}</h3>
                        </div>
                        <div className="divide-y">
                            {items.map(item => (
                                <div key={item.id} className="p-4 flex gap-4 items-center">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.product.images && item.product.images.length > 0 ? (
                                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-3xl">🍜</div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/product/${item.product.id}`} className="font-semibold text-gray-800 hover:text-primary line-clamp-1">
                                            {item.product.name}
                                        </Link>
                                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.selectedVariants.map(v => v.variantName).join(', ')}
                                            </p>
                                        )}
                                        <p className="text-primary font-bold mt-1">{formatPrice(item.itemPrice)}</p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-bold"
                                        >−</button>
                                        <span className="px-3 py-1 font-semibold text-sm min-w-[35px] text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                        >+</button>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 whitespace-nowrap">{formatPrice(item.subtotal)}</p>
                                    </div>

                                    {/* Remove */}
                                    <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-600 text-xl">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white border rounded-xl shadow-sm p-6 sticky bottom-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-gray-700">Tổng cộng ({cart.totalItems} món):</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(cart.totalAmount)}</span>
                </div>
                <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    📦 Đặt hàng
                </button>
            </div>
        </div>
    )
}
