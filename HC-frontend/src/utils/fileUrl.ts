/**
 * Resolves a stored file path (e.g. "/uploads/123-file.pdf") to a full backend URL.
 * The API base URL points to /api, but uploads are served from the server root.
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function getFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  // Already a full URL
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  return `${BACKEND_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

/**
 * Detect file type from a URL/path for preview purposes.
 */
export type FileType = 'pdf' | 'image' | 'other';

export function getFileType(fileUrl: string): FileType {
  if (!fileUrl) return 'other';
  const ext = fileUrl.split('.').pop()?.toLowerCase().split('?')[0] || '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  return 'other';
}

/**
 * Programmatic file download.
 * For same-origin files, fetches as blob. For cross-origin (S3 signed URLs),
 * opens in a new tab (browsers handle download from there).
 */
export async function downloadFile(fileUrl: string, filename?: string): Promise<void> {
  try {
    const fullUrl = getFileUrl(fileUrl);
    const downloadName = filename || fileUrl.split('/').pop()?.split('?')[0] || 'download';

    // For S3 / cross-origin URLs, try fetch with no-cors fallback
    try {
      const res = await fetch(fullUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // fetch failed (CORS), fall through to window.open
    }

    // Fallback: open in new tab — browser will render or download depending on Content-Type
    window.open(fullUrl, '_blank');
  } catch (err) {
    console.error('Download error:', err);
  }
}
