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
import { Toaster } from 'sonner'
import NotificationToast from './components/common/NotificationToast'

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
        </Route>
      </Routes>
    </>
  )
}

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-[length:100%_100%]"
        style={{
          backgroundImage: `url('/images/pic2.jpg')`,
        }}
      ></div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl">
          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 drop-shadow-2xl">
            MealGo
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-8 font-medium italic drop-shadow-lg">
            Hương vị của người Việt
          </p>


          {/* Region badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="group cursor-pointer">
              <div className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-red-400">
                <span className="text-2xl mr-2">🔴</span>
                Miền Bắc
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-amber-300">
                <span className="text-2xl mr-2">🟡</span>
                Miền Trung
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-green-400">
                <span className="text-2xl mr-2">🟢</span>
                Miền Nam
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
              🍲 Khám phá món ngon
            </button>
            <Link to="/login">
              <button className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl border-2 border-white/30 hover:bg-white/20 transform hover:scale-105 transition-all duration-300">
                📝 Đăng nhập
              </button>
            </Link>
          </div>

          {/* Status footer */}
          <div className="mt-16 text-white/60 text-sm">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Backend Running
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Frontend Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
