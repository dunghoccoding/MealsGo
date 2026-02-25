import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useRegisterMutation, type RegisterRequest } from '../../features/auth/authApi'
import { useAppDispatch } from '../../app/hooks'
import { setCredentials } from '../../features/auth/authSlice'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

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

    const inputClass = (hasError: boolean) =>
        `mt-1 appearance-none rounded-lg relative block w-full px-3 py-2 border ${hasError ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('/images/pic2.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60"></div>

            <div className="max-w-md w-full space-y-8 relative z-10 bg-white p-8 rounded-xl shadow-2xl my-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Đăng ký tài khoản
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-green-600 transition-colors">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                            <input id="fullName" type="text" className={inputClass(!!errors.fullName)} {...register('fullName')} />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input id="email" type="email" className={inputClass(!!errors.email)} {...register('email')} />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                                <input id="password" type="password" className={inputClass(!!errors.password)} {...register('password')} />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Xác nhận MK</label>
                                <input id="confirmPassword" type="password" className={inputClass(!!errors.confirmPassword)} {...register('confirmPassword')} />
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại (tùy chọn)</label>
                            <input id="phone" type="text" placeholder="VD: 0901234567" className={inputClass(!!errors.phone)} {...register('phone')} />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>

                        {/* Role */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Loại tài khoản</label>
                            <select
                                id="role"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                {...register('role')}
                            >
                                <option value="CUSTOMER">🛒 Khách hàng (Đặt đồ ăn)</option>
                                <option value="VENDOR">🏪 Nhà hàng (Bán đồ ăn)</option>
                            </select>
                        </div>

                        {/* Vendor-specific fields */}
                        {selectedRole === 'VENDOR' && (
                            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm font-bold text-amber-800">🏪 Thông tin cửa hàng</p>

                                <div>
                                    <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">Tên cửa hàng *</label>
                                    <input id="storeName" type="text" placeholder="VD: Đặc sản Hà Nội" className={inputClass(!!errors.storeName)} {...register('storeName')} />
                                    {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700">Địa chỉ cửa hàng *</label>
                                    <input id="storeAddress" type="text" placeholder="VD: 123 Phố Huế, Hoàn Kiếm, Hà Nội" className={inputClass(!!errors.storeAddress)} {...register('storeAddress')} />
                                    {errors.storeAddress && <p className="text-red-500 text-xs mt-1">{errors.storeAddress.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor="region" className="block text-sm font-medium text-gray-700">Vùng miền *</label>
                                    <select id="region" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md" {...register('region')}>
                                        <option value="">-- Chọn vùng miền --</option>
                                        <option value="NORTH">🔴 Miền Bắc</option>
                                        <option value="CENTRAL">🟡 Miền Trung</option>
                                        <option value="SOUTH">🟢 Miền Nam</option>
                                    </select>
                                    {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
                                </div>
                            </div>
                        )}

                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
