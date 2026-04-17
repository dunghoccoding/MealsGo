import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/customer/HomePage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import ProfilePage from './pages/customer/ProfilePage'
import CheckoutPage from './pages/customer/CheckoutPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import { Toaster } from 'sonner'
import NotificationToast from './components/common/NotificationToast'
import { Utensils, LogIn, ChevronRight, Globe, MapPin } from 'lucide-react'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <NotificationToast />
      <Routes>
        {/* Landing page without layout */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Auth pages without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main app with layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </>
  )
}

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      {/* Background image with parallax-like effect */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url('/images/pic2.jpg')`,
        }}
      ></div>

      {/* Sophisticated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-emerald-900/40"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="text-center max-w-5xl w-full">
          {/* Main heading with premium typography */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium tracking-wide">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Tinh hoa ẩm thực Việt Nam</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-display font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            Meals<span className="text-emerald-500">Go</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 font-light max-w-2xl mx-auto leading-relaxed">
            Hành trình khám phá hương vị đặc sắc từ ba miền Bắc - Trung - Nam, 
            mang tinh hoa bếp Việt đến tận cửa nhà bạn.
          </p>

          {/* Region Selection with Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            <div className="group cursor-pointer">
              <div className="bg-white/10 backdrop-blur-xl hover:bg-white/20 p-6 rounded-2xl border border-white/10 shadow-premium hover:shadow-premium-hover transform hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-rose-500/30">
                  <MapPin className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-1">Miền Bắc</h3>
                <p className="text-white/60 text-sm">Hương vị thanh tao, đậm đà truyền thống</p>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="bg-white/10 backdrop-blur-xl hover:bg-white/20 p-6 rounded-2xl border border-white/10 shadow-premium hover:shadow-premium-hover transform hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-amber-500/30">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-1">Miền Trung</h3>
                <p className="text-white/60 text-sm">Cay nồng, đậm vị nắng gió miền Trung</p>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="bg-white/10 backdrop-blur-xl hover:bg-white/20 p-6 rounded-2xl border border-white/10 shadow-premium hover:shadow-premium-hover transform hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-emerald-500/30">
                  <MapPin className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-1">Miền Nam</h3>
                <p className="text-white/60 text-sm">Phóng khoáng, ngọt ngào đặc trưng Nam Bộ</p>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="group relative bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-emerald-500/20 flex items-center gap-3 transition-all overflow-hidden w-full sm:w-auto justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <Utensils className="w-5 h-4" />
              <span>Khám phá món ngon</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl border border-white/20 flex items-center gap-3 transition-all w-full justify-center">
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập ngay</span>
              </button>
            </Link>
          </div>

          {/* Status footer with modern indicator */}
          <div className="mt-20 flex items-center justify-center gap-8 text-white/40 text-xs font-medium uppercase tracking-widest">
            <div className="flex items-center gap-2 group">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="group-hover:text-emerald-400 transition-colors">Core Engine Active</span>
            </div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-2 group">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="group-hover:text-emerald-400 transition-colors">Global Delivery</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

export default App
