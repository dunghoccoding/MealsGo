import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetProductsQuery } from '../../features/products/productApi'
import ProductCard from '../../components/product/ProductCard'

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
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-4">
                        <img src="/logo.svg" alt="MealGo" className="w-20 h-20 brightness-0 invert" />
                        MealGo
                        <img src="/logo.svg" alt="MealGo" className="w-20 h-20 brightness-0 invert" />
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-green-100">
                        Hương vị của người Việt - Đặc sản 3 miền
                    </p>
                </div>
            </div>

            {/* Region Filter */}
            <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button
                            onClick={() => setSelectedRegion('')}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${selectedRegion === ''
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🍽️ Tất cả
                        </button>
                        <button
                            onClick={() => setSelectedRegion('NORTH')}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${selectedRegion === 'NORTH'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🔴 Miền Bắc
                        </button>
                        <button
                            onClick={() => setSelectedRegion('CENTRAL')}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${selectedRegion === 'CENTRAL'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🟡 Miền Trung
                        </button>
                        <button
                            onClick={() => setSelectedRegion('SOUTH')}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${selectedRegion === 'SOUTH'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🟢 Miền Nam
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Đang tải món ăn...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <p className="text-red-600">❌ Không thể tải danh sách món ăn</p>
                        <p className="text-gray-600 mt-2">Vui lòng kiểm tra kết nối Backend</p>
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
