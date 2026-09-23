import React, { useState } from 'react';
import { Upload, FileAudio, FileText, Download, Trash2, Search, Plus } from 'lucide-react';
import { SaremiCard, SaremiButton, SaremiBadge, SaremiInput, SaremiEmptyState } from '../common/SaremiUI';

export const AdminResourcesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([
    { id: '1', title: 'Yaman Bandish Notations', type: 'PDF', course: 'Hindustani Classical Vocal', date: '2026-09-15', size: '2.4 MB' },
    { id: '2', title: 'Bhairav Riyaaz Track', type: 'Audio', course: 'Hindustani Classical Vocal', date: '2026-09-14', size: '15.1 MB' },
    { id: '3', title: 'Tabla Teental Theka', type: 'Audio', course: 'Rhythm & Percussion', date: '2026-09-12', size: '8.3 MB' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Practice Resources</h2>
          <p className="text-xs text-slate-500">Manage and upload study materials, audio tracks, and notations.</p>
        </div>
        <SaremiButton variant="primary" leftIcon={<Upload className="w-4 h-4" />}>
          Upload Material
        </SaremiButton>
      </div>

      <SaremiCard className="p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources by title or course..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
          <option value="all">All Types</option>
          <option value="pdf">PDF</option>
          <option value="audio">Audio</option>
        </select>
      </SaremiCard>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Resource Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Associated Course</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.course.toLowerCase().includes(search.toLowerCase())).map((resource) => (
                <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${resource.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {resource.type === 'PDF' ? <FileText className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{resource.title}</div>
                        <div className="text-[10px] text-slate-500">{resource.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SaremiBadge variant={resource.type === 'PDF' ? 'rose' : 'indigo'}>
                      {resource.type}
                    </SaremiBadge>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {resource.course}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                    {resource.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8">
                    <SaremiEmptyState 
                      icon="📁"
                      title="No resources found"
                      description="Upload study materials to share with students."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
