import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Download, Lock, FileText, Clock, AlertCircle } from 'lucide-react';
import { accessShareLink } from '../../api';

type SharedFile = {
    _id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    signedUrl: string;
    uploadedAt: string;
};

type SharedRecord = {
    _id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: string;
};

type SharedData = {
    type: 'file' | 'folder' | 'record';
    expiresAt: string;
    passwordProtected: boolean;
    file?: SharedFile;
    folder?: {
        _id: string;
        name: string;
        files: SharedFile[];
    };
    record?: SharedRecord;
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({ file }: { file: SharedFile }) {
    const isImage = file.fileType?.startsWith('image/');
    const isPdf = file.fileType === 'application/pdf';

    return (
        <div
            className="border border-border/60 rounded-2xl overflow-hidden bg-surface"
            style={{ marginBottom: '16px' }}
        >
            {/* Preview */}
            {isImage && (
                <div className="bg-surface/80 flex items-center justify-center">
                    <img
                        src={file.signedUrl}
                        alt={file.fileName}
                        style={{ width: '100%', height: 'auto', objectFit: 'contain', padding: '16px', display: 'block' }}
                    />
                </div>
            )}
            {isPdf && (
                <div>
                    <iframe
                        src={file.signedUrl}
                        title={file.fileName}
                        style={{ width: '100%', height: '1100px', border: 'none', display: 'block', borderRadius: '0' }}
                    />
                </div>
            )}
            {!isImage && !isPdf && (
                <div
                    className="flex flex-col items-center justify-center text-text-muted bg-surface/40"
                    style={{ height: '120px', gap: '8px' }}
                >
                    <FileText className="w-10 h-10" />
                    <span className="mono" style={{ fontSize: '12px' }}>Preview unavailable</span>
                </div>
            )}

            {/* Info bar */}
            <div
                className="flex items-center justify-between border-t border-border/60"
                style={{ padding: '12px 16px', gap: '12px' }}
            >
                <div style={{ minWidth: 0 }}>
                    <p className="font-medium text-text truncate" style={{ fontSize: '14px' }}>{file.fileName}</p>
                    <p className="text-text-muted mono" style={{ fontSize: '11px' }}>{formatBytes(file.fileSize)}</p>
                </div>
                <a
                    href={file.signedUrl}
                    download={file.fileName}
                    className="flex items-center gap-1 text-primary hover:bg-primary/10 rounded-lg transition-all mono font-semibold uppercase shrink-0"
                    style={{ padding: '6px 14px', fontSize: '11px' }}
                >
                    <Download className="w-4 h-4" />
                    Download
                </a>
            </div>
        </div>
    );
}

export default function ShareLinkPage() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<SharedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpiredError, setIsExpiredError] = useState(false);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLink = async (pwd?: string) => {
        if (!token) return;
        setSubmitting(true);
        setPasswordError('');
        try {
            const res = await accessShareLink(token, pwd);
            setData(res.data.data);
            setPasswordRequired(false);
            setError(null);
        } catch (err: any) {
            const errCode = err?.response?.data?.errorCode;
            const errMsg: string = err?.response?.data?.message || '';
            const isExpired = errMsg.toLowerCase().includes('expired');
            if (errCode === 'PASSWORD_REQUIRED') {
                setPasswordRequired(true);
                setError(null);
                setIsExpiredError(false);
            } else if (errCode === 'INVALID_PASSWORD') {
                setPasswordError('Incorrect password. Please try again.');
            } else {
                setIsExpiredError(isExpired);
                setError(isExpired ? 'This link has expired.' : (errMsg || 'This link is invalid or has been revoked.'));
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchLink();
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;
        fetchLink(password.trim());
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start bg-bg"
            style={{ paddingTop: '96px', paddingBottom: '48px', paddingLeft: '16px', paddingRight: '16px' }}
        >
            {/* Branding row removed — the fixed Navbar above already shows HealthLocker */}

            <div style={{ width: '100%', maxWidth: '680px' }}>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center text-text-muted" style={{ padding: '80px 0' }}>
                        <div className="animate-spin rounded-full border-2 border-primary border-t-transparent" style={{ width: '32px', height: '32px' }} />
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div
                        className="flex flex-col items-center text-center"
                        style={{ padding: '60px 0', gap: '16px' }}
                    >
                        {isExpiredError ? (
                            <>
                                <div
                                    className="flex items-center justify-center rounded-full bg-amber-500/10"
                                    style={{ width: '64px', height: '64px' }}
                                >
                                    <Clock className="w-8 h-8 text-amber-400" />
                                </div>
                                <h2 className="font-serif text-text" style={{ fontSize: '22px' }}>This link has expired.</h2>
                                <p className="text-text-muted" style={{ fontSize: '14px', maxWidth: '360px' }}>
                                    The share link you are trying to access has passed its expiry date and is no longer valid.
                                    Please request a new link from the owner.
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-12 h-12 text-red-400" />
                                <h2 className="font-serif text-text" style={{ fontSize: '20px' }}>Link Unavailable</h2>
                                <p className="text-text-muted" style={{ fontSize: '14px', maxWidth: '360px' }}>{error}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Password gate */}
                {!loading && passwordRequired && !data && (
                    <div
                        className="border border-border/60 rounded-2xl bg-surface"
                        style={{ padding: '32px', maxWidth: '400px', margin: '0 auto' }}
                    >
                        <div className="flex flex-col items-center" style={{ gap: '16px', marginBottom: '24px' }}>
                            <div
                                className="rounded-full bg-primary/10 flex items-center justify-center"
                                style={{ width: '52px', height: '52px' }}
                            >
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="font-serif text-text" style={{ fontSize: '20px' }}>Password Protected</h2>
                            <p className="text-text-muted text-center" style={{ fontSize: '14px' }}>
                                This link requires a password to access the shared content.
                            </p>
                        </div>
                        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full border border-border/60 rounded-xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                                style={{ padding: '10px 14px', fontSize: '14px' }}
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-red-400 mono" style={{ fontSize: '12px' }}>{passwordError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={submitting || !password.trim()}
                                className="w-full bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                                style={{ padding: '10px', fontSize: '14px' }}
                            >
                                {submitting ? 'Verifying...' : 'Access Link'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Content */}
                {!loading && data && (
                    <div>
                        {/* Header */}
                        <div
                            className="border border-border/60 rounded-2xl bg-surface"
                            style={{ padding: '20px 24px', marginBottom: '24px' }}
                        >
                            <div className="flex items-center justify-between" style={{ gap: '12px' }}>
                                <div>
                                    <h1 className="font-serif text-text" style={{ fontSize: '20px' }}>
                                        {data.type === 'file'
                                            ? (data.file?.fileName || 'Shared File')
                                            : data.type === 'record'
                                            ? (data.record?.fileName || 'Shared Record')
                                            : (data.folder?.name || 'Shared Folder')}
                                    </h1>
                                    <p className="text-text-muted mono" style={{ fontSize: '12px', marginTop: '4px' }}>
                                        Shared securely via HealthLocker
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-text-muted mono" style={{ fontSize: '11px', flexShrink: 0 }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    Expires {new Date(data.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* File */}
                        {data.type === 'file' && data.file && (
                            <FileCard file={data.file} />
                        )}

                        {/* Record (local upload) */}
                        {data.type === 'record' && data.record && (
                            <div
                                className="border border-border/60 rounded-2xl overflow-hidden bg-surface"
                                style={{ marginBottom: '16px' }}
                            >
                                {data.record.fileType?.startsWith('image/') || data.record.fileType === 'JPEG' || data.record.fileType === 'PNG' || data.record.fileType === 'IMAGE' ? (
                                    <div className="bg-surface/80 flex items-center justify-center">
                                        <img
                                            src={data.record.fileUrl}
                                            alt={data.record.fileName}
                                            style={{ width: '100%', height: 'auto', objectFit: 'contain', padding: '16px', display: 'block' }}
                                        />
                                    </div>
                                ) : data.record.fileType === 'application/pdf' || data.record.fileType === 'PDF' ? (
                                    <div>
                                        <iframe
                                            src={data.record.fileUrl}
                                            title={data.record.fileName}
                                            style={{ width: '100%', height: '1100px', border: 'none', display: 'block' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-text-muted bg-surface/40" style={{ height: '120px', gap: '8px' }}>
                                        <FileText className="w-10 h-10" />
                                        <span className="mono" style={{ fontSize: '12px' }}>Preview unavailable</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-border/60" style={{ padding: '12px 16px', gap: '12px' }}>
                                    <p className="font-medium text-text truncate" style={{ fontSize: '14px' }}>{data.record.fileName}</p>
                                    <a
                                        href={data.record.fileUrl}
                                        download={data.record.fileName}
                                        className="flex items-center gap-1 text-primary hover:bg-primary/10 rounded-lg transition-all mono font-semibold uppercase shrink-0"
                                        style={{ padding: '6px 14px', fontSize: '11px' }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Folder */}
                        {data.type === 'folder' && data.folder && (
                            <div>
                                {data.folder.files.length === 0 ? (
                                    <p className="text-text-muted mono text-center" style={{ padding: '40px 0', fontSize: '13px' }}>
                                        This folder is empty.
                                    </p>
                                ) : (
                                    data.folder.files.map((file) => (
                                        <FileCard key={file._id} file={file} />
                                    ))
                                )}
                            </div>
                        )}

                        <p
                            className="text-center text-text-muted mono"
                            style={{ fontSize: '11px', marginTop: '24px' }}
                        >
                            Protected by HealthLocker end-to-end encryption
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
