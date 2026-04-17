import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../features/auth/authSlice'
import { useGetCartQuery } from '../../features/cart/cartApi'
import { useState } from 'react'
import { Search, ShoppingCart, User, Store, Settings, Package, LogOut, ChevronDown } from 'lucide-react'

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
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-primary-500 transition-colors">
                            <span className="font-display font-black text-xl">M</span>
                        </div>
                        <span className="text-xl font-display font-bold text-slate-800 tracking-tight">Meals<span className="text-primary-600">Go</span></span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <input
                                type="text"
                                placeholder="Tìm món ăn, nhà hàng..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full bg-slate-100 border-none px-4 py-2 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                            <ShoppingCart className="w-5 h-5" />
                            {(cart?.totalItems ?? 0) > 0 && (
                                <span className="absolute top-1 right-1 bg-accent-600 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center border-2 border-white">
                                    {cart?.totalItems}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated && currentUser ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 p-1.5 pl-3 border border-slate-200 hover:border-primary-200 hover:bg-slate-50 rounded-full transition-all"
                                >
                                    <span className="hidden md:block text-slate-700 text-sm font-semibold mr-1">
                                        {currentUser.fullName?.split(' ').pop()}
                                    </span>
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-xs">
                                            {(currentUser.fullName || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-premium border border-slate-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tài khoản</p>
                                            <p className="text-sm font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                                        </div>
                                        
                                        {currentUser.role === 'VENDOR' && (
                                            <Link
                                                to="/vendor/dashboard"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                            >
                                                <Store className="w-4 h-4 mr-3" />
                                                Quản lý cửa hàng
                                            </Link>
                                        )}
                                        {currentUser.role === 'ADMIN' && (
                                            <Link
                                                to="/admin/dashboard"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 mr-3" />
                                                Quản lý hệ thống
                                            </Link>
                                        )}
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                        >
                                            <User className="w-4 h-4 mr-3" />
                                            Thông tin cá nhân
                                        </Link>
                                        <Link
                                            to="/profile?tab=orders"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                        >
                                            <Package className="w-4 h-4 mr-3" />
                                            Đơn hàng của tôi
                                        </Link>
                                        
                                        <div className="border-t border-slate-50 my-1"></div>
                                        
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="hidden sm:block text-slate-600 hover:text-primary-600 text-sm font-semibold transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-600/20 active:scale-95"
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
