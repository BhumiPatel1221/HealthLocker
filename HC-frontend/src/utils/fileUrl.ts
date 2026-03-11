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
 * Programmatic file download that works cross-origin.
 * Fetches the file as a blob and triggers a browser download.
 */
export async function downloadFile(fileUrl: string, filename?: string): Promise<void> {
  try {
    const fullUrl = getFileUrl(fileUrl);
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || fileUrl.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
  }
}
