import { Link } from 'react-router-dom'
import type { Product } from '../../features/products/productApi'
import { Star, MapPin, Store } from 'lucide-react'

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    const regionColors: Record<string, string> = { 
        NORTH: 'bg-rose-500', 
        CENTRAL: 'bg-amber-500', 
        SOUTH: 'bg-emerald-500' 
    }
    const regionNames: Record<string, string> = { NORTH: 'Miền Bắc', CENTRAL: 'Miền Trung', SOUTH: 'Miền Nam' }

    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-500 transform hover:-translate-y-1 border border-slate-100/50">
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                            <span className="text-4xl mb-2 opacity-50">🍜</span>
                            <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}

                    {/* Region Overlay */}
                    <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-white shadow-xl ${regionColors[product.region]}`}>
                            {regionNames[product.region] || product.region}
                        </span>
                    </div>

                    {/* Availability Overlay */}
                    {!product.available && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transform -rotate-3">
                                Tạm hết
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.rating || 0) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tight">
                            ({product.reviewCount})
                        </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors mb-2 tracking-tight leading-tight">
                        {product.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                        <Store className="w-3 h-3" />
                        <span className="font-medium truncate">{product.vendorName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá từ</span>
                            <span className="text-xl font-display font-black text-primary-600 tracking-tight">
                                {Number(product.basePrice).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
