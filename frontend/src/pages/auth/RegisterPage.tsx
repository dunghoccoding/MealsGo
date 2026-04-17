import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useRegisterMutation, type RegisterRequest } from '../../features/auth/authApi'
import { useAppDispatch } from '../../app/hooks'
import { setCredentials } from '../../features/auth/authSlice'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Lock, Phone, Store, MapPin, Loader2, ArrowRight, UserCircle, ShoppingBag } from 'lucide-react'

// Validation schema - matches backend RegisterRequest
const registerSchema = z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số').optional().or(z.literal('')),
    role: z.enum(['CUSTOMER', 'VENDOR']),
    storeName: z.string().optional(),
    storeAddress: z.string().optional(),
    region: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.role === 'VENDOR') {
        return !!data.storeName && data.storeName.length >= 2
    }
    return true
}, { message: "Tên cửa hàng phải có ít nhất 2 ký tự", path: ["storeName"] })
    .refine((data) => {
        if (data.role === 'VENDOR') {
            return !!data.storeAddress && data.storeAddress.length >= 5
        }
        return true
    }, { message: "Địa chỉ cửa hàng là bắt buộc", path: ["storeAddress"] })
    .refine((data) => {
        if (data.role === 'VENDOR') {
            return !!data.region
        }
        return true
    }, { message: "Vui lòng chọn vùng miền", path: ["region"] });

type RegisterFormInputs = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [registerUser, { isLoading }] = useRegisterMutation()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'CUSTOMER'
        }
    })

    const selectedRole = watch('role')

    const onSubmit = async (data: RegisterFormInputs) => {
        try {
            const { confirmPassword, ...rest } = data
            void confirmPassword
            const registerData: RegisterRequest = {
                fullName: rest.fullName,
                email: rest.email,
                password: rest.password,
                phone: rest.phone || undefined,
                role: rest.role,
                ...(rest.role === 'VENDOR' ? {
                    storeName: rest.storeName,
                    storeAddress: rest.storeAddress,
                    region: rest.region,
                } : {}),
            }
            const result = await registerUser(registerData).unwrap()
            dispatch(setCredentials(result))
            toast.success('Đăng ký thành công!')

            if (result.role === 'VENDOR') {
                navigate('/vendor/dashboard')
            } else {
                navigate('/')
            }
        } catch (err: any) {
            console.error('Register failed:', err)
            const errorMessage = err?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
            toast.error(errorMessage)
        }
    }

    const inputContainerClass = "relative group/input"
    const labelClass = "text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1 mb-2 block"
    const iconClass = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors"
    const inputClass = (hasError: boolean) => 
        `w-full bg-white/5 border-2 ${hasError ? 'border-rose-500/50' : 'border-white/5 group-focus-within/input:border-emerald-500/30'} rounded-2xl py-3 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`

    return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-950 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elegant Background Elements */}
            <div className="absolute inset-0 opacity-20 bg-[url('/images/pic2.jpg')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-black"></div>
            
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>

            <div className="max-w-2xl w-full relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                    
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-display font-black text-white mb-3 tracking-tight">
                            Bắt đầu <span className="text-emerald-400">hành trình</span>
                        </h2>
                        <p className="text-emerald-100/60 font-medium">
                            Gia nhập cộng đồng yêu ẩm thực truyền thống ngay hôm nay.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Họ và tên</label>
                                <div className="relative">
                                    <div className={iconClass}><User className="w-5 h-5" /></div>
                                    <input type="text" className={inputClass(!!errors.fullName)} placeholder="Nguyễn Văn A" {...register('fullName')} />
                                </div>
                                {errors.fullName && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.fullName.message}</p>}
                            </div>

                            {/* Email */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Địa chỉ Email</label>
                                <div className="relative">
                                    <div className={iconClass}><Mail className="w-5 h-5" /></div>
                                    <input type="email" className={inputClass(!!errors.email)} placeholder="name@example.com" {...register('email')} />
                                </div>
                                {errors.email && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Mật khẩu</label>
                                <div className="relative">
                                    <div className={iconClass}><Lock className="w-5 h-5" /></div>
                                    <input type="password" className={inputClass(!!errors.password)} placeholder="••••••••" {...register('password')} />
                                </div>
                                {errors.password && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.password.message}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Xác nhận MK</label>
                                <div className="relative">
                                    <div className={iconClass}><Lock className="w-5 h-5" /></div>
                                    <input type="password" className={inputClass(!!errors.confirmPassword)} placeholder="••••••••" {...register('confirmPassword')} />
                                </div>
                                {errors.confirmPassword && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.confirmPassword.message}</p>}
                            </div>

                            {/* Phone */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Số điện thoại</label>
                                <div className="relative">
                                    <div className={iconClass}><Phone className="w-5 h-5" /></div>
                                    <input type="text" className={inputClass(!!errors.phone)} placeholder="0901234567" {...register('phone')} />
                                </div>
                                {errors.phone && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.phone.message}</p>}
                            </div>

                            {/* Role */}
                            <div className={inputContainerClass}>
                                <label className={labelClass}>Bạn là ai?</label>
                                <div className="relative">
                                    <div className={iconClass}><UserCircle className="w-5 h-5" /></div>
                                    <select
                                        className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:bg-white/10 appearance-none transition-all"
                                        {...register('role')}
                                    >
                                        <option value="CUSTOMER" className="bg-emerald-950">🛒 Khách hàng (Mua sắm)</option>
                                        <option value="VENDOR" className="bg-emerald-950">🏪 Nhà hàng (Kinh doanh)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-emerald-100/30">
                                        <ArrowRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vendor-specific fields */}
                        {selectedRole === 'VENDOR' && (
                            <div className="space-y-6 pt-6 mt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                                    <h3 className="font-display font-bold text-emerald-100/80 uppercase tracking-widest text-sm">Thông tin nhà hàng</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Tên cửa hàng</label>
                                        <div className="relative">
                                            <div className={iconClass}><Store className="w-5 h-5" /></div>
                                            <input type="text" className={inputClass(!!errors.storeName)} placeholder="VD: Bún Chả Hà Nội" {...register('storeName')} />
                                        </div>
                                        {errors.storeName && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.storeName.message}</p>}
                                    </div>
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Vùng miền</label>
                                        <div className="relative">
                                            <div className={iconClass}><MapPin className="w-5 h-5" /></div>
                                            <select className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:bg-white/10 appearance-none transition-all" {...register('region')}>
                                                <option value="" className="bg-emerald-950">Chọn vùng miền</option>
                                                <option value="NORTH" className="bg-emerald-950">Miền Bắc</option>
                                                <option value="CENTRAL" className="bg-emerald-950">Miền Trung</option>
                                                <option value="SOUTH" className="bg-emerald-950">Miền Nam</option>
                                            </select>
                                        </div>
                                        {errors.region && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.region.message}</p>}
                                    </div>
                                    <div className={inputContainerClass + " md:col-span-2"}>
                                        <label className={labelClass}>Địa chỉ kinh doanh</label>
                                        <div className="relative">
                                            <div className={iconClass}><MapPin className="w-5 h-5" /></div>
                                            <input type="text" className={inputClass(!!errors.storeAddress)} placeholder="Số nhà, tên đường, quận/huyện..." {...register('storeAddress')} />
                                        </div>
                                        {errors.storeAddress && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-tight">{errors.storeAddress.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group/btn py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-display font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center overflow-hidden pt-6"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>Đăng ký tham gia</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 text-center">
                        <p className="text-emerald-100/40 text-sm font-medium">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-black transition-colors underline decoration-emerald-500/30 underline-offset-4">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
