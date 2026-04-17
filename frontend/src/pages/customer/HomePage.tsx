import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetProductsQuery } from '../../features/products/productApi'
import ProductCard from '../../components/product/ProductCard'
import { LayoutGrid, MapPin, Loader2, AlertCircle } from 'lucide-react'

export default function HomePage() {
    const [selectedRegion, setSelectedRegion] = useState<string>('')
    const [searchParams] = useSearchParams()
    const searchQuery = searchParams.get('search') || ''

    const { data, isLoading, error } = useGetProductsQuery({
        region: selectedRegion || undefined,
        search: searchQuery || undefined,
        size: 12
    })

    return (
        <div>
            {/* Hero Section */}
            <div className="relative bg-emerald-950 py-20 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('/images/pic2.jpg')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 to-emerald-950"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight text-white drop-shadow-xl">
                        Thưởng thức <span className="text-emerald-400">Đặc sản</span> Việt
                    </h1>
                    <p className="text-xl md:text-2xl text-emerald-100/80 font-light max-w-2xl mx-auto leading-relaxed">
                        Khám phá và đặt mua những món ăn tinh túy nhất từ mọi miền Tổ quốc, giao tận nơi nhanh chóng.
                    </p>
                </div>
            </div>

            {/* Region Filter */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-16 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => setSelectedRegion('')}
                            className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all flex items-center gap-2 border-2 ${selectedRegion === ''
                                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-primary-200 hover:text-primary-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Tất cả
                        </button>
                        <button
                            onClick={() => setSelectedRegion('NORTH')}
                            className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all flex items-center gap-2 border-2 ${selectedRegion === 'NORTH'
                                ? 'bg-region-north text-white border-region-north shadow-lg shadow-region-north/20'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-rose-200 hover:text-region-north'
                                }`}
                        >
                            <MapPin className="w-4 h-4" />
                            Miền Bắc
                        </button>
                        <button
                            onClick={() => setSelectedRegion('CENTRAL')}
                            className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all flex items-center gap-2 border-2 ${selectedRegion === 'CENTRAL'
                                ? 'bg-region-central text-white border-region-central shadow-lg shadow-region-central/20'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-amber-200 hover:text-region-central'
                                }`}
                        >
                            <MapPin className="w-4 h-4" />
                            Miền Trung
                        </button>
                        <button
                            onClick={() => setSelectedRegion('SOUTH')}
                            className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all flex items-center gap-2 border-2 ${selectedRegion === 'SOUTH'
                                ? 'bg-region-south text-white border-region-south shadow-lg shadow-region-south/20'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200 hover:text-region-south'
                                }`}
                        >
                            <MapPin className="w-4 h-4" />
                            Miền Nam
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Đang chuẩn bị thực đơn cho bạn...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 bg-rose-50 rounded-3xl border border-rose-100 px-6">
                        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <p className="text-rose-800 font-bold text-xl mb-2">Oops! Có lỗi xảy ra</p>
                        <p className="text-rose-600/80">Không thể tải danh sách món ăn. Vui lòng thử lại sau.</p>
                    </div>
                )}

                {data && data.content.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">😔 Chưa có món ăn nào</p>
                    </div>
                )}

                {data && data.content.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.content.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Pagination (if needed) */}
                {data && data.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="text-gray-600">
                            Trang {data.number + 1} / {data.totalPages}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
