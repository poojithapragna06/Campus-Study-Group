import React, { useState } from 'react';
import { Upload, FileText, Image, Archive, Table2, Search, Download, Trash2, FolderOpen } from 'lucide-react';
import { studyGroups } from '../data/mockData';
import { useFiles, useDeleteFile, useUploadFile } from '../hooks/useQueries';
import { LoadingSpinner, ErrorState, MutationButton } from './ui';

const typeIcon = (type: string) => {
  switch (type) {
    case 'image': return <Image size={16} style={{ color: '#7C3AED' }} />;
    case 'spreadsheet': return <Table2 size={16} style={{ color: '#10B981' }} />;
    case 'archive': return <Archive size={16} style={{ color: '#F97316' }} />;
    default: return <FileText size={16} style={{ color: '#00D4AA' }} />;
  }
};
const typeBg = (type: string) => {
  switch (type) {
    case 'image': return 'rgba(124,58,237,0.1)';
    case 'spreadsheet': return 'rgba(16,185,129,0.1)';
    case 'archive': return 'rgba(249,115,22,0.1)';
    default: return 'rgba(0,212,170,0.1)';
  }
};
const inferType = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'image';
  if (['xlsx','csv','tsv'].includes(ext)) return 'spreadsheet';
  if (['zip','tar','gz','rar'].includes(ext)) return 'archive';
  return 'pdf';
};

const SharedFiles: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: files = [], isLoading, isError, refetch } = useFiles();
  const deleteFile = useDeleteFile();
  const uploadFile = useUploadFile();

  const allGroups = ['All', ...studyGroups.map(g => g.name)];
  const filtered = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const groupName = studyGroups.find(g => g.id === f.groupId)?.name ?? '';
    const matchGroup = filterGroup === 'All' || groupName === filterGroup;
    return matchSearch && matchGroup;
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(f => {
      uploadFile.mutate({
        groupId: 'g1',
        name: f.name,
        size: f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : (f.size / 1024).toFixed(0) + ' KB',
        type: inferType(f.name),
        uploadedBy: 'Aryan Sharma',
        uploadedAt: new Date().toISOString().split('T')[0],
        url: '#',
      });
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteFile.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Shared Files</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>Notes, assignments, and resources</p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800' }}>
          <FolderOpen size={13} />{files.length} files shared
        </div>
      </div>

      {/* Drop zone */}
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        className="border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-all duration-200 cursor-pointer"
        style={{ borderColor: dragOver ? '#FFB800' : '#2A3A50', background: dragOver ? 'rgba(255,184,0,0.05)' : 'transparent' }}>
        {uploadFile.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} className="animate-bounce mx-auto" style={{ color: '#FFB800' }} />
            <p className="text-sm font-medium" style={{ color: '#FFB800' }}>Uploading…</p>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto mb-2" style={{ color: dragOver ? '#FFB800' : '#4A5A70' }} />
            <p className="text-sm font-medium" style={{ color: dragOver ? '#FFB800' : '#6B7A8D' }}>
              {dragOver ? 'Drop to upload' : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#4A5A70' }}>PDF, Images, ZIP — Max 25 MB</p>
          </>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allGroups.map(g => (
            <button key={g} onClick={() => setFilterGroup(g)} className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ background: filterGroup === g ? '#FFB800' : '#1E2A3A', color: filterGroup === g ? '#0D0D0D' : '#6B7A8D', border: '1px solid ' + (filterGroup === g ? '#FFB800' : '#2A3A50') }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner label="Loading files…" />
      ) : isError ? (
        <ErrorState message="Failed to load files." onRetry={() => refetch()} />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E2A3A' }}>
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider"
            style={{ background: '#111827', color: '#4A5A70' }}>
            <div className="col-span-5">File Name</div>
            <div className="col-span-2">Group</div>
            <div className="col-span-2">Uploaded By</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1"></div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#4A5A70' }}>No files found.</div>
          ) : filtered.map((file, i) => {
            const group = studyGroups.find(g => g.id === file.groupId);
            const isDeleting = deletingId === file.id;
            return (
              <div key={file.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 transition-all duration-200"
                style={{ background: i % 2 === 0 ? '#1A1F2E' : '#161D2A', borderTop: '1px solid #1E2A3A', opacity: isDeleting ? 0.4 : 1 }}>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: typeBg(file.type) }}>
                    {typeIcon(file.type)}
                  </div>
                  <span className="text-sm font-medium text-white truncate">{file.name}</span>
                </div>
                <div className="col-span-2">
                  {group && (
                    <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: group.coverColor + '15', color: group.coverColor }}>
                      {group.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-sm" style={{ color: '#6B7A8D' }}>{file.uploadedBy}</div>
                <div className="col-span-1 text-sm" style={{ color: '#6B7A8D' }}>{file.size}</div>
                <div className="col-span-1 text-xs" style={{ color: '#4A5A70' }}>{file.uploadedAt}</div>
                <div className="col-span-1 flex items-center gap-1 justify-end">
                  <button className="p-1.5 rounded-lg" style={{ background: '#1E2A3A', color: '#6B7A8D' }}><Download size={12} /></button>
                  <button onClick={() => handleDelete(file.id)} disabled={isDeleting} className="p-1.5 rounded-lg" style={{ background: '#1E2A3A', color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedFiles;
