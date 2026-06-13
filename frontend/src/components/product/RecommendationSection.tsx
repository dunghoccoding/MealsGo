import ProductCard from './ProductCard'
import { useGetRelatedProductsQuery, useGetPersonalizedRecommendationsQuery } from '../../features/recommendations/recommendationApi'
import { Sparkles, TrendingUp } from 'lucide-react'
import type { Product } from '../../features/products/productApi'

interface RecommendationSectionProps {
    type: 'related' | 'personalized'
    productId?: number
    title?: string
    limit?: number
}

export default function RecommendationSection({ type, productId, title, limit = 4 }: RecommendationSectionProps) {
    const relatedQuery = useGetRelatedProductsQuery(
        { productId: productId!, limit },
        { skip: type !== 'related' || !productId }
    )

    const personalizedQuery = useGetPersonalizedRecommendationsQuery(
        { limit },
        { skip: type !== 'personalized' }
    )

    const { data, isLoading, error } = type === 'related' ? relatedQuery : personalizedQuery

    const products: Product[] = (data || []).slice(0, limit)

    if (error || (!isLoading && products.length === 0)) return null

    const sectionTitle = title || (type === 'related' ? 'Món liên quan' : 'Gợi ý cho bạn')
    const SectionIcon = type === 'related' ? TrendingUp : Sparkles

    return (
        <section className="py-10">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <SectionIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">
                        {sectionTitle}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">
                        {type === 'related'
                            ? 'Những món ăn bạn có thể sẽ thích'
                            : 'Được chọn riêng dành cho bạn'
                        }
                    </p>
                </div>
            </div>

            {/* Loading State — 4 skeleton cards */}
            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                            <div className="h-48 bg-slate-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                                <div className="h-5 bg-slate-100 rounded-lg w-1/3 mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Products — fixed 4-column grid, no scroll */}
            {!isLoading && products.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </section>
    )
}
