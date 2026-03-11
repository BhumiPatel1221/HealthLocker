import { useState } from "react";
import { toast } from "sonner";
import api from "../../api";

export default function FolderManager({ folders, onFolderChange, onRefresh }: {
  folders: any[];
  onFolderChange: (folderId: string) => void;
  onRefresh: () => void;
}) {
  const [newFolder, setNewFolder] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = async () => {
    if (!newFolder.trim()) return;
    setCreating(true);
    try {
      await api.post("/folders", { name: newFolder });
      setNewFolder("");
      onRefresh();
      toast.success("Folder created");
    } catch {
      toast.error("Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await api.patch(`/folders/${id}`, { name: renameValue });
      setRenamingId(null);
      setRenameValue("");
      onRefresh();
      toast.success("Folder renamed");
    } catch {
      toast.error("Failed to rename folder");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this folder and all its files?")) return;
    try {
      await api.delete(`/folders/${id}`);
      onRefresh();
      toast.success("Folder deleted");
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="New folder name"
          value={newFolder}
          onChange={e => setNewFolder(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", minWidth: 120 }}
        />
        <button onClick={handleCreate} disabled={creating || !newFolder.trim()} style={{ padding: 8, borderRadius: 6, background: "#1b6f63", color: "#fff" }}>
          {creating ? "Creating..." : "Create Folder"}
        </button>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {folders.map(folder => (
          <div key={folder._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "8px 16px", background: "#f8f9fa", display: "flex", alignItems: "center", gap: 8 }}>
            {renamingId === folder._id ? (
              <>
                <input value={renameValue} onChange={e => setRenameValue(e.target.value)} style={{ padding: 4, borderRadius: 4, border: "1px solid #ccc" }} />
                <button onClick={() => handleRename(folder._id)} style={{ color: "#1b6f63" }}>Save</button>
                <button onClick={() => setRenamingId(null)} style={{ color: "#888" }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 500, cursor: "pointer" }} onClick={() => onFolderChange(folder._id)}>{folder.name}</span>
                <button onClick={() => { setRenamingId(folder._id); setRenameValue(folder.name); }} style={{ color: "#1b6f63" }}>Rename</button>
                <button onClick={() => handleDelete(folder._id)} style={{ color: "#c00" }}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
