import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useLoginMutation } from '../../features/auth/authApi'
import { useAppDispatch } from '../../app/hooks'
import { setCredentials } from '../../features/auth/authSlice'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

// Validation schema
const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export default function LoginPage() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [login, { isLoading }] = useLoginMutation()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormInputs) => {
        try {
            const result = await login(data).unwrap()
            dispatch(setCredentials(result))
            toast.success('Đăng nhập thành công!')

            if (result.role === 'VENDOR') {
                navigate('/vendor/dashboard')
            } else {
                navigate('/')
            }
        } catch (err: any) {
            console.error('Login failed:', err)
            const errorMessage = err?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
            toast.error(errorMessage)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elegant Background Elements */}
            <div className="absolute inset-0 opacity-20 bg-[url('/images/pic2.jpg')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-black"></div>
            
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                    
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-3xl">🍜</span>
                        </div>
                        <h2 className="text-4xl font-display font-black text-white mb-3 tracking-tight">
                            Chào mừng <span className="text-emerald-400">trở lại</span>
                        </h2>
                        <p className="text-emerald-100/60 font-medium">
                            Hãy chuẩn bị cho một bữa tiệc vị giác tuyệt vời.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1 mb-2 block">Địa chỉ Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className={`w-full bg-white/5 border-2 ${errors.email ? 'border-rose-500/50' : 'border-white/5 group-focus-within/input:border-emerald-500/30'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`}
                                        placeholder="your@email.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-rose-400 text-xs mt-2 ml-1 font-bold">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="relative group/input">
                                <div className="flex justify-between items-center mb-2 mx-1">
                                    <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest block">Mật khẩu</label>
                                    <Link to="#" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">Quên?</Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className={`w-full bg-white/5 border-2 ${errors.password ? 'border-rose-500/50' : 'border-white/5 group-focus-within/input:border-emerald-500/30'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`}
                                        placeholder="••••••••"
                                        {...register('password')}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-rose-400 text-xs mt-2 ml-1 font-bold">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="w-5 h-5 bg-white/5 border-white/10 rounded-lg text-emerald-500 focus:ring-emerald-500 focus:ring-offset-emerald-950 transition-all cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-3 block text-sm text-emerald-100/60 font-medium cursor-pointer">
                                Ghi nhớ đăng nhập của tôi
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group/btn py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-display font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>Khám phá ngay</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 text-center">
                        <p className="text-emerald-100/40 text-sm font-medium">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-black transition-colors underline decoration-emerald-500/30 underline-offset-4">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
