import { useState } from 'react';
import { X, Download, ExternalLink, FileText, Share2, Copy, Check, Calendar, Clock, AlertCircle, Link2 } from 'lucide-react';
import { getFileUrl, getFileType, downloadFile } from '../../utils/fileUrl';
import { createShareLink } from '../../api';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  fileUrl: string;
  title?: string;
  onClose: () => void;
  fileId?: string;
  folderId?: string;
  recordId?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

/** Return local datetime-local min string (now + 5 min) */
function getMinDatetime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  // format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

/** Format a Date into a readable expiry string */
function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ─── Share Modal — also exported for use outside FilePreviewModal ── */
export interface ShareModalProps {
  title: string;
  fileId?: string;
  folderId?: string;
  recordId?: string;
  onClose: () => void;
}

export function ShareModal({ title, fileId, folderId, recordId, onClose }: ShareModalProps) {
  const [expiryDatetime, setExpiryDatetime] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedExpiry, setGeneratedExpiry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [validationErr, setValidationErr] = useState('');

  const minDatetime = getMinDatetime();

  const handleGenerate = async () => {
    setValidationErr('');
    if (!expiryDatetime) {
      setValidationErr('Please select an expiry date and time.');
      return;
    }
    const chosen = new Date(expiryDatetime);
    if (isNaN(chosen.getTime()) || chosen <= new Date()) {
      setValidationErr('Expiry must be a future date and time.');
      return;
    }

    setGenerating(true);
    setGeneratedUrl(null);
    setGeneratedExpiry(null);
    try {
      const res = await createShareLink({
        fileId: fileId || undefined,
        folderId: folderId || undefined,
        recordId: recordId || undefined,
        expiresAt: chosen.toISOString(),
      });
      setGeneratedUrl(res.data.data.shareUrl);
      setGeneratedExpiry(res.data.data.expiresAt);
      toast.success('Share link generated!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to generate share link';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    /* Backdrop — sits above the file preview modal (z-60) */
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 60 }}
      onClick={onClose}
    >
      <div
        className="bg-bg border border-border/60 rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '100%', maxWidth: '460px', margin: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between border-b border-border/60"
          style={{ padding: '18px 20px' }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center rounded-xl bg-primary/10"
              style={{ width: '36px', height: '36px' }}
            >
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-text" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                Create Share Link
              </h3>
              <p className="text-text-muted mono truncate" style={{ fontSize: '11px', maxWidth: '260px' }}>
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text hover:bg-surface rounded-lg transition-all"
            style={{ padding: '8px' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '20px' }}>

          {!generatedUrl ? (
            <>
              <p className="text-text-muted" style={{ fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                Anyone with this link can access the file — no login required.
                The link will automatically expire at the date and time you choose.
              </p>

              {/* Expiry datetime picker */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  className="text-text-muted mono uppercase"
                  style={{ fontSize: '10px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}
                >
                  <Clock className="w-3 h-3" />
                  Link expires on <span className="text-red-400">*</span>
                </label>

                {/* Date + Time on two rows for clarity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label
                      className="text-text-muted mono"
                      style={{ fontSize: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Calendar className="w-3 h-3" /> Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDatetime.split('T')[0] || ''}
                      min={minDatetime.split('T')[0]}
                      onChange={(e) => {
                        const datePart = e.target.value;
                        const timePart = expiryDatetime.split('T')[1] || '';
                        setExpiryDatetime(datePart && timePart ? `${datePart}T${timePart}` : datePart ? `${datePart}T` : '');
                        setValidationErr('');
                        setGeneratedUrl(null);
                      }}
                      className="w-full border border-border/60 rounded-xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      style={{ padding: '9px 12px', fontSize: '13px', colorScheme: 'dark' }}
                    />
                  </div>

                  {/* Time */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label
                      className="text-text-muted mono"
                      style={{ fontSize: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Clock className="w-3 h-3" /> Expiry Time
                    </label>
                    <input
                      type="time"
                      value={expiryDatetime.split('T')[1] || ''}
                      onChange={(e) => {
                        const datePart = expiryDatetime.split('T')[0] || '';
                        const timePart = e.target.value;
                        setExpiryDatetime(datePart && timePart ? `${datePart}T${timePart}` : '');
                        setValidationErr('');
                        setGeneratedUrl(null);
                      }}
                      className="w-full border border-border/60 rounded-xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      style={{ padding: '9px 12px', fontSize: '13px', colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Live expiry preview */}
                {expiryDatetime && expiryDatetime.includes('T') && expiryDatetime.split('T')[1] && (
                  <div
                    className="flex items-center gap-2 text-primary bg-primary/5 border border-primary/20 rounded-lg"
                    style={{ marginTop: '10px', padding: '8px 12px', fontSize: '12px' }}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="mono">Expires: {formatExpiry(expiryDatetime)}</span>
                  </div>
                )}

                {/* Validation error */}
                {validationErr && (
                  <div
                    className="flex items-center gap-2 text-red-400"
                    style={{ marginTop: '8px', fontSize: '12px' }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {validationErr}
                  </div>
                )}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !expiryDatetime || !expiryDatetime.split('T')[1]}
                className="w-full bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 mono uppercase"
                style={{ padding: '11px', fontSize: '12px', letterSpacing: '0.06em' }}
              >
                {generating ? 'Generating…' : 'Generate Secure Link'}
              </button>
            </>
          ) : (
            /* ─── Generated state ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400"
                style={{ padding: '10px 14px', fontSize: '12px' }}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span className="mono font-semibold">Link generated successfully</span>
              </div>

              {/* Link box */}
              <div>
                <label className="text-text-muted mono uppercase" style={{ fontSize: '10px', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Share Link
                </label>
                <div
                  className="flex items-center border border-border/60 rounded-xl bg-surface"
                  style={{ gap: '0' }}
                >
                  <span
                    className="text-text mono flex-1 truncate"
                    style={{ fontSize: '11px', padding: '10px 12px', userSelect: 'all', lineHeight: '1.4' }}
                  >
                    {generatedUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center shrink-0 rounded-r-xl font-semibold mono uppercase border-l border-border/60 transition-all ${
                      copied
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-surface hover:bg-primary/10 text-text-muted hover:text-primary'
                    }`}
                    style={{ padding: '10px 14px', fontSize: '11px', gap: '5px' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Expiry info */}
              {generatedExpiry && (
                <div
                  className="flex items-start gap-2 border border-border/60 rounded-xl bg-surface/60"
                  style={{ padding: '12px 14px', fontSize: '12px' }}
                >
                  <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text-muted mono uppercase" style={{ fontSize: '10px', letterSpacing: '0.06em', marginBottom: '2px' }}>
                      Expires on
                    </p>
                    <p className="text-text font-medium" style={{ fontSize: '13px' }}>
                      {formatExpiry(generatedExpiry)}
                    </p>
                    <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                      After this time, the link will be automatically invalidated.
                    </p>
                  </div>
                </div>
              )}

              {/* Generate another */}
              <button
                onClick={() => { setGeneratedUrl(null); setGeneratedExpiry(null); setExpiryDatetime(''); setCopied(false); }}
                className="text-text-muted hover:text-primary mono uppercase transition-all text-center"
                style={{ fontSize: '11px', padding: '4px', letterSpacing: '0.06em' }}
              >
                Generate another link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── File Preview Modal ──────────────────────────────────────────── */

export default function FilePreviewModal({ fileUrl, title, onClose, fileId, folderId, recordId }: FilePreviewModalProps) {
  const fullUrl = getFileUrl(fileUrl);
  const fileType = getFileType(fileUrl);
  const [showShareModal, setShowShareModal] = useState(false);

  const canShare = !!(fileId || folderId || recordId);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="bg-bg border border-border/60 rounded-2xl shadow-xl flex flex-col overflow-hidden"
          style={{ width: '90vw', maxWidth: '900px', height: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b border-border/60"
            style={{ padding: '16px 20px' }}
          >
            <h3
              className="font-serif text-text truncate"
              style={{ fontSize: '18px', maxWidth: '50%' }}
            >
              {title || 'File Preview'}
            </h3>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all mono font-semibold uppercase"
                style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => downloadFile(fileUrl, title)}
                className="flex items-center text-text-muted hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all mono font-semibold uppercase"
                style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                title="Download"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              {canShare && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all mono font-semibold uppercase"
                  style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                  title="Share"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              )}
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text hover:bg-surface rounded-lg transition-all"
                style={{ padding: '8px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-surface/50">
            {fileType === 'pdf' ? (
              <iframe
                src={fullUrl}
                title={title || 'PDF Preview'}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : fileType === 'image' ? (
              <img
                src={fullUrl}
                alt={title || 'Image Preview'}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '16px' }}
              />
            ) : (
              <div
                className="flex flex-col items-center text-text-muted"
                style={{ gap: '16px', padding: '40px' }}
              >
                <FileText className="w-16 h-16" />
                <p className="mono" style={{ fontSize: '14px' }}>
                  Preview not available for this file type.
                </p>
                <button
                  onClick={() => downloadFile(fileUrl, title)}
                  className="flex items-center text-primary hover:bg-primary/5 rounded-lg transition-all mono font-semibold uppercase"
                  style={{ padding: '8px 16px', fontSize: '12px', gap: '6px' }}
                >
                  <Download className="w-4 h-4" /> Download File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal — rendered in a separate layer above the preview */}
      {showShareModal && canShare && (
        <ShareModal
          title={title || 'File'}
          fileId={fileId}
          folderId={folderId}
          recordId={recordId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
