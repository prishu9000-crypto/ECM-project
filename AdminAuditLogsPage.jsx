import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, Clock, Terminal } from 'lucide-react';
import { DEMO_AUDIT_LOGS } from '../../services/demoSeedService';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Operation Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically recorded immutable audit trail of administrative modifications, attendance records, and role delegations.
        </p>
      </div>

      <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-mono font-bold text-emerald-400">AUDIT_LOG_TAMPER_PROTECTION: ACTIVE</p>
            <p className="text-[11px] text-slate-400">Firestore write rules restrict direct client mutations. Logs are committed via Admin SDK.</p>
          </div>
        </div>
        <Badge variant="success">Enforced</Badge>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Actor UID</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {DEMO_AUDIT_LOGS.map((log) => (
                <tr key={log.logId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(log.timestamp)}</td>
                  <td className="py-3 px-4 font-bold text-indigo-700">{log.action}</td>
                  <td className="py-3 px-4 text-slate-700">{log.resourceType}:{log.resourceId}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">{log.actorUid}</td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      {log.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
