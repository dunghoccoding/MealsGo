import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Facebook, Instagram, Youtube, Mail, Phone, Clock, X, ChevronDown, ChevronUp, ShieldCheck, RotateCcw, HelpCircle } from 'lucide-react'

// FAQ data
const faqItems = [
    {
        question: 'Làm thế nào để đặt hàng trên MealsGo?',
        answer: 'Bạn chỉ cần chọn món ăn yêu thích, thêm vào giỏ hàng, điền thông tin giao hàng và tiến hành thanh toán. Đơn hàng sẽ được xác nhận ngay sau khi bạn hoàn tất thanh toán.'
    },
    {
        question: 'Thời gian giao hàng mất bao lâu?',
        answer: 'Thời gian giao hàng tùy thuộc vào khoảng cách và tình trạng giao thông, thường từ 20-45 phút. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi".'
    },
    {
        question: 'Tôi có thể hủy đơn hàng không?',
        answer: 'Bạn có thể hủy đơn hàng trong vòng 5 phút sau khi đặt, trước khi nhà hàng bắt đầu chuẩn bị. Sau thời gian này, vui lòng liên hệ hotline để được hỗ trợ.'
    },
    {
        question: 'MealsGo hỗ trợ những phương thức thanh toán nào?',
        answer: 'Chúng tôi hỗ trợ thanh toán tiền mặt khi nhận hàng (COD), chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay) và thẻ tín dụng/ghi nợ quốc tế.'
    },
    {
        question: 'Làm sao để liên hệ với cửa hàng/nhà hàng?',
        answer: 'Bạn có thể liên hệ trực tiếp với nhà hàng thông qua trang chi tiết đơn hàng hoặc gọi hotline hỗ trợ 0963 895 066 để được giải đáp nhanh nhất.'
    },
    {
        question: 'Tôi có thể đánh giá món ăn sau khi nhận được không?',
        answer: 'Có! Sau khi nhận hàng, bạn có thể đánh giá và để lại nhận xét về chất lượng món ăn. Điều này giúp cộng đồng MealsGo chọn được những món ngon nhất.'
    }
]

// Modal content component
function SupportModal({ isOpen, onClose, title, icon, children }: {
    isOpen: boolean
    onClose: () => void
    title: string
    icon: React.ReactNode
    children: React.ReactNode
}) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-[modalIn_0.3s_ease-out]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-500 border border-primary-500/30">
                            {icon}
                        </div>
                        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    )
}

// FAQ Accordion item
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
            >
                <span className="text-sm font-medium text-slate-200 pr-4">{question}</span>
                {isOpen
                    ? <ChevronUp className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
            </button>
            {isOpen && (
                <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3 animate-[fadeIn_0.2s_ease-out]">
                    {answer}
                </div>
            )}
        </div>
    )
}

