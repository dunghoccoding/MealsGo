import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
    useUploadVendorDocumentMutation,
    useGetMyVendorDocumentsQuery,
    type VendorDocument,
} from '../../features/vendors/vendorDocumentApi'
import { Shield, Upload, CheckCircle2, Clock, XCircle, FileText, ArrowRight, Loader2 } from 'lucide-react'

const DOCUMENT_TYPES = [
    {
        type: 'BUSINESS_LICENSE' as const,
        label: 'Giấy phép kinh doanh',
        icon: '📋',
        description: 'Giấy chứng nhận đăng ký kinh doanh do cơ quan có thẩm quyền cấp',
        required: true,
    },
    {
        type: 'FOOD_SAFETY_CERT' as const,
        label: 'Giấy chứng nhận ATTP',
        icon: '🛡️',
        description: 'Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm',
        required: true,
    },
    {
        type: 'ID_CARD' as const,
        label: 'CMND/CCCD chủ cửa hàng',
        icon: '🪪',
        description: 'Ảnh chụp rõ nét 2 mặt CMND hoặc CCCD của chủ cửa hàng',
        required: true,
    },
    {
        type: 'OTHER' as const,
        label: 'Giấy tờ khác',
        icon: '📄',
        description: 'Các loại giấy tờ bổ sung khác (nếu có)',
        required: false,
    },
]

const STATUS_CONFIG = {
    PENDING: { label: 'Đang chờ duyệt', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    REJECTED: { label: 'Bị từ chối', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: XCircle },
}

export default function VendorVerificationPage() {
    const { data: documents, isLoading: loadingDocs } = useGetMyVendorDocumentsQuery()
    const [uploadDocument] = useUploadVendorDocumentMutation()
    const [uploadingType, setUploadingType] = useState<string | null>(null)
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    const getDocForType = (type: string): VendorDocument | undefined => {
        return documents?.find(d => d.documentType === type)
    }

    const approvedCount = documents?.filter(d => d.status === 'APPROVED').length ?? 0
    const requiredTypes = DOCUMENT_TYPES.filter(d => d.required)
    const allApproved = requiredTypes.every(dt => {
        const doc = getDocForType(dt.type)
        return doc && doc.status === 'APPROVED'
    })
    const progress = requiredTypes.length > 0 ? Math.round((approvedCount / requiredTypes.length) * 100) : 0

    const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Tệp quá lớn. Tối đa 10MB.')
            return
        }

        setUploadingType(type)
        try {
            const docFormData = new FormData()
            docFormData.append('file', file)
            docFormData.append('documentType', type)
            await uploadDocument(docFormData).unwrap()

            toast.success('Tải lên thành công! Đang chờ duyệt.')
        } catch (err: any) {
            console.error('Upload error:', err)
            toast.error(err?.data?.message || 'Tải lên thất bại. Vui lòng thử lại.')
        } finally {
            setUploadingType(null)
            if (fileInputRefs.current[type]) {
                fileInputRefs.current[type]!.value = ''
            }
        }
    }

    if (loadingDocs) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-950">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="mt-4 text-emerald-100/60">Đang tải...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 py-12 px-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-4">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Xác minh cửa hàng</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                        Hoàn tất <span className="text-emerald-400">xác minh</span>
                    </h1>
                    <p className="text-emerald-100/60 max-w-lg mx-auto">
                        Vui lòng tải lên các giấy tờ cần thiết để xác minh cửa hàng của bạn.
                        Quá trình duyệt thường mất 1-2 ngày làm việc.
                    </p>
                </div>

                {/* Progress bar */}
                <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-emerald-100/80">Tiến trình xác minh</span>
                        <span className="text-sm font-bold text-emerald-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-emerald-100/40 mt-2">
                        {approvedCount}/{requiredTypes.length} giấy tờ bắt buộc đã được duyệt
                    </p>
                </div>

                {/* All approved success state */}
                {allApproved && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-8 mb-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🎉 Xác minh hoàn tất!</h2>
                        <p className="text-emerald-100/60 mb-6">
                            Cửa hàng của bạn đã được xác minh thành công. Bạn có thể bắt đầu đăng bán sản phẩm ngay!
                        </p>
                        <Link
                            to="/vendor/dashboard"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span>Đến trang quản lý</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}

                {/* Document cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DOCUMENT_TYPES.map((docType) => {
                        const doc = getDocForType(docType.type)
                        const statusConfig = doc ? STATUS_CONFIG[doc.status] : null
                        const StatusIcon = statusConfig?.icon
                        const isUploading = uploadingType === docType.type

                        return (
                            <div
                                key={docType.type}
                                className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group"
                            >
                                {/* Card header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{docType.icon}</div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">
                                                {docType.label}
                                                {docType.required && <span className="text-rose-400 ml-1">*</span>}
                                            </h3>
                                            <p className="text-xs text-emerald-100/40 mt-0.5">{docType.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status badge */}
                                {doc && statusConfig && StatusIcon && (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${statusConfig.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </div>
                                )}

                                {/* Review note */}
                                {doc?.reviewNote && doc.status === 'REJECTED' && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-rose-300">
                                            <span className="font-bold">Lý do: </span>{doc.reviewNote}
                                        </p>
                                    </div>
                                )}

                                {/* Uploaded file preview */}
                                {doc && (
                                    <div className="bg-white/5 rounded-lg p-3 mb-4 flex items-center gap-3">
                                        {doc.fileUrl && (
                                            <img
                                                src={doc.fileUrl}
                                                alt={doc.fileName}
                                                className="w-12 h-12 object-cover rounded-lg border border-white/10"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{doc.fileName}</p>
                                            <p className="text-xs text-emerald-100/40">
                                                {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <FileText className="w-4 h-4 text-emerald-100/30 flex-shrink-0" />
                                    </div>
                                )}

                                {/* Upload area */}
                                {(!doc || doc.status === 'REJECTED') && (
                                    <div
                                        onClick={() => !isUploading && fileInputRefs.current[docType.type]?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                            isUploading
                                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                                : 'border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                                        }`}
                                    >
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                                <p className="text-xs text-emerald-100/60">Đang tải lên...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="w-8 h-8 text-emerald-100/30 group-hover:text-emerald-400 transition-colors" />
                                                <p className="text-xs font-medium text-emerald-100/60">
                                                    {doc?.status === 'REJECTED' ? 'Tải lại giấy tờ' : 'Nhấn để tải lên'}
                                                </p>
                                                <p className="text-xs text-emerald-100/30">JPG, PNG, PDF — Tối đa 10MB</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hidden file input */}
                                <input
                                    ref={el => { fileInputRefs.current[docType.type] = el }}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload(docType.type, e)}
                                    className="hidden"
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Footer info */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-emerald-100/30">
                        Mọi giấy tờ sẽ được bảo mật và chỉ dùng cho mục đích xác minh.
                        Liên hệ hỗ trợ nếu bạn gặp khó khăn.
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <Link
                            to="/vendor/dashboard"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span>Lưu & Đến trang quản lý</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
