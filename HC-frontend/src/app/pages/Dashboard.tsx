import {
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { Sidebar } from "../components/Layout";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router";
import api from "../../api";
import FilePreviewModal from "../components/FilePreviewModal";
import { downloadFile } from "../../utils/fileUrl";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Dashboard() {
  return (
    <div className="min-h-screen bg-bg pt-16 pb-20 md:pb-0 flex">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-16 animate-entrance" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>
        <header className="flex flex-col" style={{ gap: '4px', marginBottom: 'clamp(24px, 4vw, 40px)' }}>
          <h1 className="font-serif text-text" style={{ fontSize: 'clamp(22px, 4vw, 30px)' }}>Patient Dashboard</h1>
          <p className="uppercase font-semibold mono text-text-muted tracking-widest" style={{ fontSize: '12px' }}>
            HealthLocker Medical Vault
          </p>
        </header>
        <div className="bg-surface border border-border rounded-2xl md:rounded-[32px] shadow-layered min-h-[70vh]" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>
          <PatientDashboard />
        </div>
      </main>
    </div>
  );
}


/* â”€â”€â”€ Patient Dashboard â”€â”€â”€ */
function PatientDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get('/records/my-records');
        setRecords(res.data.data.records);
      } catch (err) {
        console.error('Failed to fetch records', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Total Records Card */}
      <div
        className="bg-bg/60 border border-border/60 rounded-2xl hover:bg-bg transition-colors group"
        style={{ padding: 'clamp(20px, 3vw, 32px) clamp(16px, 3vw, 40px)', display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2vw, 24px)' }}
      >
        <div
          className="rounded-xl bg-surface border border-border/60 group-hover:border-primary/20 transition-colors text-primary flex items-center justify-center flex-shrink-0"
          style={{ padding: '14px' }}
        >
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="uppercase font-semibold mono text-text-muted" style={{ fontSize: '12px', marginBottom: '6px' }}>
            Total Records
          </div>
          <div className="font-serif text-text" style={{ fontSize: '36px', lineHeight: 1 }}>
            {loading ? '—' : records.length}
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif" style={{ fontSize: '24px' }}>Recent Records</h2>
          <Link
            to="/vault"
            className="uppercase font-semibold mono text-primary hover:text-accent flex items-center gap-1 transition-colors"
            style={{ fontSize: '13px' }}
          >
            View All →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <p className="mono text-text-muted" style={{ padding: '16px 0' }}>Loading records...</p>
          ) : records.length === 0 ? (
            <div className="text-center" style={{ padding: '60px 20px' }}>
              <div className="mx-auto rounded-2xl bg-bg border border-border/60 flex items-center justify-center"
                style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
                <FileText className="w-7 h-7 text-text-muted" />
              </div>
              <h3 className="font-serif text-text" style={{ fontSize: '18px', marginBottom: '6px' }}>No records yet</h3>
              <p className="mono text-text-muted" style={{ fontSize: '12px' }}>
                Head to your Vault to upload your first medical record.
              </p>
            </div>
          ) : (
            records.slice(0, 5).map((record, idx) => (
              <div
                key={idx}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between bg-bg/50 border border-border/50 rounded-2xl hover:bg-bg hover:border-primary/15 transition-all"
                style={{ padding: 'clamp(14px, 2vw, 18px) clamp(14px, 2vw, 20px)' }}
              >
                <div className="flex items-center" style={{ gap: '16px', minWidth: 0 }}>
                  <div
                    className="rounded-xl bg-surface border border-border/60 flex items-center justify-center text-primary flex-shrink-0"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 className="font-semibold text-text truncate" style={{ fontSize: '15px' }}>
                      {record.description || 'Untitled Record'}
                    </h4>
                    <p className="uppercase mono text-text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                      {record.recordType && <>{record.recordType} · </>}{new Date(record.uploadedAt || record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 mt-2 sm:mt-0 ml-[60px] sm:ml-0" style={{ gap: '4px' }}>
                  <button
                    onClick={() => setPreviewRecord(record)}
                    className="flex items-center text-primary hover:bg-primary/5 rounded-lg transition-all mono font-semibold uppercase"
                    style={{ padding: '6px 12px', fontSize: '11px', gap: '5px' }}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => downloadFile(record.fileUrl, record.description || record.recordType)}
                    className="flex items-center text-text-muted hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all mono font-semibold uppercase"
                    style={{ padding: '6px 12px', fontSize: '11px', gap: '5px' }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
