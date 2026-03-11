import {
   FileText,
   Search,
   Download,
   Shield,
   Eye,
   Upload,
   UserCheck,
   Lock,
   X,
   Folder,
   FolderOpen,
   MoreVertical,
   ChevronRight,
   Plus,
   Pencil,
   Trash2,
   ArrowLeft,
   Link2,
} from "lucide-react";
import { Sidebar } from "../components/Layout";
import { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { toast } from "sonner";
import FilePreviewModal, { ShareModal } from "../components/FilePreviewModal";
import { downloadFile } from "../../utils/fileUrl";

function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

/* ═══════════════════════════════════════════
   VAULT — View & Upload Medical Records
   ═══════════════════════════════════════════ */

export function Vault() {
   const { user } = useAuth();

   // ── Folder state ────────────────────────────
   const [folders, setFolders] = useState<any[]>([]);
   // folderStack tracks navigation depth: [{id, name}, ...]
   const [folderStack, setFolderStack] = useState<{id: string; name: string}[]>([]);
   const [openMenuId, setOpenMenuId] = useState<string | null>(null);
   const [renamingId, setRenamingId] = useState<string | null>(null);
   const [renameValue, setRenameValue] = useState('');
   const [showNewFolderInput, setShowNewFolderInput] = useState(false);
   const [newFolderName, setNewFolderName] = useState('');
   const [isCreatingFolder, setIsCreatingFolder] = useState(false);

   // ── Record state ─────────────────────────────
   const [records, setRecords] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
   const [previewRecord, setPreviewRecord] = useState<any | null>(null);
   const [shareRecord, setShareRecord] = useState<any | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const fileInputRef = useRef<HTMLInputElement>(null);

   // ── Fetch helpers ───────────────────────────
   const fetchFolders = async () => {
      try {
         const res = await api.get('/folders');
         setFolders(res.data.data.folders);
      } catch {
         toast.error('Failed to fetch folders');
      }
   };

   const fetchRecords = async (folderId: string) => {
      setLoading(true);
      try {
         const res = await api.get('/records/my-records', { params: { folder: folderId } });
         setRecords(res.data.data.records);
      } catch {
         toast.error('Failed to fetch records');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchFolders(); }, []);

   useEffect(() => {
      const id = folderStack.length ? folderStack[folderStack.length - 1].id : null;
      if (id) fetchRecords(id);
      else setRecords([]);
   }, [folderStack]);

   // ── Folder CRUD ─────────────────────────────
   const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return;
      setIsCreatingFolder(true);
      try {
         const parentId = folderStack.length ? folderStack[folderStack.length - 1].id : undefined;
         await api.post('/folders', { name: newFolderName, ...(parentId ? { parent: parentId } : {}) });
         setNewFolderName('');
         setShowNewFolderInput(false);
         fetchFolders();
         toast.success(parentId ? 'Subfolder created' : 'Folder created');
      } catch {
         toast.error('Failed to create folder');
      } finally {
         setIsCreatingFolder(false);
      }
   };

   const handleRenameFolder = async (id: string) => {
      if (!renameValue.trim()) return;
      try {
         await api.patch(`/folders/${id}`, { name: renameValue });
         setRenamingId(null);
         setRenameValue('');
         fetchFolders();
         toast.success('Folder renamed');
      } catch {
         toast.error('Failed to rename folder');
      }
   };

   const handleDeleteFolder = async (id: string) => {
      if (!window.confirm('Delete this folder and all its files?')) return;
      try {
         await api.delete(`/folders/${id}`);
         setFolderStack((prev) => {
            const idx = prev.findIndex((f) => f.id === id);
            return idx !== -1 ? prev.slice(0, idx) : prev;
         });
         fetchFolders();
         toast.success('Folder deleted');
      } catch {
         toast.error('Failed to delete folder');
      }
   };

   const handleDeleteRecord = async (recordId: string) => {
      if (!window.confirm('Delete this file permanently?')) return;
      try {
         await api.delete(`/records/${recordId}`);
         toast.success('File deleted');
         const id = folderStack.length ? folderStack[folderStack.length - 1].id : null;
         if (id) fetchRecords(id);
      } catch {
         toast.error('Failed to delete file');
      }
   };

   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const currentFolderId = folderStack.length ? folderStack[folderStack.length - 1].id : null;
      if (!file || !currentFolderId) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', file.name.split('.')[0]);
      formData.append('folder', currentFolderId);
      setIsUploading(true);
      try {
         await api.post('/records/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
         });
         toast.success('Record uploaded successfully');
         fetchRecords(currentFolderId);
      } catch {
         toast.error('Failed to upload record');
      } finally {
         setIsUploading(false);
         e.target.value = '';
      }
   };

   // ── Derived ──────────────────────────────────
   const currentFolderId = folderStack.length ? folderStack[folderStack.length - 1].id : null;
   const activeFolderObj = folders.find((f) => f._id === currentFolderId);
   // Folders whose parent matches current level (null = root)
   const visibleFolders = folders.filter(
      (f) => (f.parent?.toString() ?? null) === currentFolderId
   );

   const filteredRecords = records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
         (r.description || '').toLowerCase().includes(q) ||
         (r._id || '').toLowerCase().includes(q)
      );
   });

   // ── Render ───────────────────────────────────
   return (
      <div className="min-h-screen bg-bg pt-16 pb-20 md:pb-0 flex" onClick={() => setOpenMenuId(null)}>
         <Sidebar />
         <main className="flex-1 ml-0 md:ml-16 animate-entrance" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>

            {/* ── HEADER ── */}
            <header
               className="flex flex-col md:flex-row md:items-center md:justify-between"
               style={{ marginBottom: 'clamp(24px, 4vw, 40px)', gap: 16 }}
            >
               <div className="flex flex-col" style={{ gap: '4px' }}>
                  {/* Breadcrumb */}
                  <div className="flex items-center flex-wrap" style={{ gap: '6px', marginBottom: '4px' }}>
                     <button
                        onClick={() => { setFolderStack([]); setSearchQuery(''); }}
                        className="font-semibold mono text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
                        style={{ fontSize: '12px' }}
                     >
                        Vault
                     </button>
                     {folderStack.map((crumb, idx) => (
                        <span key={crumb.id} className="flex items-center" style={{ gap: '6px' }}>
                           <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                           {idx === folderStack.length - 1 ? (
                              <span className="font-semibold mono text-text uppercase tracking-widest" style={{ fontSize: '12px' }}>
                                 {crumb.name}
                              </span>
                           ) : (
                              <button
                                 onClick={() => { setFolderStack((prev) => prev.slice(0, idx + 1)); setSearchQuery(''); }}
                                 className="font-semibold mono text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
                                 style={{ fontSize: '12px' }}
                              >
                                 {crumb.name}
                              </button>
                           )}
                        </span>
                     ))}
                  </div>
                  <h1 className="font-serif text-text" style={{ fontSize: 'clamp(22px, 4vw, 30px)' }}>
                     {activeFolderObj ? activeFolderObj.name : 'Medical Vault'}
                  </h1>
                  <p className="uppercase font-semibold mono text-text-muted tracking-widest" style={{ fontSize: '12px' }}>
                     {activeFolderObj ? 'Files inside this folder' : 'Organize your documents in folders'}
                  </p>
               </div>

               {/* Action buttons */}
               <div className="flex flex-wrap" style={{ alignItems: 'center', gap: '10px' }}>
                  {currentFolderId ? (
                     <>
                        <button
                           onClick={() => { setFolderStack((prev) => prev.slice(0, -1)); setSearchQuery(''); }}
                           className="flex items-center border border-border text-text-muted hover:border-primary/40 hover:text-primary uppercase font-semibold rounded-lg transition-all"
                           style={{ gap: '6px', padding: '10px 14px', fontSize: '12px' }}
                        >
                           <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                           onClick={() => { setShowNewFolderInput(true); setNewFolderName(''); }}
                           className="flex items-center border border-border text-text-muted hover:border-primary/40 hover:text-primary uppercase font-semibold rounded-lg transition-all"
                           style={{ gap: '6px', padding: '10px 14px', fontSize: '12px' }}
                        >
                           <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New</span> Subfolder
                        </button>
                        <input
                           type="file"
                           ref={fileInputRef}
                           onChange={handleUpload}
                           className="hidden"
                           accept=".pdf,image/*"
                        />
                        <button
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isUploading}
                           className="flex items-center bg-primary text-white uppercase font-semibold rounded-lg transition-all hover:shadow-[0_4px_16px_-4px_rgba(27,111,99,0.3)] hover:-translate-y-0.5 disabled:opacity-50"
                           style={{ gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                        >
                           <Upload className="w-5 h-5" />
                           {isUploading ? 'Uploading...' : <><span className="hidden sm:inline">Upload</span> File</>}
                        </button>
                     </>
                  ) : (
                     <button
                        onClick={() => { setShowNewFolderInput(true); setNewFolderName(''); }}
                        className="flex items-center bg-primary text-white uppercase font-semibold rounded-lg transition-all hover:shadow-[0_4px_16px_-4px_rgba(27,111,99,0.3)] hover:-translate-y-0.5"
                        style={{ gap: '10px', padding: '14px 24px', fontSize: '14px' }}
                     >
                        <Plus className="w-5 h-5" /> New Folder
                     </button>
                  )}
               </div>
            </header>

            {/* ── MAIN RECORDS CONTAINER ── */}
            <div className="vault-records-container bg-surface border border-border rounded-2xl md:rounded-[32px] shadow-layered min-h-[70vh]" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>

               {/* New-folder / new-subfolder inline input (shown at any level) */}
               {showNewFolderInput && (
                  <div
                     className="flex items-center bg-bg/60 border border-primary/30 rounded-2xl"
                     style={{ padding: '20px 24px', marginBottom: '24px', gap: '12px' }}
                  >
                     <div
                        className="rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"
                        style={{ width: '48px', height: '48px' }}
                     >
                        <Folder className="w-6 h-6 text-primary" />
                     </div>
                     <input
                        type="text"
                        autoFocus
                        placeholder={currentFolderId ? 'Subfolder name…' : 'Folder name…'}
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolderInput(false); }}
                        className="flex-1 bg-transparent outline-none text-text"
                        style={{ fontSize: '15px', fontWeight: 500 }}
                     />
                     <button
                        onClick={handleCreateFolder}
                        disabled={isCreatingFolder || !newFolderName.trim()}
                        className="bg-primary text-white uppercase mono font-bold rounded-lg disabled:opacity-50 transition-all"
                        style={{ padding: '8px 18px', fontSize: '12px' }}
                     >
                        {isCreatingFolder ? 'Creating…' : 'Create'}
                     </button>
                     <button
                        onClick={() => setShowNewFolderInput(false)}
                        className="text-text-muted hover:text-text rounded-lg transition-colors"
                        style={{ padding: '8px' }}
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
               )}

               {/* ══ ROOT EMPTY STATE ══ */}
               {!currentFolderId && visibleFolders.length === 0 && !showNewFolderInput && (
                  <div className="flex flex-col items-center justify-center" style={{ padding: '80px 20px', gap: '16px' }}>
                     <div className="rounded-2xl bg-bg border border-border/60 flex items-center justify-center" style={{ width: '72px', height: '72px' }}>
                        <Folder className="w-8 h-8 text-text-muted" />
                     </div>
                     <h3 className="font-serif text-text" style={{ fontSize: '20px' }}>No folders yet</h3>
                     <p className="mono text-text-muted text-center" style={{ fontSize: '13px', maxWidth: '280px' }}>
                        Create your first folder to start organising your medical records.
                     </p>
                     <button
                        onClick={() => { setShowNewFolderInput(true); setNewFolderName(''); }}
                        className="flex items-center bg-primary text-white uppercase font-semibold rounded-lg hover:shadow-[0_4px_16px_-4px_rgba(27,111,99,0.3)] transition-all"
                        style={{ gap: '8px', padding: '12px 22px', fontSize: '13px', marginTop: '8px' }}
                     >
                        <Plus className="w-4 h-4" /> New Folder
                     </button>
                  </div>
               )}

               {/* ══ FOLDER / SUBFOLDER GRID ══ */}
               {visibleFolders.length > 0 && (
                  <>
                     {currentFolderId && (
                        <p className="uppercase font-semibold mono text-text-muted tracking-widest" style={{ fontSize: '11px', marginBottom: '14px' }}>
                           Subfolders
                        </p>
                     )}
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: '16px' }}>
                        {visibleFolders.map((folder) => (
                           <div
                              key={folder._id}
                              className="group relative bg-bg/40 border border-border/50 rounded-2xl hover:bg-bg hover:border-primary/25 hover:shadow-md transition-all cursor-pointer"
                              style={{ padding: '24px 20px' }}
                              onClick={() => setFolderStack((prev) => [...prev, { id: folder._id, name: folder.name }])}
                           >
                              {/* Folder icon */}
                              <div
                                 className="rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:scale-105 transition-transform"
                                 style={{ width: '52px', height: '52px', marginBottom: '14px' }}
                              >
                                 <Folder className="w-7 h-7 text-primary" />
                              </div>

                              {/* Folder name / rename input */}
                              {renamingId === folder._id ? (
                                 <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                       e.stopPropagation();
                                       if (e.key === 'Enter') handleRenameFolder(folder._id);
                                       if (e.key === 'Escape') setRenamingId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-surface border border-primary/30 rounded-lg outline-none text-text"
                                    style={{ fontSize: '14px', fontWeight: 600, padding: '4px 8px', marginBottom: '4px' }}
                                 />
                              ) : (
                                 <h4
                                    className="font-semibold text-text group-hover:text-primary transition-colors truncate"
                                    style={{ fontSize: '14px', marginBottom: '4px' }}
                                 >
                                    {folder.name}
                                 </h4>
                              )}

                              <p className="mono text-text-muted" style={{ fontSize: '11px' }}>
                                 {folder.createdAt
                                    ? new Date(folder.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                    : ''}
                              </p>

                              {/* 3-dot menu */}
                              <button
                                 onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === folder._id ? null : folder._id); }}
                                 className="absolute top-3 right-3 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all opacity-0 group-hover:opacity-100"
                                 style={{ padding: '6px' }}
                              >
                                 <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown menu */}
                              {openMenuId === folder._id && (
                                 <div
                                    className="absolute right-3 top-10 bg-surface border border-border rounded-xl shadow-lg z-50"
                                    style={{ minWidth: '140px' }}
                                    onClick={(e) => e.stopPropagation()}
                                 >
                                    <button
                                       onClick={() => { setRenamingId(folder._id); setRenameValue(folder.name); setOpenMenuId(null); }}
                                       className="w-full flex items-center text-text hover:bg-bg/60 transition-colors rounded-t-xl"
                                       style={{ padding: '10px 14px', gap: '8px', fontSize: '13px' }}
                                    >
                                       <Pencil className="w-3.5 h-3.5 text-text-muted" /> Rename
                                    </button>
                                    <button
                                       onClick={() => { setOpenMenuId(null); handleDeleteFolder(folder._id); }}
                                       className="w-full flex items-center text-red-500 hover:bg-red-50 transition-colors rounded-b-xl"
                                       style={{ padding: '10px 14px', gap: '8px', fontSize: '13px' }}
                                    >
                                       <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </>
               )}

               {/* Divider between subfolders and files */}
               {currentFolderId && visibleFolders.length > 0 && (
                  <div className="border-t border-border/40" style={{ margin: '32px 0' }} />
               )}

               {/* ══ FILES SECTION — only when inside a folder ══ */}
               {currentFolderId && (
                  <>
                     {/* Search */}
                     <div className="relative w-full" style={{ maxWidth: '320px', marginBottom: 'clamp(24px, 4vw, 40px)' }}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                           type="text"
                           placeholder="Search files…"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-bg/50 border border-border rounded-xl focus:border-primary outline-none transition-colors"
                           style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', fontSize: '15px' }}
                        />
                     </div>

                     {/* Table Header */}
                     <div
                        className="hidden md:grid grid-cols-12 uppercase font-semibold mono text-text-muted tracking-widest"
                        style={{ padding: '0 24px', marginBottom: '12px', fontSize: '12px' }}
                     >
                        <div className="col-span-4">Record</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Shared</div>
                        <div className="col-span-2 text-right">Actions</div>
                     </div>

                     {/* Record Rows */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loading ? (
                           <p className="mono text-text-muted">Loading records…</p>
                        ) : filteredRecords.length === 0 ? (
                           <div className="flex flex-col items-center justify-center" style={{ padding: '60px 20px', gap: '12px' }}>
                              <div className="rounded-2xl bg-bg border border-border/60 flex items-center justify-center" style={{ width: '56px', height: '56px' }}>
                                 <FolderOpen className="w-6 h-6 text-text-muted" />
                              </div>
                              <p className="font-serif text-text" style={{ fontSize: '18px' }}>This folder is empty</p>
                              <p className="mono text-text-muted" style={{ fontSize: '12px' }}>Upload a file to get started.</p>
                           </div>
                        ) : (
                           filteredRecords.map((record) => (
                              <div
                                 key={record._id}
                                 className="group grid grid-cols-1 md:grid-cols-12 items-center bg-bg/40 border border-border/40 rounded-2xl hover:bg-bg hover:border-primary/15 transition-all cursor-pointer"
                                 style={{ padding: 'clamp(14px, 2vw, 18px) clamp(14px, 2vw, 24px)' }}
                              >
                                 <div className="col-span-4 flex items-center mb-3 md:mb-0" style={{ gap: '12px' }}>
                                    <div
                                       className="rounded-xl bg-surface border border-border/60 flex items-center justify-center text-primary group-hover:scale-105 transition-transform"
                                       style={{ width: '48px', height: '48px' }}
                                    >
                                       <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <h4 className="font-semibold text-text group-hover:text-primary transition-colors" style={{ fontSize: '15px' }}>
                                          {record.description}
                                       </h4>
                                       <p className="uppercase mono text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                                          {record._id.slice(-6).toUpperCase()}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="col-span-2 hidden md:block">
                                    <span
                                       className="uppercase font-semibold mono rounded-full"
                                       style={{
                                          fontSize: '11px', padding: '4px 12px',
                                          color: record.fileType === 'PDF' ? '#e05c2a' :
                                                 record.fileType === 'PNG' || record.fileType === 'JPEG' || record.fileType === 'WEBP' || record.fileType === 'GIF' ? '#1b6f63' :
                                                 record.fileType === 'DOCX' || record.fileType === 'DOC' ? '#2a5be0' : '#888',
                                          background: record.fileType === 'PDF' ? 'rgba(224,92,42,0.08)' :
                                                      record.fileType === 'PNG' || record.fileType === 'JPEG' || record.fileType === 'WEBP' || record.fileType === 'GIF' ? 'rgba(27,111,99,0.08)' :
                                                      record.fileType === 'DOCX' || record.fileType === 'DOC' ? 'rgba(42,91,224,0.08)' : 'rgba(136,136,136,0.08)',
                                          border: `1px solid ${record.fileType === 'PDF' ? 'rgba(224,92,42,0.2)' :
                                                               record.fileType === 'PNG' || record.fileType === 'JPEG' || record.fileType === 'WEBP' || record.fileType === 'GIF' ? 'rgba(27,111,99,0.2)' :
                                                               record.fileType === 'DOCX' || record.fileType === 'DOC' ? 'rgba(42,91,224,0.2)' : 'rgba(136,136,136,0.2)'}`,
                                       }}
                                    >
                                       {record.fileType || 'FILE'}
                                    </span>
                                 </div>

                                 <div
                                    className="col-span-2 hidden md:flex flex-col justify-center"
                                    style={{ fontVariantNumeric: 'tabular-nums', gap: '2px' }}
                                 >
                                    <span className="mono text-text" style={{ fontSize: '13px', fontWeight: 500 }}>
                                       {new Date(record.uploadedAt || record.createdAt).toLocaleDateString(undefined, {
                                          month: 'short', day: 'numeric', year: 'numeric',
                                       })}
                                    </span>
                                    <span className="mono text-text-muted" style={{ fontSize: '11px' }}>
                                       {new Date(record.uploadedAt || record.createdAt).toLocaleTimeString(undefined, {
                                          hour: '2-digit', minute: '2-digit',
                                       })}
                                    </span>
                                 </div>

                                 <div className="col-span-2 hidden md:flex items-center" style={{ gap: '4px' }}>
                                    {record.accessList && record.accessList.length > 0 ? (
                                       <span className="mono text-primary font-semibold uppercase" style={{ fontSize: '11px' }}>
                                          {record.accessList.length} doctor{record.accessList.length > 1 ? 's' : ''}
                                       </span>
                                    ) : (
                                       <span className="mono text-text-muted flex items-center" style={{ fontSize: '11px', gap: '4px' }}>
                                          <Lock className="w-3 h-3" /> Private
                                       </span>
                                    )}
                                 </div>

                                 <div className="col-span-2 flex items-center justify-start md:justify-end flex-wrap" style={{ gap: '4px' }}>
                                    <button
                                       onClick={(e) => { e.stopPropagation(); setShareRecord(record); }}
                                       className="text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all flex items-center"
                                       style={{ padding: '8px', gap: '4px' }}
                                       title="Generate Share Link"
                                    >
                                       <Link2 className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={(e) => { e.stopPropagation(); setPreviewRecord(record); }}
                                       className="text-text-muted hover:text-primary hover:bg-surface rounded-lg transition-all"
                                       style={{ padding: '8px' }}
                                       title="Preview"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={(e) => { e.stopPropagation(); downloadFile(record.fileUrl, record.description || record.fileType); }}
                                       className="text-text-muted hover:text-secondary hover:bg-surface rounded-lg transition-all"
                                       style={{ padding: '8px' }}
                                       title="Download"
                                    >
                                       <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record._id); }}
                                       className="text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                       style={{ padding: '8px' }}
                                       title="Delete"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </>
               )}
            </div>
         </main>

         {/* Share Link Modal */}
         {shareRecord && (
            <ShareModal
               title={shareRecord.description || shareRecord.recordType || 'File'}
               recordId={shareRecord._id}
               onClose={() => setShareRecord(null)}
            />
         )}

         {/* File Preview Modal */}
         {previewRecord && (
            <FilePreviewModal
               fileUrl={previewRecord.fileUrl}
               title={previewRecord.description || previewRecord.recordType || 'File Preview'}
               onClose={() => setPreviewRecord(null)}
               recordId={previewRecord._id}
            />
         )}
      </div>
   );
}

