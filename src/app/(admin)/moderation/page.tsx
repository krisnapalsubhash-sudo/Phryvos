'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserX,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_IMMINENT_HARM';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  evidenceSnippet?: string;
  moderatorNotes?: string;
  actionTaken?: string;
  timestamp: string;
}

interface ModerationAppeal {
  id: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatorResponse?: string;
  reviewedBy?: string;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  moderatorId: string;
  action: string;
  targetUserId?: string;
  reportId?: string;
  details?: string;
  createdAt: string;
}

export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'appeals' | 'audit'>('queue');
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);

  // Action dialog state
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/api/moderation/reports';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch {
      toast.error('Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch('/api/moderation/appeals');
      const data = await res.json();
      if (data.success && Array.isArray(data.appeals)) {
        setAppeals(data.appeals);
      }
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/moderation/audit-log');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch {}
  };

  useEffect(() => {
    fetchReports();
    fetchAppeals();
    fetchAuditLogs();
  }, [statusFilter, severityFilter]);

  const handleExecuteAction = async () => {
    if (!selectedReport || !actionType) return;
    setSubmittingAction(true);

    try {
      const res = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action: actionType,
          moderatorNotes: actionNotes.trim() || 'Moderation decision applied per policy.',
          moderatorId: 'admin_console',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Action applied: ${actionType}`);
        setSelectedReport(null);
        setActionType(null);
        setActionNotes('');
        fetchReports();
        fetchAuditLogs();
      } else {
        toast.error(data.error || 'Failed to execute action');
      }
    } catch {
      toast.error('Network error executing action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolveAppeal = async (appealId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/moderation/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          appealId,
          decision,
          moderatorResponse: decision === 'APPROVED' ? 'Appeal granted after review.' : 'Appeal rejected; violation confirmed.',
          moderatorId: 'admin_console',
        }),
      });
      if (res.ok) {
        toast.success(`Appeal ${decision.toLowerCase()}!`);
        fetchAppeals();
      }
    } catch {
      toast.error('Failed to resolve appeal');
    }
  };

  const getSeverityBadge = (severity: ModerationReport['severity']) => {
    switch (severity) {
      case 'CRITICAL_IMMINENT_HARM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical Imminent Harm
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            High Severity
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
            Low
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Trust & Safety Console</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Phryvos Universal Moderation, Minor Protection & Appeals Pipeline
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchReports();
                fetchAppeals();
                fetchAuditLogs();
                toast.success('Queues refreshed');
              }}
              className="px-3.5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-semibold flex items-center gap-2 border border-border transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-primary text-white shadow-md'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            Incident Queue ({reports.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'appeals'
                ? 'bg-primary text-white shadow-md'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            Appeals ({appeals.filter((a) => a.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-primary text-white shadow-md'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: INCIDENT QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Filters bar */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-2">
                  <Filter className="w-3.5 h-3.5" /> Filters:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-secondary text-foreground text-xs rounded-xl px-3 py-1.5 border border-border outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-secondary text-foreground text-xs rounded-xl px-3 py-1.5 border border-border outline-hidden"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL_IMMINENT_HARM">Critical Imminent Harm</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="text-xs text-muted-foreground">
                Showing <strong>{reports.length}</strong> reports
              </div>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Loading incidents...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 p-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
                <h3 className="font-bold text-base">All Clean!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  No pending incidents matching your criteria. The community orbit is healthy and safe.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(report.severity)}
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-secondary">
                          {report.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Reason: <span className="font-normal text-muted-foreground">{report.reason}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target: <code className="text-foreground font-mono">{report.reportedUserId}</code> • Reporter: <code className="text-muted-foreground font-mono">{report.reporterId}</code>
                        </p>
                      </div>

                      {report.evidenceSnippet && (
                        <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono text-muted-foreground">
                          <span className="text-[10px] uppercase font-bold text-primary block mb-1">Preserved Context Snapshot:</span>
                          {report.evidenceSnippet}
                        </div>
                      )}

                      {report.actionTaken && (
                        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Action Taken: {report.actionTaken} ({report.moderatorNotes})</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {report.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('DISMISSED');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('WARNING_ISSUED');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold border border-amber-500/30"
                          >
                            Issue Warning
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('PERMANENT_BAN');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold shadow-xs"
                          >
                            Enforce Ban
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Status: {report.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPEALS WORKFLOW */}
        {activeTab === 'appeals' && (
          <div className="space-y-4">
            {appeals.length === 0 ? (
              <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 p-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
                <h3 className="font-bold text-base">No Appeals Pending</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  No suspended users have filed appeals at this time.
                </p>
              </div>
            ) : (
              appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className="p-5 rounded-2xl bg-card border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        appeal.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {appeal.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(appeal.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">User ID: <code className="font-mono text-foreground">{appeal.userId}</code></p>
                    <div className="p-3 rounded-xl bg-secondary/50 text-xs text-foreground italic">
                      "{appeal.reason}"
                    </div>
                  </div>

                  {appeal.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveAppeal(appeal.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-semibold border border-destructive/30"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleResolveAppeal(appeal.id, 'APPROVED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
                      >
                        Approve & Unfreeze
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="p-4 rounded-2xl bg-card border border-border/80">
            <h3 className="font-bold text-sm mb-4">Immutable Moderator Action Trail</h3>
            <div className="divide-y divide-border/60">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">[{log.action}]</span>
                    <span className="text-muted-foreground">by <strong>{log.moderatorId}</strong></span>
                    {log.targetUserId && (
                      <span className="text-muted-foreground ml-2">on target <code className="font-mono text-foreground">{log.targetUserId}</code></span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {selectedReport && actionType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Confirm Moderation Action</h3>
                <p className="text-xs text-muted-foreground">Action: {actionType}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Target User: <code className="text-foreground font-mono">{selectedReport.reportedUserId}</code></p>
              <p>Report Reason: {selectedReport.reason}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Moderator Note / Rationale:</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Explain the reason for this decision (logged in audit trail)..."
                rows={3}
                className="w-full bg-secondary text-xs rounded-xl p-3 border border-border outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={submittingAction}
                onClick={() => {
                  setSelectedReport(null);
                  setActionType(null);
                  setActionNotes('');
                }}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={submittingAction}
                onClick={handleExecuteAction}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md"
              >
                {submittingAction ? 'Executing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
