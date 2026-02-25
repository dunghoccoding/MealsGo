import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../features/auth/authSlice'
import { useGetCartQuery } from '../../features/cart/cartApi'
import { useState } from 'react'

export default function Navbar() {
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const currentUser = useAppSelector(selectCurrentUser)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [searchText, setSearchText] = useState('')
    const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated })

    const handleLogout = () => {
        dispatch(logout())
        setShowUserMenu(false)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchText.trim()) {
            navigate(`/?search=${encodeURIComponent(searchText.trim())}`)
        } else {
            navigate('/')
        }
    }

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <img src="/logo.svg" alt="MealGo Logo" className="w-8 h-8 text-black" />
                        <span className="text-xl font-bold text-gray-800">MealGo</span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Tìm món ăn..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary">🔍</button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <span className="text-2xl">🛒</span>
                            {(cart?.totalItems ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cart?.totalItems}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated && currentUser ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                            {(currentUser.fullName || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="hidden md:block text-gray-700 font-medium">
                                        {currentUser.fullName}
                                    </span>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                                        {currentUser.role === 'VENDOR' && (
                                            <Link
                                                to="/vendor/dashboard"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                <span className="mr-2">🏪</span>
                                                Quản lý cửa hàng
                                            </Link>
                                        )}
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                                        >
                                            <span className="mr-2">👤</span>
                                            Thông tin cá nhân
                                        </Link>
                                        <Link
                                            to="/profile?tab=orders"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                                        >
                                            <span className="mr-2">📦</span>
                                            Đơn hàng của tôi
                                        </Link>
                                        <hr className="my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-gray-100"
                                        >
                                            <span className="mr-2">🚪</span>
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
