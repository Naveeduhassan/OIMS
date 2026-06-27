import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { ShieldCheck, History } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/auth/audit-logs')
      .then(res => {
        setLogs(res.data?.data || []);
      })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[#0f766e]/10 text-[#0f766e]">
          <History size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold">Audit Logs</h1>
          <p className="text-sm text-slate-500">Track all critical actions performed by staff and admins.</p>
        </div>
      </div>

      <div className="surface rounded-lg">
        {logs.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Action</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Table</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Record ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{log.full_name || 'Unknown'} <span className="text-xs text-slate-400">({log.email})</span></td>
                    <td className="px-4 py-3"><span className="rounded bg-[#f0f9ff] px-2 py-1 text-xs font-semibold text-[#0284c7] capitalize">{log.action.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{log.table_name}</td>
                    <td className="px-4 py-3 text-slate-600">{log.record_id || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }
