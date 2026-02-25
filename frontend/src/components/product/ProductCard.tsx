import { Link } from 'react-router-dom'
import type { Product } from '../../features/products/productApi'

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Link to={`/product/${product.id}`} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                    {product.images && product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-green-100 to-green-200">
                            🍜
                        </div>
                    )}

                    {/* Region Badge */}
                    <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${product.region === 'NORTH' ? 'bg-red-500' :
                            product.region === 'CENTRAL' ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}>
                            {product.region === 'NORTH' ? 'Miền Bắc' :
                                product.region === 'CENTRAL' ? 'Miền Trung' :
                                    'Miền Nam'}
                        </span>
                    </div>

                    {/* Featured Badge */}
                    {product.featured && (
                        <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-orange-500">
                                ⭐ Nổi bật
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 text-gray-800 line-clamp-1">
                        {product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xl font-bold text-primary">
                                {Number(product.basePrice).toLocaleString('vi-VN')}đ
                            </p>
                            <p className="text-xs text-gray-500">
                                {product.vendorName}
                            </p>
                        </div>

                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">
                                {product.rating && product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}
                            </span>
                        </div>
                    </div>

                    {!product.available && (
                        <div className="mt-2">
                            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                Tạm hết hàng
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
