import React, { useEffect, useState, useMemo } from 'react';
import { BarChart2, FileText, User, CheckCircle, DownloadCloud } from 'lucide-react';

export default function AutomatedReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Fetch report with current user's auth token
  const fetchReport = async () => {
    setLoading(true);
    try {
      // Get token from stored user data
      const userDataStr = localStorage.getItem('thesisSphereUser');
      let token = null;
      
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          token = userData.token;
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
      if (!token) {
        setError('No authentication token found. Please log in.');
        return;
      }

      const params = new URLSearchParams();
      params.set('type', activeTab);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/automated-report?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const body = await res.json();
      setReport(body.report || null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch report');
      console.error('Fetch report error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, fromDate, toDate]);

  // filtered recent progress
  const filteredProgress = useMemo(() => {
    let items = (report?.recentProgress || []).slice();
    if (fromDate) {
      const f = new Date(fromDate);
      items = items.filter(p => p.createdAt && new Date(p.createdAt) >= f);
    }
    if (toDate) {
      const t = new Date(toDate);
      items = items.filter(p => p.createdAt && new Date(p.createdAt) <= t);
    }
    return items;
  }, [report, fromDate, toDate]);

  // auto-select first chapter when report loads
  React.useEffect(() => {
    if (report?.chapters?.length > 0 && !selectedChapter) {
      setSelectedChapter(report.chapters[0].title);
    }
  }, [report]);

  // revisions for selected chapter: all progress entries matching that topic
  const chapterRevisions = useMemo(() => {
    if (!selectedChapter) return [];
    return (report?.recentProgress || [])
      .filter(p => (p.topicTitle || 'Unknown Topic') === selectedChapter)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [report, selectedChapter]);

  // selected chapter meta
  const selectedChapterMeta = useMemo(() => {
    return (report?.chapters || []).find(c => c.title === selectedChapter) || null;
  }, [report, selectedChapter]);

  // chart data for statuses
  const statusData = useMemo(() => {
    const entries = Object.entries(report?.applicationsByStatus || {});
    const total = entries.reduce((s, [,v])=> s+v, 0) || 1;
    return entries.map(([k,v])=>({key:k, value:v, percent: Math.round((v/total)*100)}));
  }, [report]);

  // small line points from recent progress progressPercentage
  const linePoints = useMemo(() => {
    const points = (report?.recentProgress || []).map((p, i) => ({ x: i, y: Number(p.progressPercentage) || 0 }));
    return points;
  }, [report]);

  // Helpers to generate printable views using current report data (closed over)
  const buildPieSvg = (data) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let start = 0;
    const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4'];
    return data.map((d, i) => {
      const slice = d.value / total;
      const end = start + slice;
      const a0 = 2 * Math.PI * start - Math.PI/2;
      const a1 = 2 * Math.PI * end - Math.PI/2;
      const x0 = 16 + 16 * Math.cos(a0);
      const y0 = 16 + 16 * Math.sin(a0);
      const x1 = 16 + 16 * Math.cos(a1);
      const y1 = 16 + 16 * Math.sin(a1);
      const large = slice > 0.5 ? 1 : 0;
      const path = `M16 16 L ${x0} ${y0} A 16 16 0 ${large} 1 ${x1} ${y1} Z`;
      start = end;
      return `<path d=\"${path}\" fill=\"${colors[i % colors.length]}\" stroke=\"#fff\"/>`;
    }).join('');
  };

  const buildSparkline = (points) => {
    if (!points || points.length === 0) return '';
    const maxY = Math.max(...points.map(p=>p.y), 1);
    const stepX = 300 / Math.max(1, points.length - 1);
    const coords = points.map((p, i) => `${i*stepX},${100 - (p.y / maxY) * 80}`).join(' ');
    return `<polyline fill=\"none\" stroke=\"#3b82f6\" stroke-width=2 points=\"${coords}\"/>`;
  };

  const printReportItemLocal = (item) => {
    const title = `Week ${item.weekNo || item.week || ''} Progress Report`;
    const submittedAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
    const bodyHtml = escapeHtml(item.summary || item.notes || item.title || 'No summary').replace(/\n/g, '<br/>');
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:12mm}body{font-family:Inter,Arial,sans-serif;margin:0;color:#111} .wrap{padding:18px} h1{font-size:20px;margin:0 0 6px} .meta{color:#666;font-size:12px;margin-bottom:12px} .content{font-size:14px;line-height:1.6} .chart{margin-top:12px}</style></head><body><div class=\"wrap\"><h1>${escapeHtml(title)}</h1><div class=\"meta\">Submitted: ${escapeHtml(submittedAt)}</div><div class=\"content\">${bodyHtml}</div><div class=\"chart\"><svg width=\"320\" height=\"120\">${buildSparkline(linePoints)}</svg></div><div style=\"margin-top:18px;font-size:11px;color:#666\">Generated by ThesisSphere • ${escapeHtml(new Date().toLocaleString())}</div></div></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return alert('Popup blocked. Allow popups to download.');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>{ try { w.print(); } catch(e){ console.error(e);} }, 300);
  };

  const handleGenerateLocal = async (type) => {
    const title = `${type} - Automated Report`;
    const now = new Date().toLocaleString();
    try {
      const q = new URLSearchParams();
      q.set('type', type.toLowerCase().split(' ')[0]);
      if (fromDate) q.set('from', fromDate);
      if (toDate) q.set('to', toDate);
      const res = await fetch('/api/automated-report?' + q.toString());
      if (!res.ok) return alert('Failed to fetch report from server');
      const body = await res.json();
      const data = body.report || {};
      const statusEntries = Object.entries(data.applicationsByStatus || {}).map(([k,v]) => ({ key: k, value: v }));
      const statusHtml = statusEntries.length ? `<svg viewBox=\"0 0 32 32\" width=\"120\" height=\"120\">${buildPieSvg(statusEntries)}</svg>` : '';
      const pts = (data.recentProgress || []).slice().reverse().map((p,i) => ({ x: i, y: Number(p.progressPercentage) || 0 }));
      const spark = buildSparkline(pts);
      const recentHtml = (data.recentProgress || []).slice(0,5).map(p => {
        const who = p.submittedByName || p.submittedBy || '';
        const topic = p.topicTitle ? ` (${escapeHtml(p.topicTitle)})` : '';
        return `<li><strong>Week ${p.weekNo||p.week||''}</strong> — ${escapeHtml((p.summary||'').slice(0,240))} <em style=\"color:#666\">${escapeHtml(who)}</em>${topic}</li>`;
      }).join('');

      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:12mm}body{font-family:Inter,Arial,sans-serif;margin:0;color:#111} .wrap{padding:18px} h1{font-size:22px;margin:0 0 6px} .meta{color:#666;font-size:12px;margin-bottom:12px} .lead{background:#f8fafc;padding:12px;border:1px solid #eef2ff} .row{display:flex;gap:18px;margin-top:12px} .col{flex:1} ul{margin:0;padding-left:18px}</style></head><body><div class=\"wrap\"><h1>${escapeHtml(title)}</h1><div class=\"meta\">Generated: ${escapeHtml(now)}</div><div class=\"lead\">This report is generated from the latest thesis progress data.</div><div class=\"row\"><div class=\"col\"><h3>Applications by status</h3>${statusHtml}</div><div class=\"col\"><h3>Progress trend</h3><svg width=\"320\" height=\"120\">${spark}</svg></div></div><div style=\"margin-top:14px\"><h3>Recent progress</h3><ul>${recentHtml}</ul></div><div style=\"margin-top:14px\"><h3>Chapter summaries</h3><ul>${(data.chapters||[]).map(c=>`<li><strong>${escapeHtml(c.title)}</strong> — ${escapeHtml((c.latestSummary||'').slice(0,240))} • ${escapeHtml(String(c.avgProgress||0))}%</li>`).join('')}</ul></div><div style=\"margin-top:18px;font-size:11px;color:#666\">Generated by ThesisSphere • ${escapeHtml(now)}</div></div></body></html>`;
      const w = window.open('', '_blank');
      if (!w) return alert('Popup blocked. Allow popups to generate report.');
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(()=>{ try { w.print(); } catch(e){ console.error(e);} }, 350);
    } catch (err) {
      console.error('generate report error', err);
      alert('Failed to generate report');
    }
  };

  // Download handlers for each report type
  const downloadMonthlyReport = () => {
    const data = report;
    const now = new Date().toLocaleString();
    const chapters = data.chapters || [];
    const meetings = data.supervisorActivity?.meetings || [];
    const actionItems = data.supervisorActivity?.actionItems || [];
    const deadlines = data.thesisPackage?.deadlines || [];
    const milestones = [...actionItems, ...deadlines];

    // Overall chapter completion
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(c => (c.avgProgress || 0) >= 95).length;
    const overallAvg = totalChapters > 0
      ? Math.round(chapters.reduce((s, c) => s + (c.avgProgress || 0), 0) / totalChapters)
      : 0;
    const totalMeetings = meetings.length;
    const pendingItems = actionItems.filter(a => a.status === 'pending').length;

    const chapterRows = chapters.map(ch => {
      const p = Math.min(100, ch.avgProgress || 0);
      const statusLabel = p >= 95 ? 'Completed' : p >= 50 ? 'In Progress' : 'Early Stage';
      const statusColor = p >= 95 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444';
      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 12px;font-size:13px;"><strong>${escapeHtml(ch.title)}</strong></td>
          <td style="padding:10px 12px;">
            <div style="background:#e5e7eb;border-radius:4px;height:16px;overflow:hidden;width:120px;">
              <div style="background:#3b82f6;height:100%;width:${p}%;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">${p}%</div>
            </div>
          </td>
          <td style="padding:10px 12px;text-align:center;">
            <span style="background:${statusColor}20;color:${statusColor};padding:3px 8px;border-radius:10px;font-size:11px;font-weight:bold;">${statusLabel}</span>
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${escapeHtml((ch.latestSummary || '').slice(0, 120))}</td>
        </tr>
      `;
    }).join('');

    const meetingRows = meetings.slice(0, 10).map(m => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:13px;">${m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</td>
        <td style="padding:10px 12px;font-size:13px;"><strong>${escapeHtml(m.supervisor || 'Unknown')}</strong></td>
        <td style="padding:10px 12px;font-size:13px;">${escapeHtml(m.topic || 'General Discussion')}</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${escapeHtml((m.notes || 'No notes').slice(0, 100))}</td>
      </tr>
    `).join('');

    const milestoneRows = milestones.slice(0, 10).map(item => {
      const isDeadline = !!item.daysRemaining;
      const label = isDeadline ? (item.daysRemaining > 0 ? `${item.daysRemaining}d remaining` : 'Overdue') : (item.status || 'pending');
      const color = isDeadline
        ? (item.daysRemaining < 7 ? '#ef4444' : item.daysRemaining < 14 ? '#f59e0b' : '#10b981')
        : ({ completed: '#10b981', pending: '#f59e0b', overdue: '#ef4444' }[item.status] || '#6b7280');
      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 12px;font-size:13px;"><strong>${escapeHtml(item.title || 'Milestone')}</strong></td>
          <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${escapeHtml(item.type || (item.priority ? `Priority: ${item.priority}` : ''))}</td>
          <td style="padding:10px 12px;font-size:12px;">${item.dueDate || item.date ? new Date(item.dueDate || item.date).toLocaleDateString() : 'N/A'}</td>
          <td style="padding:10px 12px;text-align:center;">
            <span style="background:${color}20;color:${color};padding:3px 8px;border-radius:10px;font-size:11px;font-weight:bold;">${label}</span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Monthly Progress Report</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; }
        .header { text-align: center; margin-bottom: 28px; border-bottom: 3px solid #d97706; padding-bottom: 14px; }
        h1 { margin: 0; color: #92400e; font-size: 26px; }
        .meta { color: #9ca3af; font-size: 11px; margin-top: 4px; }
        .kpi-grid { display: flex; gap: 14px; margin-bottom: 22px; }
        .kpi { flex: 1; background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 6px; text-align: center; }
        .kpi-val { font-size: 28px; font-weight: bold; color: #d97706; }
        .kpi-lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
        h2 { color: #92400e; font-size: 16px; margin-top: 20px; margin-bottom: 8px; border-left: 4px solid #d97706; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background-color: #fef3c7; color: #92400e; padding: 10px 12px; text-align: left; font-weight: bold; font-size: 12px; }
        td { padding: 8px; vertical-align: middle; }
        .empty { color: #9ca3af; font-style: italic; padding: 12px; }
        .footer { margin-top: 36px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Monthly Progress Report</h1>
        <div class="meta">Auto-filled from chapter completion, meetings &amp; milestones &nbsp;·&nbsp; Generated: ${now}</div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-val">${overallAvg}%</div><div class="kpi-lbl">Overall Chapter Completion</div></div>
        <div class="kpi"><div class="kpi-val">${completedChapters}/${totalChapters}</div><div class="kpi-lbl">Chapters Completed</div></div>
        <div class="kpi"><div class="kpi-val">${totalMeetings}</div><div class="kpi-lbl">Meetings Held</div></div>
        <div class="kpi"><div class="kpi-val">${pendingItems}</div><div class="kpi-lbl">Pending Action Items</div></div>
      </div>

      <h2>📚 Chapter Completion</h2>
      <table>
        <thead><tr><th>Chapter</th><th>Progress</th><th>Status</th><th>Summary</th></tr></thead>
        <tbody>${chapterRows || '<tr><td colspan="4" class="empty">No chapter data available</td></tr>'}</tbody>
      </table>

      <h2>📅 Meetings This Period</h2>
      <table>
        <thead><tr><th>Date</th><th>Supervisor</th><th>Topic</th><th>Notes</th></tr></thead>
        <tbody>${meetingRows || '<tr><td colspan="4" class="empty">No meetings recorded</td></tr>'}</tbody>
      </table>

      <h2>🎯 Milestones &amp; Action Items</h2>
      <table>
        <thead><tr><th>Title</th><th>Type / Priority</th><th>Due Date</th><th>Status</th></tr></thead>
        <tbody>${milestoneRows || '<tr><td colspan="4" class="empty">No milestones recorded</td></tr>'}</tbody>
      </table>

      <div class="footer">
        <p>This report is auto-generated by ThesisSphere</p>
        <p>© 2026 ThesisSphere. All rights reserved.</p>
      </div>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    if (!w) return alert('Popup blocked. Please allow popups.');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch(e) { console.error(e); } }, 350);
  };

  const downloadChapterReport = () => {
    const meta = selectedChapterMeta;
    const revisions = chapterRevisions;
    const chTitle = selectedChapter || 'Chapter';
    const now = new Date().toLocaleString();
    const progress = Math.min(100, meta?.avgProgress || 0);
    const statusLabel = progress >= 95 ? 'Completed' : progress >= 50 ? 'In Progress' : 'Early Stage';
    const statusColor = progress >= 95 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';

    const revisionRows = revisions.map((r, i) => {
      const rPct = Math.min(100, Number(r.progressPercentage) || 0);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; color: #6b7280; font-size: 12px;">#${i + 1}</td>
          <td style="padding: 10px; text-align: left; font-size: 12px; color: #374151;">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Unknown'}</td>
          <td style="padding: 10px; text-align: center;">
            <div style="background:#e5e7eb; border-radius:4px; height:18px; overflow:hidden; width:100px; margin:0 auto;">
              <div style="background:#2563eb; height:100%; width:${rPct}%; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">${rPct}%</div>
            </div>
          </td>
          <td style="padding: 10px; text-align: left; font-size: 12px;">${escapeHtml((r.summary || r.notes || '').slice(0, 200))}</td>
          <td style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280;">${escapeHtml(r.supervisorFeedback ? r.supervisorFeedback.slice(0, 100) : 'No feedback')}</td>
        </tr>
      `;
    }).join('');

    // build SVG sparkline for this chapter
    const maxP = Math.max(...revisions.map(r => Number(r.progressPercentage) || 0), 1);
    const pts = revisions.map((r, i) => {
      const x = revisions.length > 1 ? (i / (revisions.length - 1)) * 280 + 10 : 140;
      const y = 80 - ((Number(r.progressPercentage) || 0) / maxP) * 65;
      return `${x},${y}`;
    }).join(' ');
    const spark = revisions.length > 0 ? `<polyline fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" points="${pts}"/>` : '';
    const dots = revisions.map((r, i) => {
      const x = revisions.length > 1 ? (i / (revisions.length - 1)) * 280 + 10 : 140;
      const y = 80 - ((Number(r.progressPercentage) || 0) / maxP) * 65;
      return `<circle cx="${x}" cy="${y}" r="3" fill="#2563eb"/>`;
    }).join('');

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Chapter Breakdown — ${escapeHtml(chTitle)}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; }
        .header { text-align: center; margin-bottom: 28px; border-bottom: 3px solid #2563eb; padding-bottom: 14px; }
        h1 { margin: 0; color: #1e40af; font-size: 24px; }
        .subtitle { color: #6b7280; font-size: 13px; margin-top: 4px; }
        .meta { color: #9ca3af; font-size: 11px; margin-top: 4px; }
        .section { margin-bottom: 22px; }
        h2 { color: #1e40af; font-size: 16px; margin-top: 18px; margin-bottom: 8px; border-left: 4px solid #2563eb; padding-left: 10px; }
        .info-grid { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
        .info-card { flex: 1; min-width: 110px; background: #f0f9ff; padding: 12px; border-radius: 6px; text-align: center; }
        .info-val { font-size: 22px; font-weight: bold; color: #1e40af; }
        .info-lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 14px; border-radius: 4px; font-size: 13px; line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background-color: #dbeafe; color: #1e40af; padding: 10px; text-align: left; font-weight: bold; font-size: 12px; }
        td { padding: 8px; vertical-align: top; }
        .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .footer { margin-top: 36px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Chapter Breakdown Report</h1>
        <div class="subtitle">${escapeHtml(chTitle)}</div>
        <div class="meta">Generated on: ${now}</div>
      </div>

      <div class="section">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-val">${progress}%</div>
            <div class="info-lbl">Overall Progress</div>
          </div>
          <div class="info-card">
            <div class="info-val">${revisions.length}</div>
            <div class="info-lbl">Total Revisions</div>
          </div>
          <div class="info-card">
            <div class="info-val" style="color:${statusColor}">${statusLabel}</div>
            <div class="info-lbl">Status</div>
          </div>
          <div class="info-card">
            <div class="info-val">${revisions.length > 0 ? new Date(revisions[revisions.length - 1].createdAt).toLocaleDateString() : 'N/A'}</div>
            <div class="info-lbl">Last Updated</div>
          </div>
        </div>
      </div>

      ${meta?.latestSummary ? `
      <div class="section">
        <h2>Latest Summary</h2>
        <div class="summary-box">${escapeHtml(meta.latestSummary)}</div>
      </div>` : ''}

      ${revisions.length > 1 ? `
      <div class="section">
        <h2>Progress Trend</h2>
        <svg width="300" height="100" style="display:block;">
          <line x1="10" y1="80" x2="290" y2="80" stroke="#e5e7eb" stroke-width="1"/>
          <line x1="10" y1="15" x2="10" y2="80" stroke="#e5e7eb" stroke-width="1"/>
          ${spark}${dots}
        </svg>
      </div>` : ''}

      <div class="section">
        <h2>Revision History (${revisions.length} entries)</h2>
        ${revisions.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Progress</th>
              <th>Summary</th>
              <th>Supervisor Feedback</th>
            </tr>
          </thead>
          <tbody>${revisionRows}</tbody>
        </table>` : '<p style="color:#9ca3af; font-style:italic;">No revision history available for this chapter.</p>'}
      </div>

      <div class="footer">
        <p>This report is auto-generated by ThesisSphere</p>
        <p>© 2026 ThesisSphere. All rights reserved.</p>
      </div>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    if (!w) return alert('Popup blocked. Please allow popups.');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch(e) { console.error(e); } }, 350);
  };

  const downloadSupervisorReport = () => {
    const supervisorActivity = report.supervisorActivity || { meetings: [], feedback: [], actionItems: [] };
    const meetings = supervisorActivity.meetings || [];
    const feedbackList = supervisorActivity.feedback || [];
    const actionItems = supervisorActivity.actionItems || [];
    const now = new Date().toLocaleString();

    const meetingRows = meetings.slice(0, 20).map((m) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: left;"><strong>${escapeHtml(m.supervisor || 'Unknown')}</strong></td>
        <td style="padding: 12px; text-align: left;">${m.date ? new Date(m.date).toLocaleString() : 'No date'}</td>
        <td style="padding: 12px; text-align: left;">${escapeHtml(m.topic || 'General Discussion')}</td>
        <td style="padding: 12px; text-align: left;">${escapeHtml(m.notes || 'No notes')}</td>
        <td style="padding: 12px; text-align: center;">${escapeHtml(m.duration || 'N/A')}</td>
      </tr>
    `).join('');

    const feedbackRows = feedbackList.slice(0, 20).map((fb) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: left;"><strong>${escapeHtml(fb.reportTitle || 'Progress Report')}</strong></td>
        <td style="padding: 12px; text-align: left;">${fb.date ? new Date(fb.date).toLocaleString() : 'No date'}</td>
        <td style="padding: 12px; text-align: center;"><span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${fb.progressPercentage || 0}%</span></td>
        <td style="padding: 12px; text-align: left;">${escapeHtml(fb.feedback || '')}</td>
      </tr>
    `).join('');

    const actionRows = actionItems.slice(0, 20).map((item) => {
      const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[item.priority] || '#6b7280';
      const statusColor = { completed: '#10b981', pending: '#f59e0b', overdue: '#ef4444' }[item.status] || '#6b7280';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: left;"><strong>${escapeHtml(item.title || 'Action Item')}</strong></td>
          <td style="padding: 12px; text-align: left;">${escapeHtml(item.supervisor || 'Unknown')}</td>
          <td style="padding: 12px; text-align: left;">${escapeHtml(item.description || '')}</td>
          <td style="padding: 12px; text-align: center;"><span style="background-color: ${priorityColor}20; color: ${priorityColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${item.priority || 'medium'}</span></td>
          <td style="padding: 12px; text-align: center;"><span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${item.status || 'pending'}</span></td>
          <td style="padding: 12px; text-align: center;">${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Supervisor Activity Log</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 15px; }
        h1 { margin: 0; color: #065f46; font-size: 28px; }
        .meta { color: #6b7280; font-size: 12px; margin-top: 5px; }
        .section { margin-bottom: 25px; }
        h2 { color: #065f46; font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-left: 4px solid #059669; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #d1fae5; color: #065f46; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px; }
        .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .empty { color: #9ca3af; font-style: italic; padding: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Supervisor Activity Log</h1>
        <div class="meta">Generated on: ${now}</div>
      </div>

      <div class="section">
        <h2>📅 Supervisor Meetings (${meetings.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Supervisor</th>
              <th>Date</th>
              <th>Topic</th>
              <th>Notes</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${meetingRows || '<tr><td colspan="5" class="empty">No meetings recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>💬 Supervisor Feedback (${feedbackList.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Date</th>
              <th>Progress</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${feedbackRows || '<tr><td colspan="4" class="empty">No feedback recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>✓ Action Items (${actionItems.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Supervisor</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${actionRows || '<tr><td colspan="6" class="empty">No action items recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This report is auto-generated by ThesisSphere</p>
        <p>© 2026 ThesisSphere. All rights reserved.</p>
      </div>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    if (!w) return alert('Popup blocked. Please allow popups.');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch(e) { console.error(e); } }, 350);
  };

  const downloadFinalReport = () => {
    const pkg = report.thesisPackage || {};
    const now = new Date().toLocaleString();
    
    const checklistRows = Object.entries(pkg.submissionChecklist || {})
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const status = value ? '✓ Complete' : '✗ Pending';
        const color = value ? '#10b981' : '#ef4444';
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; text-align: left;">${label}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="background-color: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${status}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const chapterRows = (pkg.chapterBreakdown || [])
      .map((ch, i) => {
        const progress = Math.min(100, ch.progress || 0);
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; text-align: center;"><strong>Chapter ${ch.chapter}</strong></td>
            <td style="padding: 12px; text-align: left;">${escapeHtml(ch.title)}</td>
            <td style="padding: 12px; text-align: center;">${ch.wordCount} words</td>
            <td style="padding: 12px; text-align: center;">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%; background-color: #10b981;">${progress}%</div>
              </div>
            </td>
            <td style="padding: 12px; text-align: center;">
              <span style="background-color: ${progress >= 95 ? '#d1fae5' : '#fef3c7'}; color: ${progress >= 95 ? '#065f46' : '#92400e'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${ch.status}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const deadlineRows = (pkg.deadlines || [])
      .map(d => {
        const daysColor = d.daysRemaining < 7 ? '#ef4444' : d.daysRemaining < 14 ? '#f59e0b' : '#10b981';
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; text-align: left;"><strong>${escapeHtml(d.title)}</strong></td>
            <td style="padding: 12px; text-align: center;">${new Date(d.date).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: center;">${d.type}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="background-color: ${daysColor}20; color: ${daysColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${d.daysRemaining > 0 ? d.daysRemaining + ' days' : 'Overdue'}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Final Submission Report - Complete Thesis Package</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #065f46; padding-bottom: 15px; }
        h1 { margin: 0; color: #065f46; font-size: 28px; }
        .meta { color: #6b7280; font-size: 12px; margin-top: 5px; }
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        h2 { color: #065f46; font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-left: 4px solid #10b981; padding-left: 10px; }
        .info-block { background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .info-label { font-weight: bold; color: #065f46; }
        .info-value { color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #d1fae5; color: #065f46; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px; }
        .progress-bar { background-color: #e5e7eb; border-radius: 4px; height: 25px; overflow: hidden; }
        .progress-fill { height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; }
        .quality-metric { display: inline-block; margin-right: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 4px; }
        .quality-value { font-size: 24px; font-weight: bold; color: #10b981; }
        .quality-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .submission-badge { 
          display: inline-block; 
          padding: 10px 20px; 
          border-radius: 6px; 
          font-weight: bold; 
          font-size: 14px;
          ${pkg.readyForSubmission ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fef3c7; color: #92400e;'}
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Final Submission Report</h1>
        <h2 style="margin: 10px 0 0 0; font-size: 16px; border: none; padding: 0; color: #6b7280;">Complete Thesis Package</h2>
        <div class="meta">Generated on: ${now}</div>
      </div>

      <!-- Student & Thesis Information -->
      <div class="section">
        <h2>Student & Thesis Information</h2>
        <div class="info-block">
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${escapeHtml(pkg.studentInfo?.name || 'Unknown')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${escapeHtml(pkg.studentInfo?.email || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Department:</span>
            <span class="info-value">${escapeHtml(pkg.studentInfo?.department || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">University:</span>
            <span class="info-value">${escapeHtml(pkg.studentInfo?.university || 'N/A')}</span>
          </div>
        </div>

        <h3 style="color: #1e40af; font-size: 14px; margin-top: 15px;">Group & Supervisor Information</h3>
        <div class="info-block">
          <div class="info-row">
            <span class="info-label">Group Name:</span>
            <span class="info-value">${escapeHtml(pkg.groupInfo?.groupName || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Group Leader:</span>
            <span class="info-value">${escapeHtml(pkg.groupInfo?.leaderId || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Supervisor:</span>
            <span class="info-value">${escapeHtml(pkg.groupInfo?.supervisor || 'Not Assigned')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Thesis Topic:</span>
            <span class="info-value">${escapeHtml(pkg.thesisTopic?.title || 'No Topic')}</span>
          </div>
        </div>
      </div>

      <!-- Submission Readiness -->
      <div class="section">
        <h2>Submission Readiness Status</h2>
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="submission-badge">
            ${pkg.readyForSubmission ? '✓ READY FOR SUBMISSION' : '⏳ NOT YET READY'}
          </div>
        </div>
        
        <h3 style="color: #1e40af; font-size: 14px;">Submission Checklist</h3>
        <table>
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${checklistRows}
          </tbody>
        </table>
      </div>

      <!-- Quality Metrics -->
      <div class="section">
        <h2>Quality Metrics</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
          <div class="quality-metric">
            <div class="quality-value">${pkg.qualityMetrics?.chaptersComplete || 0}/${pkg.qualityMetrics?.totalChapters || 0}</div>
            <div class="quality-label">Chapters Complete</div>
          </div>
          <div class="quality-metric">
            <div class="quality-value">${pkg.qualityMetrics?.completionRate || 0}%</div>
            <div class="quality-label">Overall Completion</div>
          </div>
          <div class="quality-metric">
            <div class="quality-value">${pkg.references?.total || 0}</div>
            <div class="quality-label">References</div>
          </div>
          <div class="quality-metric">
            <div class="quality-value">${pkg.qualityMetrics?.totalCharacters || 0}</div>
            <div class="quality-label">Total Characters</div>
          </div>
        </div>
      </div>

      <!-- Chapter Breakdown -->
      <div class="section">
        <h2>Chapter Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Title</th>
              <th>Word Count</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${chapterRows}
          </tbody>
        </table>
      </div>

      <!-- References Summary -->
      <div class="section">
        <h2>References & Bibliography</h2>
        <div class="info-block">
          <div class="info-row">
            <span class="info-label">Total References:</span>
            <span class="info-value">${pkg.references?.total || 0}</span>
          </div>
          ${Object.entries(pkg.references?.byType || {}).map(([type, count]) => `
            <div class="info-row">
              <span class="info-label">${type}:</span>
              <span class="info-value">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Deadlines -->
      ${pkg.deadlines && pkg.deadlines.length > 0 ? `
      <div class="section">
        <h2>Important Deadlines</h2>
        <table>
          <thead>
            <tr>
              <th>Deadline Title</th>
              <th>Date</th>
              <th>Type</th>
              <th>Time Remaining</th>
            </tr>
          </thead>
          <tbody>
            ${deadlineRows}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Overall Progress: ${pkg.overallProgress || 0}%</strong></p>
        <p>This is an auto-generated thesis package submission report by ThesisSphere</p>
        <p>© 2026 ThesisSphere. All rights reserved.</p>
      </div>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    if (!w) return alert('Popup blocked. Please allow popups.');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch(e) { console.error(e); } }, 350);
  };

  if (loading) return <div className="p-4 text-slate-700">Loading report…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!report) return <div className="p-4 text-slate-700">No report available.</div>;

  const reportTabs = [
    { id: 'monthly', label: 'Monthly Progress Report', icon: BarChart2 },
    { id: 'chapter', label: 'Chapter Summary Report', icon: FileText },
    { id: 'supervisor', label: 'Supervisor Activity Log', icon: User },
    { id: 'final', label: 'Final Submission Report', icon: CheckCircle }
  ];

  return (
    <div className="p-6 text-slate-800" id="automated-report-content">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold">Automated Report Generator</h1>
          <p className="text-sm text-slate-600 mt-2">View personalized reports for your thesis progress</p>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded">
          <div className="text-sm text-blue-800">Select a report type to view your personalized data.</div>
        </div>

        {/* Date Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            className="px-4 py-2 text-sm bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Clear
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-300 flex gap-2 overflow-x-auto">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Monthly Progress Report Tab */}
        {activeTab === 'monthly' && (() => {
          const chapters = report.chapters || [];
          const meetings = report.supervisorActivity?.meetings || [];
          const actionItems = report.supervisorActivity?.actionItems || [];
          const deadlines = report.thesisPackage?.deadlines || [];
          const milestones = [...actionItems, ...deadlines];

          const totalChapters = chapters.length;
          const completedChapters = chapters.filter(c => (c.avgProgress || 0) >= 95).length;
          const overallAvg = totalChapters > 0
            ? Math.round(chapters.reduce((s, c) => s + (c.avgProgress || 0), 0) / totalChapters)
            : 0;
          const pendingItems = actionItems.filter(a => a.status === 'pending').length;

          return (
          <div className="space-y-4 mb-6">

            {/* Header */}
            <div className="bg-white border rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart2 className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-slate-800">Monthly Progress Report</h3>
                  </div>
                  <p className="text-xs text-slate-500">Auto-filled from chapter completion, meetings &amp; milestones</p>
                </div>
                <button
                  onClick={downloadMonthlyReport}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-semibold"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                {[
                  { val: `${overallAvg}%`, lbl: 'Overall Completion', color: '#d97706', bg: '#fffbeb' },
                  { val: `${completedChapters}/${totalChapters}`, lbl: 'Chapters Done', color: '#3b82f6', bg: '#eff6ff' },
                  { val: meetings.length, lbl: 'Meetings Held', color: '#10b981', bg: '#f0fdf4' },
                  { val: pendingItems, lbl: 'Pending Items', color: '#ef4444', bg: '#fef2f2' },
                ].map(({ val, lbl, color, bg }, i) => (
                  <div key={i} className="rounded-lg p-4 text-center border" style={{ backgroundColor: bg }}>
                    <div className="text-2xl font-bold" style={{ color }}>{val}</div>
                    <div className="text-xs text-slate-500 mt-1">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter Completion */}
            <div className="bg-white border rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">📚</span> Chapter Completion
                <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{totalChapters} chapters</span>
              </h4>
              {chapters.length > 0 ? (
                <div className="space-y-3">
                  {chapters.map((ch, i) => {
                    const p = Math.min(100, ch.avgProgress || 0);
                    const color = p >= 95 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444';
                    const label = p >= 95 ? 'Completed' : p >= 50 ? 'In Progress' : 'Early Stage';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 truncate">{ch.title}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs font-bold" style={{ color }}>{p}%</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>{label}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No chapter data available.</p>
              )}
            </div>

            {/* Meetings */}
            <div className="bg-white border rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-green-600">📅</span> Meetings This Period
                <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{meetings.length} meetings</span>
              </h4>
              {meetings.length > 0 ? (
                <div className="space-y-3">
                  {meetings.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex-shrink-0 text-center min-w-[52px]">
                        <div className="text-xs font-bold text-green-700">
                          {m.date ? new Date(m.date).toLocaleDateString('en', { month: 'short' }) : '—'}
                        </div>
                        <div className="text-lg font-bold text-green-800">
                          {m.date ? new Date(m.date).getDate() : '—'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">{m.topic || 'General Discussion'}</p>
                          {m.duration && m.duration !== 'N/A' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex-shrink-0">{m.duration}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">with {m.supervisor || 'Supervisor'}</p>
                        {m.notes && m.notes !== 'No notes recorded' && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.notes.slice(0, 120)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No meetings recorded for this period.</p>
              )}
            </div>

            {/* Milestones & Action Items */}
            <div className="bg-white border rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-amber-600">🎯</span> Milestones &amp; Action Items
                <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{milestones.length} items</span>
              </h4>
              {milestones.length > 0 ? (
                <div className="space-y-2">
                  {milestones.slice(0, 10).map((item, i) => {
                    const isDeadline = item.daysRemaining !== undefined;
                    const statusLabel = isDeadline
                      ? (item.daysRemaining > 0 ? `${item.daysRemaining}d left` : 'Overdue')
                      : (item.status || 'pending');
                    const color = isDeadline
                      ? (item.daysRemaining < 7 ? '#ef4444' : item.daysRemaining < 14 ? '#f59e0b' : '#10b981')
                      : ({ completed: '#10b981', pending: '#f59e0b', overdue: '#ef4444' }[item.status] || '#6b7280');
                    return (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{item.title || 'Milestone'}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description.slice(0, 80)}</p>
                          )}
                          {(item.dueDate || item.date) && (
                            <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(item.dueDate || item.date).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {item.priority && (
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">{item.priority}</span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: `${color}20`, color }}>{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No milestones or action items recorded.</p>
              )}
            </div>

          </div>
          );
        })()}

        {/* Chapter Summary Report Tab */}
        {activeTab === 'chapter' && (
        <div className="mb-6">
          {report.chapters && report.chapters.length > 0 ? (
            <div className="flex gap-4">

              {/* Chapter Selector Sidebar */}
              <div className="w-56 flex-shrink-0">
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-4 py-3">
                    <p className="text-white text-sm font-semibold">Chapters</p>
                    <p className="text-blue-200 text-xs mt-0.5">{report.chapters.length} available</p>
                  </div>
                  <div className="divide-y">
                    {report.chapters.map((ch, i) => {
                      const isActive = selectedChapter === ch.title;
                      const pct = Math.min(100, ch.avgProgress || 0);
                      const color = pct >= 95 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedChapter(ch.title)}
                          className={`w-full text-left px-4 py-3 transition ${
                            isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                            {ch.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chapter Detail Panel */}
              <div className="flex-1 min-w-0">
                {selectedChapterMeta ? (
                  <div className="space-y-4">

                    {/* Header */}
                    <div className="bg-white border rounded-lg shadow-sm p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <h3 className="text-lg font-bold text-slate-800 truncate">{selectedChapterMeta.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500">
                            {chapterRevisions.length} revision{chapterRevisions.length !== 1 ? 's' : ''} recorded
                            {chapterRevisions.length > 0 && ` · Last updated ${new Date(chapterRevisions[chapterRevisions.length - 1].createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={downloadChapterReport}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex-shrink-0 ml-3"
                        >
                          <DownloadCloud className="w-4 h-4" />
                          Download PDF
                        </button>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[[
                          `${Math.min(100, selectedChapterMeta.avgProgress || 0)}%`,
                          'Overall Progress',
                          (() => { const p = selectedChapterMeta.avgProgress || 0; return p >= 95 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'; })()
                        ], [
                          chapterRevisions.length,
                          'Revisions',
                          '#3b82f6'
                        ], [
                          (() => { const p = selectedChapterMeta.avgProgress || 0; return p >= 95 ? 'Completed' : p >= 50 ? 'In Progress' : 'Early Stage'; })(),
                          'Status',
                          (() => { const p = selectedChapterMeta.avgProgress || 0; return p >= 95 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'; })()
                        ]].map(([val, lbl, clr], i) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-3 text-center border">
                            <div className="text-xl font-bold" style={{ color: clr }}>{val}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.min(100, selectedChapterMeta.avgProgress || 0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, selectedChapterMeta.avgProgress || 0)}%`,
                              backgroundColor: (() => { const p = selectedChapterMeta.avgProgress || 0; return p >= 95 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'; })()
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Latest Summary */}
                    {selectedChapterMeta.latestSummary && (
                      <div className="bg-white border rounded-lg shadow-sm p-5">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <span className="text-blue-600">📄</span> Latest Summary
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border-l-4 border-blue-200 pl-4 bg-blue-50 py-3 rounded-r">
                          {selectedChapterMeta.latestSummary}
                        </p>
                      </div>
                    )}

                    {/* Revision History */}
                    <div className="bg-white border rounded-lg shadow-sm p-5">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-purple-600">🕐</span>
                        Revision History
                        <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {chapterRevisions.length} entries
                        </span>
                      </h4>
                      {chapterRevisions.length > 0 ? (
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                          <div className="space-y-4">
                            {chapterRevisions.map((r, i) => {
                              const rPct = Math.min(100, Number(r.progressPercentage) || 0);
                              const rColor = rPct >= 95 ? '#10b981' : rPct >= 50 ? '#f59e0b' : '#ef4444';
                              const isLatest = i === chapterRevisions.length - 1;
                              return (
                                <div key={i} className="flex gap-4 pl-2">
                                  {/* Dot */}
                                  <div className={`relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
                                    isLatest ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                  }`} />
                                  {/* Card */}
                                  <div className={`flex-1 border rounded-lg p-3 mb-1 transition ${
                                    isLatest ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-500">
                                          Revision #{i + 1}
                                        </span>
                                        {isLatest && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Latest</span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold" style={{ color: rColor }}>{rPct}%</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-1.5 mb-2 border">
                                      <div className="h-1.5 rounded-full" style={{ width: `${rPct}%`, backgroundColor: rColor }} />
                                    </div>
                                    {(r.summary || r.notes) && (
                                      <p className="text-xs text-slate-700 leading-relaxed mb-2">
                                        {(r.summary || r.notes || '').slice(0, 300)}
                                        {(r.summary || r.notes || '').length > 300 ? '…' : ''}
                                      </p>
                                    )}
                                    {r.supervisorFeedback && (
                                      <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                                        <span className="font-semibold text-amber-700">Supervisor Feedback: </span>
                                        <span className="text-amber-800">{r.supervisorFeedback.slice(0, 200)}</span>
                                      </div>
                                    )}
                                    <p className="text-xs text-slate-400 mt-2">
                                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Date unknown'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-6">No revision entries recorded for this chapter yet.</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border rounded-lg p-10 text-center text-slate-500">
                    Select a chapter on the left to view its detailed breakdown.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm p-10 text-center text-slate-500">
              No chapter data available yet.
            </div>
          )}
        </div>
        )}

        {/* Supervisor Activity Log Tab */}
        {activeTab === 'supervisor' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Supervisor Activity Log
            </h3>
            <button
              onClick={downloadSupervisorReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
            >
              <DownloadCloud className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {report.supervisorActivity && (report.supervisorActivity.meetings?.length > 0 || report.supervisorActivity.feedback?.length > 0 || report.supervisorActivity.actionItems?.length > 0) ? (
            <div className="space-y-6">
              {/* Meetings Section */}
              {report.supervisorActivity.meetings && report.supervisorActivity.meetings.length > 0 && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-green-600">📅</span> Supervisor Meetings ({report.supervisorActivity.meetings.length})
                  </h4>
                  <div className="space-y-3">
                    {report.supervisorActivity.meetings.slice(0, 10).map((meeting, i) => (
                      <div key={i} className="p-3 border rounded bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-800">{meeting.topic}</p>
                            <p className="text-sm text-slate-600">{meeting.supervisor}</p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {meeting.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{new Date(meeting.date).toLocaleString()}</p>
                        {meeting.notes && meeting.notes !== 'No notes recorded' && (
                          <p className="text-sm text-slate-700 bg-white p-2 rounded border-l-2 border-green-300">
                            {meeting.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              {report.supervisorActivity.feedback && report.supervisorActivity.feedback.length > 0 && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">💬</span> Supervisor Feedback ({report.supervisorActivity.feedback.length})
                  </h4>
                  <div className="space-y-3">
                    {report.supervisorActivity.feedback.slice(0, 10).map((fb, i) => (
                      <div key={i} className="p-3 border rounded bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-800">{fb.reportTitle}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {fb.progressPercentage || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{new Date(fb.date).toLocaleString()}</p>
                        <div className="text-sm text-slate-700 bg-white p-2 rounded border-l-2 border-blue-300">
                          {fb.feedback}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items Section */}
              {report.supervisorActivity.actionItems && report.supervisorActivity.actionItems.length > 0 && (
                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-amber-600">✓</span> Action Items ({report.supervisorActivity.actionItems.length})
                  </h4>
                  <div className="space-y-3">
                    {report.supervisorActivity.actionItems.slice(0, 10).map((item, i) => {
                      const priorityColor = {
                        high: '#ef4444',
                        medium: '#f59e0b',
                        low: '#10b981'
                      }[item.priority] || '#6b7280';
                      const statusColor = {
                        completed: '#10b981',
                        pending: '#f59e0b',
                        overdue: '#ef4444'
                      }[item.status] || '#6b7280';
                      return (
                        <div key={i} className="p-3 border rounded bg-slate-50 hover:bg-slate-100 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-800">{item.title}</p>
                              <p className="text-sm text-slate-600">{item.supervisor}</p>
                            </div>
                            <div className="flex gap-1">
                              <span style={{
                                backgroundColor: `${priorityColor}20`,
                                color: priorityColor,
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {item.priority}
                              </span>
                              <span style={{
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-700 bg-white p-2 rounded border-l-2 border-amber-300 mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Assigned: {new Date(item.createdDate).toLocaleDateString()}</span>
                            {item.dueDate && (
                              <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-6">No supervisor activity recorded yet</p>
          )}
        </div>
        )}

        {/* Final Submission Report Tab */}
        {activeTab === 'final' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Complete Thesis Package
            </h3>
            <button
              onClick={downloadFinalReport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
            >
              <DownloadCloud className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {report.thesisPackage && Object.keys(report.thesisPackage).length > 0 ? (
            <div className="space-y-6">
              {/* Submission Status Badge */}
              <div className="text-center p-4 rounded-lg" style={{
                backgroundColor: report.thesisPackage.readyForSubmission ? '#d1fae5' : '#fef3c7'
              }}>
                <div className="text-lg font-bold" style={{
                  color: report.thesisPackage.readyForSubmission ? '#065f46' : '#92400e'
                }}>
                  {report.thesisPackage.readyForSubmission ? '✓ READY FOR SUBMISSION' : '⏳ NOT YET READY FOR SUBMISSION'}
                </div>
                <div className="text-sm mt-1" style={{
                  color: report.thesisPackage.readyForSubmission ? '#047857' : '#b45309'
                }}>
                  Overall Progress: {report.thesisPackage.overallProgress || 0}%
                </div>
              </div>

              {/* Student Information */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Name</p>
                    <p className="text-slate-800">{report.thesisPackage.studentInfo?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Email</p>
                    <p className="text-slate-800">{report.thesisPackage.studentInfo?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Department</p>
                    <p className="text-slate-800">{report.thesisPackage.studentInfo?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">University</p>
                    <p className="text-slate-800">{report.thesisPackage.studentInfo?.university || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Group & Supervisor Information */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-3">Group & Supervisor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Group Name</p>
                    <p className="text-slate-800">{report.thesisPackage.groupInfo?.groupName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Group Leader</p>
                    <p className="text-slate-800">{report.thesisPackage.groupInfo?.leaderId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Supervisor</p>
                    <p className="text-slate-800">{report.thesisPackage.groupInfo?.supervisor || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Thesis Topic</p>
                    <p className="text-slate-800">{report.thesisPackage.thesisTopic?.title || 'No Topic'}</p>
                  </div>
                </div>
              </div>

              {/* Submission Checklist */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Submission Checklist</h4>
                <div className="space-y-2">
                  {Object.entries(report.thesisPackage.submissionChecklist || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <span style={{
                        backgroundColor: value ? '#d1fae5' : '#fee2e2',
                        color: value ? '#065f46' : '#991b1b',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {value ? '✓ Complete' : '✗ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-4">Quality Metrics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-emerald-600">
                      {report.thesisPackage.qualityMetrics?.chaptersComplete || 0}/{report.thesisPackage.qualityMetrics?.totalChapters || 0}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Chapters Complete</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-emerald-600">
                      {report.thesisPackage.qualityMetrics?.completionRate || 0}%
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Completion Rate</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-emerald-600">
                      {report.thesisPackage.references?.total || 0}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">References</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-emerald-600">
                      {Math.round((report.thesisPackage.qualityMetrics?.totalCharacters || 0) / 1000)}k
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Characters</div>
                  </div>
                </div>
              </div>

              {/* Chapter Breakdown */}
              {report.thesisPackage.chapterBreakdown && report.thesisPackage.chapterBreakdown.length > 0 && (
                <div className="border rounded-lg p-4 overflow-x-auto">
                  <h4 className="font-semibold text-slate-800 mb-3">Chapter Breakdown</h4>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">Chapter</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Title</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Word Count</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Progress</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.thesisPackage.chapterBreakdown.map((ch, i) => {
                        const progress = Math.min(100, ch.progress || 0);
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-medium text-slate-800">Chapter {ch.chapter}</td>
                            <td className="p-3 text-slate-700">{ch.title}</td>
                            <td className="p-3 text-center text-slate-700">{ch.wordCount}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-emerald-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 w-8 text-right">{Math.round(progress)}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span style={{
                                backgroundColor: progress >= 95 ? '#d1fae5' : '#fef3c7',
                                color: progress >= 95 ? '#065f46' : '#92400e',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {ch.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* References by Type */}
              {report.thesisPackage.references?.byType && Object.keys(report.thesisPackage.references.byType).length > 0 && (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-3">References by Citation Type</h4>
                  <div className="space-y-2">
                    {Object.entries(report.thesisPackage.references.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 rounded bg-white">
                        <span className="text-slate-700">{type}</span>
                        <span className="font-semibold text-emerald-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Deadlines */}
              {report.thesisPackage.deadlines && report.thesisPackage.deadlines.length > 0 && (
                <div className="border rounded-lg p-4 overflow-x-auto">
                  <h4 className="font-semibold text-slate-800 mb-3">Important Deadlines</h4>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">Deadline</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Date</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Type</th>
                        <th className="text-center p-3 font-semibold text-slate-700">Time Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.thesisPackage.deadlines.map((d, i) => {
                        const daysRemaining = d.daysRemaining;
                        const daysColor = daysRemaining < 7 ? '#ef4444' : daysRemaining < 14 ? '#f59e0b' : '#10b981';
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-medium text-slate-800">{d.title}</td>
                            <td className="p-3 text-center text-slate-700">{new Date(d.date).toLocaleDateString()}</td>
                            <td className="p-3 text-center text-slate-700 capitalize">{d.type}</td>
                            <td className="p-3 text-center">
                              <span style={{
                                backgroundColor: `${daysColor}20`,
                                color: daysColor,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-6">No thesis package data available. Please ensure you are assigned to a thesis group.</p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
