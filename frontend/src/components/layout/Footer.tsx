import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-white mt-auto border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="bg-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                                <img src="/logo.svg" alt="MealGo Logo" className="w-8 h-8" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">MealGo</span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Hương vị của người Việt - Kết nối tinh hoa ẩm thực 3 miền, mang đặc sản vùng miền đến tận bàn ăn nhà bạn.
                        </p>
                        <div className="flex space-x-4">
                            {/* Facebook SVG */}
                            <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-green-600 transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                            </a>
                            {/* Instagram SVG */}
                            <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-green-600 transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4.162 4.162 0 110-8.324 4.162 4.162 0 010 8.324zM18.406 4.406a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" /></svg>
                            </a>
                            {/* YouTube SVG */}
                            <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-green-600 transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Liên kết nhanh</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Trang chủ
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Giới thiệu
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Hỗ trợ khách hàng</h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Câu hỏi thường gặp
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Chính sách đổi trả
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Điều khoản dịch vụ
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-green-500 text-sm transition-colors block">
                                    Bảo mật thông tin
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h3 className="text-white font-semibold text-lg mb-6">Thông tin liên hệ</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3 text-sm">
                                <span className="text-green-500 mt-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </span>
                                <span className="text-slate-400 italic">Email: support@mealgo.vn</span>
                            </li>
                            <li className="flex items-start space-x-3 text-sm">
                                <span className="text-green-500 mt-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </span>
                                <span className="text-slate-400">Hotline: 1800 6688</span>
                            </li>
                            <li className="flex items-start space-x-3 text-sm">
                                <span className="text-green-500 mt-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                <span className="text-slate-400">Giờ làm việc: 7:00 - 23:00 (Hằng ngày)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-900 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-500 text-xs">
                    <p>&copy; 2026 MealGo. Bản quyền thuộc về Công ty TNHH Đặc Sản Việt.</p>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-white transition-colors">Vietnamese</a>
                        <a href="#" className="hover:text-white transition-colors">English</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
