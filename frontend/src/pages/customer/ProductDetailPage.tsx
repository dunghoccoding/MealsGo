import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetProductByIdQuery } from '../../features/products/productApi'
import { useAddToCartMutation } from '../../features/cart/cartApi'
import { useAppSelector } from '../../app/hooks'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import type { SelectedVariant } from '../../features/cart/cartApi'

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const { data: product, isLoading, error } = useGetProductByIdQuery(Number(id))
    const [addToCart, { isLoading: isAdding }] = useAddToCartMutation()
    const [quantity, setQuantity] = useState(1)
    const [selectedVariants, setSelectedVariants] = useState<Record<number, SelectedVariant>>({})
    const [activeImage, setActiveImage] = useState(0)

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Đang tải thông tin sản phẩm...</p>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <p className="text-red-600 text-xl">❌ Không tìm thấy sản phẩm</p>
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700">
                    ← Về trang chủ
                </button>
            </div>
        )
    }

    const handleVariantSelect = (groupId: number, groupName: string, variantId: number, variantName: string, priceAdj: number) => {
        setSelectedVariants(prev => ({
            ...prev,
            [groupId]: { variantId, groupName, variantName, priceAdjustment: priceAdj }
        }))
    }

    const totalPrice = () => {
        let price = product.basePrice
        Object.values(selectedVariants).forEach(v => {
            price += v.priceAdjustment
        })
        return price * quantity
    }

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
            navigate('/login')
            return
        }

        // Check required variants
        const missingRequired = product.variantGroups?.filter(
            g => g.isRequired && !selectedVariants[g.id]
        )
        if (missingRequired && missingRequired.length > 0) {
            toast.error(`Vui lòng chọn: ${missingRequired.map(g => g.name).join(', ')}`)
            return
        }

        try {
            await addToCart({
                productId: product.id,
                quantity,
                selectedVariants: Object.values(selectedVariants),
            }).unwrap()
            toast.success('Đã thêm vào giỏ hàng! 🛒')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Thêm vào giỏ hàng thất bại')
        }
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const regionLabels: Record<string, string> = { NORTH: '🔴 Miền Bắc', CENTRAL: '🟡 Miền Trung', SOUTH: '🟢 Miền Nam' }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-gray-500">
                <button onClick={() => navigate('/')} className="hover:text-primary">Trang chủ</button>
                <span className="mx-2">/</span>
                <span className="text-gray-800 font-medium">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-lg">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[activeImage]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-8xl">🍜</div>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === activeImage ? 'border-primary shadow-md' : 'border-gray-200'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            {regionLabels[product.region] || product.region}
                        </span>
                        {product.featured && (
                            <span className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">⭐ Nổi bật</span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-gray-500 mb-4">🏪 {product.vendorName}</p>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-5 h-5 ${star <= Math.round(product.rating || 0)
                                        ? 'text-amber-400 fill-current'
                                        : 'text-gray-300 fill-current'
                                        }`}
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            ))}
                            <span className="ml-2 text-gray-600 font-medium">
                                {product.rating && product.rating > 0 ? `(${product.reviewCount} đánh giá)` : '(Chưa có đánh giá)'}
                            </span>
                        </div>
                        {product.soldCount > 0 && (
                            <span className="text-gray-400">|</span>
                        )}
                        {product.soldCount > 0 && (
                            <span className="text-gray-500 font-medium">Đã bán: {product.soldCount}</span>
                        )}
                    </div>

                    <div className="text-3xl font-bold text-primary mb-6">
                        {formatPrice(product.basePrice)}
                    </div>

                    <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

                    {/* Variant Groups */}
                    {product.variantGroups && product.variantGroups.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {product.variantGroups.map(group => (
                                <div key={group.id} className="border rounded-xl p-4 bg-gray-50">
                                    <p className="font-semibold text-gray-800 mb-3">
                                        {group.name}
                                        {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {group.variants.map(variant => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(group.id, group.name, variant.id, variant.name, variant.priceAdjustment)}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedVariants[group.id]?.variantId === variant.id
                                                    ? 'border-primary bg-green-50 text-primary'
                                                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                                    }`}
                                            >
                                                {variant.name}
                                                {variant.priceAdjustment > 0 && (
                                                    <span className="text-xs ml-1 text-gray-500">
                                                        +{formatPrice(variant.priceAdjustment)}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center gap-4 mb-6">
                        <span className="font-semibold text-gray-700">Số lượng:</span>
                        <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                            >−</button>
                            <span className="px-6 py-2 text-lg font-semibold min-w-[60px] text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                            >+</button>
                        </div>
                    </div>

                    {/* Total & Add to Cart */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Tổng tiền:</span>
                            <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice())}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {isAdding ? 'Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
                    </button>
                </div>
            </div>
        </div>
    )
}