/* ═══════════════════════════════════════════
   PROFILE — Manage Account
   ═══════════════════════════════════════════ */
export function Profile() {
   const { user, logout } = useAuth();
   const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
   });

   return (
      <div className="min-h-screen bg-bg pt-16 pb-20 md:pb-0 flex">
         <Sidebar />
         <main className="flex-1 ml-0 md:ml-16 animate-entrance" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>
            <header className="flex flex-col" style={{ gap: '4px', marginBottom: 'clamp(24px, 4vw, 40px)' }}>
               <h1 className="font-serif text-text" style={{ fontSize: 'clamp(22px, 4vw, 30px)' }}>Profile</h1>
               <p className="uppercase font-semibold mono text-text-muted tracking-widest" style={{ fontSize: '12px' }}>
                  Account Settings
               </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 'clamp(24px, 4vw, 40px)' }}>
               {/* Profile Card */}
               <div className="lg:col-span-1">
                  <div className="bg-surface border border-border rounded-2xl md:rounded-[32px] shadow-layered text-center" style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 3vw, 32px)' }}>
                     <div
                        className="mx-auto rounded-full bg-bg border-2 border-primary flex items-center justify-center relative"
                        style={{ width: '96px', height: '96px', marginBottom: '24px' }}
                     >
                        <UserCheck style={{ width: '48px', height: '48px' }} className="text-text-muted" />
                        {user?.isEmailVerified && (
                           <div
                              className="absolute bg-primary rounded-full flex items-center justify-center text-white"
                              style={{ bottom: '2px', right: '2px', width: '28px', height: '28px', border: '3px solid var(--color-surface)' }}
                           >
                              <Shield className="w-3.5 h-3.5" />
                           </div>
                        )}
                     </div>
                     <h2 className="font-serif" style={{ fontSize: '24px' }}>{user?.name}</h2>
                     <p className="uppercase mono text-text-muted" style={{ fontSize: '12px', marginBottom: '28px', marginTop: '4px' }}>
                        {user?.role} · {user?.id?.slice(-6).toUpperCase()}
                     </p>

                     <div className="text-left border-t border-border" style={{ paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="flex flex-col" style={{ gap: '2px' }}>
                           <span className="uppercase mono font-semibold text-text-muted" style={{ fontSize: '12px' }}>
                              Email
                           </span>
                           <span style={{ fontSize: '15px' }}>{user?.email}</span>
                        </div>
                        <div className="flex flex-col" style={{ gap: '2px' }}>
                           <span className="uppercase mono font-semibold text-text-muted" style={{ fontSize: '12px' }}>
                              Status
                           </span>
                           <span style={{ fontSize: '15px' }}>
                              {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                           </span>
                        </div>
                     </div>

                     <button
                        onClick={logout}
                        className="w-full mt-8 bg-revoke/5 text-revoke border border-revoke/15 uppercase mono font-bold py-3 rounded-xl hover:bg-revoke/10 transition-all"
                     >
                        Sign Out
                     </button>
                  </div>
               </div>

               {/* Settings Panel */}
               <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="bg-surface border border-border rounded-2xl md:rounded-[32px] shadow-layered" style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
                     <h2 className="font-serif" style={{ fontSize: '24px', marginBottom: '28px' }}>Account Information</h2>

                     <form
                        onSubmit={(e) => {
                           e.preventDefault();
                           toast.info('Profile update currently handled via registration.');
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                     >
                        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label className="uppercase font-semibold mono text-text-muted" style={{ fontSize: '12px' }}>
                                 Full Name
                              </label>
                              <input
                                 type="text"
                                 value={formData.name}
                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                 className="w-full input-underline"
                                 style={{ fontSize: '15px' }}
                              />
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label className="uppercase font-semibold mono text-text-muted" style={{ fontSize: '12px' }}>
                                 Email
                              </label>
                              <input
                                 type="email"
                                 value={formData.email}
                                 className="w-full input-underline opacity-50 cursor-not-allowed"
                                 disabled
                                 style={{ fontSize: '15px' }}
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end" style={{ paddingTop: '16px' }}>
                           <button
                              type="submit"
                              className="bg-primary text-white uppercase mono font-semibold rounded-lg transition-all hover:shadow-[0_4px_16px_-4px_rgba(27,111,99,0.3)] hover:-translate-y-0.5"
                              style={{ padding: '14px 28px', fontSize: '13px' }}
                           >
                              Save Changes
                           </button>
                        </div>
                     </form>
                  </div>


               </div>
            </div>
         </main>
      </div>
   );
}
