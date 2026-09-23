import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  User,
  Clock,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  subscribeToAuditLogs,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { AuditLog } from '../../types';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuditLogs(setLogs);
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.targetId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || l.targetType === filterType;

    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const rows = filteredLogs.map((l) => ({
      LogID: l.id,
      Timestamp: l.timestamp,
      Actor: `${l.actorName} (${l.actorRole})`,
      Action: l.action,
      TargetType: l.targetType,
      TargetID: l.targetId,
      Details: l.details
    }));
    exportToCSV('saremi_audit_trail', rows);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Entity Types ({logs.length})</option>
            <option value="student">Student Operations</option>
            <option value="teacher">Faculty Operations</option>
            <option value="pricing">Pricing Matrix</option>
            <option value="payment">Payments & Refunds</option>
            <option value="class">Class Schedules</option>
            <option value="settings">Academy Settings</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Staff Member / Actor</th>
                <th className="py-3.5 px-4">Action & Operation</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records match the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">{log.actorRole}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{log.action}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {log.targetType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 text-[11px]">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Inspect payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Audit Log Payload</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-900">Action:</strong> {selectedLog.action}
                </div>
                <div>
                  <strong className="text-slate-900">Actor:</strong> {selectedLog.actorName} ({selectedLog.actorRole})
                </div>
                <div>
                  <strong className="text-slate-900">Target ID:</strong> {selectedLog.targetId}
                </div>
                <div>
                  <strong className="text-slate-900">Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700">{selectedLog.details}</p>
              </div>

              {selectedLog.metadata && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State Payload / Metadata</label>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