export default function Footer() {
    const [activeModal, setActiveModal] = useState<'faq' | 'return' | 'terms' | null>(null)
    const navigate = useNavigate()

    const handleHomeClick = (e: React.MouseEvent) => {
        e.preventDefault()
        navigate('/')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <>
            <footer className="bg-slate-950 text-white mt-auto border-t border-slate-900 font-sans">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
                        {/* Brand Section */}
                        <div className="space-y-8">
                            <Link to="/" className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20 group-hover:bg-primary-500 transition-all">
                                    <span className="font-display font-black text-xl">M</span>
                                </div>
                                <span className="text-2xl font-display font-bold tracking-tight">Meal<span className="text-primary-500">Go</span></span>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-light">
                                Hành trình khám phá hương vị đặc sắc từ ba miền Bắc - Trung - Nam, mang tinh hoa bếp Việt đến tận cửa nhà bạn.
                            </p>
                            <div className="flex space-x-5">
                                <a href="https://www.facebook.com/profile.php?id=61576414005563" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:bg-primary-600 transition-all text-slate-400 hover:text-white border border-slate-800 hover:border-primary-500 hover:-translate-y-1 shadow-lg">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="https://www.instagram.com/_dxng.ntie/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:bg-primary-600 transition-all text-slate-400 hover:text-white border border-slate-800 hover:border-primary-500 hover:-translate-y-1 shadow-lg">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="https://www.youtube.com/@TienDung-uq1io" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:bg-primary-600 transition-all text-slate-400 hover:text-white border border-slate-800 hover:border-primary-500 hover:-translate-y-1 shadow-lg">
                                    <Youtube className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-white font-display font-bold text-lg mb-8 relative inline-block">
                                Liên kết nhanh
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary-600 rounded-full"></span>
                            </h3>
                            <ul className="space-y-4">
                                <li>
                                    <a href="/" onClick={handleHomeClick} className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Trang chủ
                                    </a>
                                </li>
                                <li>
                                    <Link to="/about" className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Giới thiệu
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Liên hệ
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="text-white font-display font-bold text-lg mb-8 relative inline-block">
                                Hỗ trợ khách hàng
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary-600 rounded-full"></span>
                            </h3>
                            <ul className="space-y-4">
                                <li>
                                    <button onClick={() => setActiveModal('faq')} className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Câu hỏi thường gặp
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setActiveModal('return')} className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Chính sách đổi trả
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setActiveModal('terms')} className="text-slate-400 hover:text-primary-400 text-sm transition-colors flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 mr-0 group-hover:mr-2 transition-all rounded-full"></span>
                                        Điều khoản dịch vụ
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-8">
                            <h3 className="text-white font-display font-bold text-lg mb-8 relative inline-block">
                                Thông tin liên hệ
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary-600 rounded-full"></span>
                            </h3>
                            <ul className="space-y-5">
                                <li className="flex items-start space-x-4 group">
                                    <div className="p-2 bg-slate-900 rounded-lg text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all border border-slate-800">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Email hỗ trợ</p>
                                        <p className="text-slate-300 text-sm font-medium">tiendung0629@gmail.com</p>
                                    </div>
                                </li>
                                <li className="flex items-start space-x-4 group">
                                    <div className="p-2 bg-slate-900 rounded-lg text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all border border-slate-800">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Hotline</p>
                                        <p className="text-slate-300 text-sm font-medium"> 0963 895 066</p>
                                    </div>
                                </li>
                                <li className="flex items-start space-x-4 group">
                                    <div className="p-2 bg-slate-900 rounded-lg text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all border border-slate-800">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Giờ làm việc</p>
                                        <p className="text-slate-300 text-sm font-medium">7:00 - 23:00 (Hằng ngày)</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-900 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-500 text-[10px] sm:text-xs">
                        <p className="font-light tracking-wide">&copy; 2026 MealsGo. Bản quyền thuộc về Kiên Dũng Vũ Kiên.</p>
                        <div className="flex items-center space-x-8">
                            <div className="flex space-x-6">
                                <a href="#" className="hover:text-primary-400 transition-colors uppercase font-bold tracking-widest">Tiếng Việt</a>
                                <a href="#" className="hover:text-primary-400 transition-colors uppercase font-bold tracking-widest">English</a>
                            </div>
                            <div className="w-px h-4 bg-slate-800 hidden md:block"></div>
                            <div className="flex space-x-6">
                                <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
                                <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* FAQ Modal */}
            <SupportModal
                isOpen={activeModal === 'faq'}
                onClose={() => setActiveModal(null)}
                title="Câu hỏi thường gặp"
                icon={<HelpCircle className="w-5 h-5" />}
            >
                <div className="space-y-3">
                    {faqItems.map((item, index) => (
                        <FaqItem key={index} question={item.question} answer={item.answer} />
                    ))}
                </div>
            </SupportModal>

            {/* Return Policy Modal */}
            <SupportModal
                isOpen={activeModal === 'return'}
                onClose={() => setActiveModal(null)}
                title="Chính sách đổi trả"
                icon={<RotateCcw className="w-5 h-5" />}
            >
                <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <div className="p-4 bg-primary-600/10 border border-primary-500/20 rounded-xl">
                        <p className="text-primary-400 font-semibold mb-1">Cam kết của MealsGo</p>
                        <p className="text-slate-400">Chúng tôi luôn đặt quyền lợi khách hàng lên hàng đầu. Nếu có bất kỳ vấn đề nào về đơn hàng, chúng tôi sẵn sàng hỗ trợ bạn.</p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                            Trường hợp được đổi trả & hoàn tiền
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-4">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Món ăn bị giao sai so với đơn đặt hàng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Thực phẩm bị hư hỏng, ôi thiu do lỗi từ bếp hoặc shop</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Thiếu món trong đơn hàng do lỗi từ nhà hàng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Chất lượng món ăn không đảm bảo vệ sinh an toàn thực phẩm</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Đơn hàng bị hư hại do quá trình đóng gói hoặc vận chuyển từ phía shop</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Trường hợp KHÔNG được đổi trả
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-4">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">✗</span>
                                <span>Khách hàng đổi ý sau khi đã nhận hàng mà sản phẩm không bị lỗi</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">✗</span>
                                <span>Sản phẩm bị hư hỏng do lỗi bảo quản của khách hàng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">✗</span>
                                <span>Yêu cầu đổi trả sau 2 giờ kể từ khi nhận hàng</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <h4 className="text-white font-semibold mb-2">Quy trình đổi trả</h4>
                        <ol className="space-y-1.5 text-slate-400 list-decimal list-inside">
                            <li>Liên hệ hotline <span className="text-primary-400 font-medium">0963 895 066</span> hoặc email trong vòng 2 giờ sau khi nhận hàng</li>
                            <li>Cung cấp hình ảnh/video làm bằng chứng</li>
                            <li>Chúng tôi xác minh và xử lý trong vòng 24 giờ</li>
                            <li>Hoàn tiền qua phương thức thanh toán ban đầu hoặc đổi món mới</li>
                        </ol>
                    </div>
                </div>
            </SupportModal>

            {/* Terms of Service Modal */}
            <SupportModal
                isOpen={activeModal === 'terms'}
                onClose={() => setActiveModal(null)}
                title="Điều khoản dịch vụ"
                icon={<ShieldCheck className="w-5 h-5" />}
            >
                <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <div className="p-4 bg-primary-600/10 border border-primary-500/20 rounded-xl">
                        <p className="text-slate-400">Bằng việc sử dụng dịch vụ MealsGo, bạn đồng ý tuân thủ các điều khoản dưới đây. Các điều khoản này được xây dựng phù hợp với quy định pháp luật Việt Nam.</p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500 text-xs font-bold border border-primary-500/30">1</span>
                            Điều kiện sử dụng
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-9">
                            <li>• Người dùng phải từ 16 tuổi trở lên để đăng ký tài khoản</li>
                            <li>• Thông tin đăng ký phải chính xác và trung thực</li>
                            <li>• Mỗi cá nhân chỉ được sở hữu một tài khoản MealsGo</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500 text-xs font-bold border border-primary-500/30">2</span>
                            Quyền và trách nhiệm của người dùng
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-9">
                            <li>• Được bảo vệ thông tin cá nhân theo Luật An ninh mạng Việt Nam</li>
                            <li>• Có quyền khiếu nại khi chất lượng dịch vụ không đảm bảo</li>
                            <li>• Không sử dụng nền tảng cho mục đích vi phạm pháp luật</li>
                            <li>• Chịu trách nhiệm về mọi hoạt động trên tài khoản của mình</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500 text-xs font-bold border border-primary-500/30">3</span>
                            Quy định về đối tác bán hàng
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-9">
                            <li>• Phải có giấy phép kinh doanh và chứng nhận vệ sinh an toàn thực phẩm</li>
                            <li>• Tuân thủ quy định về an toàn thực phẩm của Bộ Y tế</li>
                            <li>• Đảm bảo chất lượng món ăn và thời gian chuẩn bị</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500 text-xs font-bold border border-primary-500/30">4</span>
                            Bảo mật thông tin
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-9">
                            <li>• Tuân thủ Luật An ninh mạng 2018 và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân</li>
                            <li>• Không chia sẻ thông tin khách hàng cho bên thứ ba khi chưa có sự đồng ý</li>
                            <li>• Áp dụng các biện pháp bảo mật theo tiêu chuẩn quốc tế</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500 text-xs font-bold border border-primary-500/30">5</span>
                            Giải quyết tranh chấp
                        </h4>
                        <ul className="space-y-2 text-slate-400 ml-9">
                            <li>• Ưu tiên giải quyết thông qua thương lượng và hòa giải</li>
                            <li>• Tuân thủ Luật Bảo vệ quyền lợi người tiêu dùng 2023</li>
                            <li>• Trường hợp không thể hòa giải sẽ giải quyết tại Tòa án nhân dân có thẩm quyền</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-500 text-xs">
                        <p>Điều khoản có hiệu lực từ ngày 01/01/2026. MealsGo có quyền cập nhật điều khoản và sẽ thông báo trước 30 ngày qua email đã đăng ký.</p>
                    </div>
                </div>
            </SupportModal>

            {/* Custom animations */}
            <style>{`
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.4);
                }
            `}</style>
        </>
    )
}
