import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, RefreshCw, CheckCircle2, KeyRound } from 'lucide-react'
import {
    useForgotPasswordMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
} from '../../features/auth/authApi'

// ── Schemas ────────────────────────────────────────────────────────────────
const emailSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
})
const otpSchema = z.object({
    otp: z
        .string()
        .length(6, 'OTP phải đúng 6 chữ số')
        .regex(/^\d{6}$/, 'OTP chỉ gồm chữ số'),
})
const newPassSchema = z
    .object({
        newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
        confirmPassword: z.string().min(6, 'Xác nhận mật khẩu không được để trống'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
    })

type EmailForm = z.infer<typeof emailSchema>
type OtpForm = z.infer<typeof otpSchema>
type NewPassForm = z.infer<typeof newPassSchema>

// ── OTP Input Component ────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const inputs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (i: number, ch: string) => {
        const digit = ch.replace(/\D/g, '').slice(-1)
        const arr = value.split('')
        arr[i] = digit
        const next = arr.join('').padEnd(6, '')
        onChange(next.slice(0, 6))
        if (digit && i < 5) inputs.current[i + 1]?.focus()
    }

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[i] && i > 0) {
                inputs.current[i - 1]?.focus()
                const arr = value.split('')
                arr[i - 1] = ''
                onChange(arr.join('').padEnd(6, ''))
            } else {
                const arr = value.split('')
                arr[i] = ''
                onChange(arr.join('').padEnd(6, ''))
            }
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        onChange(pasted.padEnd(6, ''))
        const focusIdx = Math.min(pasted.length, 5)
        inputs.current[focusIdx]?.focus()
    }

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-black text-white bg-white/5 border-2 border-white/10 rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:bg-white/10 transition-all duration-200 caret-emerald-400"
                />
            ))}
        </div>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [email, setEmail] = useState('')
    const [otpValue, setOtpValue] = useState('')
    const [resetToken, setResetToken] = useState('')

    // Resend cooldown: 60 seconds
    const [resendCooldown, setResendCooldown] = useState(0)
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation()
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
    const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation()

    // ── Forms ────────────────────────────────────────────────────────────────
    const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
    const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })
    const passForm = useForm<NewPassForm>({ resolver: zodResolver(newPassSchema) })

    // ── Cooldown timer ───────────────────────────────────────────────────────
    const startCooldown = () => {
        setResendCooldown(60)
        if (cooldownRef.current) clearInterval(cooldownRef.current)
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

    // ── Handlers ─────────────────────────────────────────────────────────────
    const onSubmitEmail = async (data: EmailForm) => {
        try {
            await forgotPassword({ email: data.email }).unwrap()
            setEmail(data.email)
            setStep(2)
            startCooldown()
            toast.success('Mã OTP đã được gửi đến email của bạn!')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.')
        }
    }

    const onResendOtp = async () => {
        if (resendCooldown > 0 || isSendingOtp) return
        try {
            await forgotPassword({ email }).unwrap()
            setOtpValue('')
            startCooldown()
            toast.success('Mã OTP mới đã được gửi!')
        } catch (err: any) {
            toast.error(err?.data?.message || 'Không thể gửi lại OTP.')
        }
    }

    const onSubmitOtp = async () => {
        if (otpValue.replace(/\s/g, '').length < 6) {
            toast.error('Vui lòng nhập đủ 6 chữ số OTP.')
            return
        }
        try {
            const res = await verifyOtp({ email, otp: otpValue }).unwrap()
            setResetToken(res.resetToken)
            setStep(3)
            toast.success('OTP hợp lệ! Hãy đặt mật khẩu mới.')
        } catch (err: any) {
            toast.error(err?.data?.message || 'OTP không đúng hoặc đã hết hạn.')
            setOtpValue('')
        }
    }

    const onSubmitNewPass = async (data: NewPassForm) => {
        try {
            await resetPassword({
                resetToken,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            }).unwrap()
            toast.success('Đặt lại mật khẩu thành công!')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err: any) {
            toast.error(err?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
        }
    }

    // ── Step labels ───────────────────────────────────────────────────────────
    const steps = [
        { label: 'Nhập email', icon: '📧' },
        { label: 'Xác thực OTP', icon: '🔢' },
        { label: 'Mật khẩu mới', icon: '🔑' },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 opacity-20 bg-[url('/images/pic2.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-black" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {steps.map((s, i) => {
                            const idx = i + 1
                            const isActive = idx === step
                            const isDone = idx < step
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                                            isDone
                                                ? 'bg-emerald-500 text-emerald-950'
                                                : isActive
                                                ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400'
                                                : 'bg-white/5 border border-white/10 text-white/20'
                                        }`}
                                    >
                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div
                                            className={`w-8 h-0.5 rounded transition-all duration-500 ${
                                                isDone ? 'bg-emerald-500' : 'bg-white/10'
                                            }`}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* ── STEP 1: Email ─────────────────────────────────────────────── */}
                    {step === 1 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-5 group-hover:scale-110 transition-transform duration-500">
                                    <Mail className="w-9 h-9 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
                                    Quên <span className="text-emerald-400">mật khẩu?</span>
                                </h2>
                                <p className="text-emerald-100/50 text-sm font-medium">
                                    Nhập email của bạn để nhận mã xác thực OTP.
                                </p>
                            </div>

                            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5">
                                <div className="relative group/input">
                                    <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1 mb-2 block">
                                        Địa chỉ Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            className={`w-full bg-white/5 border-2 ${
                                                emailForm.formState.errors.email
                                                    ? 'border-rose-500/50'
                                                    : 'border-white/5 group-focus-within/input:border-emerald-500/30'
                                            } rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`}
                                            placeholder="your@email.com"
                                            {...emailForm.register('email')}
                                        />
                                    </div>
                                    {emailForm.formState.errors.email && (
                                        <p className="text-rose-400 text-xs mt-2 ml-1 font-bold">
                                            {emailForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSendingOtp}
                                    className="w-full relative group/btn py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-display font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden"
                                >
                                    {isSendingOtp ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Gửi mã OTP</span>
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-8 border-t border-white/5 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-emerald-100/40 hover:text-emerald-400 text-sm font-bold transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: OTP ───────────────────────────────────────────────── */}
                    {step === 2 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-5">
                                    <KeyRound className="w-9 h-9 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
                                    Nhập <span className="text-emerald-400">mã OTP</span>
                                </h2>
                                <p className="text-emerald-100/50 text-sm font-medium">
                                    Mã 6 chữ số đã gửi đến{' '}
                                    <span className="text-emerald-400 font-bold">{email}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* OTP Boxes */}
                                <OtpInput value={otpValue} onChange={setOtpValue} />

                                {/* Resend Button */}
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={onResendOtp}
                                        disabled={resendCooldown > 0 || isSendingOtp}
                                        className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${
                                            resendCooldown > 0
                                                ? 'text-emerald-100/25 cursor-not-allowed'
                                                : 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
                                        }`}
                                    >
                                        {isSendingOtp ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw
                                                className={`w-4 h-4 ${resendCooldown > 0 ? '' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                                            />
                                        )}
                                        {resendCooldown > 0
                                            ? `Gửi lại sau ${resendCooldown}s`
                                            : 'Gửi lại mã OTP'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={onSubmitOtp}
                                    disabled={isVerifying || otpValue.replace(/\D/g, '').length < 6}
                                    className="w-full relative group/btn py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-display font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isVerifying ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Xác nhận OTP</span>
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="inline-flex items-center gap-2 text-emerald-100/40 hover:text-emerald-400 text-sm font-bold transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Thay đổi email
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: New Password ───────────────────────────────────────── */}
                    {step === 3 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-5">
                                    <Lock className="w-9 h-9 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
                                    Mật khẩu <span className="text-emerald-400">mới</span>
                                </h2>
                                <p className="text-emerald-100/50 text-sm font-medium">
                                    Tạo mật khẩu mới cho tài khoản của bạn.
                                </p>
                            </div>

                            <form onSubmit={passForm.handleSubmit(onSubmitNewPass)} className="space-y-5">
                                {/* New Password */}
                                <div className="relative group/input">
                                    <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1 mb-2 block">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            className={`w-full bg-white/5 border-2 ${
                                                passForm.formState.errors.newPassword
                                                    ? 'border-rose-500/50'
                                                    : 'border-white/5 group-focus-within/input:border-emerald-500/30'
                                            } rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`}
                                            placeholder="Ít nhất 6 ký tự"
                                            {...passForm.register('newPassword')}
                                        />
                                    </div>
                                    {passForm.formState.errors.newPassword && (
                                        <p className="text-rose-400 text-xs mt-2 ml-1 font-bold">
                                            {passForm.formState.errors.newPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="relative group/input">
                                    <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1 mb-2 block">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-100/30 group-focus-within/input:text-emerald-400 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            className={`w-full bg-white/5 border-2 ${
                                                passForm.formState.errors.confirmPassword
                                                    ? 'border-rose-500/50'
                                                    : 'border-white/5 group-focus-within/input:border-emerald-500/30'
                                            } rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100/20 focus:outline-none focus:bg-white/10 transition-all duration-300`}
                                            placeholder="Nhập lại mật khẩu"
                                            {...passForm.register('confirmPassword')}
                                        />
                                    </div>
                                    {passForm.formState.errors.confirmPassword && (
                                        <p className="text-rose-400 text-xs mt-2 ml-1 font-bold">
                                            {passForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="w-full relative group/btn py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-display font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isResetting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Đặt lại mật khẩu</span>
                                            <CheckCircle2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
