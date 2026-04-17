import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetProductByIdQuery } from '../../features/products/productApi'
import { useAddToCartMutation } from '../../features/cart/cartApi'
import { useAppSelector } from '../../app/hooks'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import type { SelectedVariant } from '../../features/cart/cartApi'
import { Store, Star, ShoppingCart, Minus, Plus, ArrowLeft, Loader2, ChevronRight, AlertCircle, Utensils } from 'lucide-react'

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
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải hương vị tinh tế...</p>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <div className="mb-6 bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-slate-500 mb-8">Món ăn này có lẽ đã hết hoặc không còn tồn tại.</p>
                <button 
                    onClick={() => navigate('/')} 
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại trang chủ
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

    const regionColors: Record<string, string> = { 
        NORTH: 'bg-rose-50 text-rose-700 border-rose-100', 
        CENTRAL: 'bg-amber-50 text-amber-700 border-amber-100', 
        SOUTH: 'bg-emerald-50 text-emerald-700 border-emerald-100' 
    }
    const regionNames: Record<string, string> = { NORTH: 'Miền Bắc', CENTRAL: 'Miền Trung', SOUTH: 'Miền Nam' }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-400">
                <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">Trang chủ</button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-800 font-bold">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div className="space-y-4">
                    <div className="aspect-[4/5] bg-slate-100 rounded-3xl overflow-hidden shadow-premium group relative">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[activeImage]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <Utensils className="w-20 h-20 mb-4 opacity-20" />
                                <span className="font-medium">Chưa có hình ảnh</span>
                            </div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md ${regionColors[product.region]}`}>
                                {regionNames[product.region] || product.region}
                            </span>
                        </div>
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 relative ${i === activeImage 
                                        ? 'border-primary-600 shadow-md ring-2 ring-primary-100' 
                                        : 'border-transparent hover:border-slate-200'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    {i !== activeImage && <div className="absolute inset-0 bg-white/20"></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="lg:pl-6">
                    <div className="flex items-center gap-3 mb-4">
                        {product.featured && (
                            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-full font-bold uppercase tracking-wider shadow-sm shadow-amber-500/20">
                                <Star className="w-3 h-3 fill-current" />
                                Nổi bật
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-3 tracking-tight">{product.name}</h1>
                    <Link to={`/vendor/${product.vendorId || ''}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-medium mb-6">
                        <Store className="w-4 h-4" />
                        <span>{product.vendorName}</span>
                    </Link>

                    <div className="flex items-center gap-6 mb-8 py-4 border-y border-slate-100">
                        <div className="flex items-center">
                            <div className="flex items-center gap-0.5 mr-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(product.rating || 0)
                                            ? 'text-amber-400 fill-current'
                                            : 'text-slate-200 fill-current'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-slate-900 font-bold text-sm">
                                {product.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="ml-1 text-slate-400 text-sm">
                                ({product.reviewCount} đánh giá)
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="text-sm">
                            <span className="text-slate-400">Đã bán:</span>
                            <span className="ml-1 text-slate-900 font-bold">{product.soldCount}</span>
                        </div>
                    </div>

                    <div className="text-4xl font-display font-black text-primary-600 mb-8 tracking-tight">
                        {formatPrice(product.basePrice)}
                    </div>

                    <div className="prose prose-slate mb-10">
                        <p className="text-slate-600 leading-relaxed font-light text-lg">{product.description}</p>
                    </div>

                    {/* Variant Groups */}
                    {product.variantGroups && product.variantGroups.length > 0 && (
                        <div className="space-y-6 mb-10">
                            {product.variantGroups.map(group => (
                                <div key={group.id} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="font-display font-bold text-slate-800 tracking-tight">
                                            {group.name}
                                        </p>
                                        {group.isRequired && (
                                            <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                                Bắt buộc
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.variants.map(variant => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(group.id, group.name, variant.id, variant.name, variant.priceAdjustment)}
                                                className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${selectedVariants[group.id]?.variantId === variant.id
                                                    ? 'border-primary-600 bg-primary-600 text-white shadow-primary-600/20'
                                                    : 'border-white bg-white hover:border-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                <span>{variant.name}</span>
                                                {variant.priceAdjustment > 0 && (
                                                    <span className={`ml-2 text-xs opacity-60`}>
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
                    <div className="flex items-center justify-between mb-8 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                        <span className="font-display font-bold text-slate-800">Số lượng</span>
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-6 text-lg font-display font-black min-w-[50px] text-center text-slate-800">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Summary & ATC */}
                    <div className="space-y-4">
                        <div className="bg-emerald-600 rounded-3xl p-8 mb-4 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10 flex justify-between items-center">
                                <span className="text-emerald-100 font-medium">Tổng thanh toán:</span>
                                <span className="text-3xl font-display font-black text-white tracking-tight">{formatPrice(totalPrice())}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="w-full py-5 bg-primary-950 text-white rounded-2xl font-display font-bold text-xl hover:bg-black transition-all shadow-premium-hover flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-95"
                        >
                            {isAdding ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span>Thêm vào giỏ hàng</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
