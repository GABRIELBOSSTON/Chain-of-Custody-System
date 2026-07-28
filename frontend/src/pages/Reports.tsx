import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

type ReportType = 'cases' | 'evidence' | 'custody-events' | 'audit-logs';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('cases');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [caseId, setCaseId] = useState('');
  const [evidenceId, setEvidenceId] = useState('');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (caseId && (reportType === 'evidence' || reportType === 'custody-events')) {
        params.append('caseId', caseId);
      }
      if (evidenceId && reportType === 'custody-events') {
        params.append('evidenceId', evidenceId);
      }

      const res = await api.get(`/reports/${reportType}?${params.toString()}`);
      setData(res.data);
      setGenerated(true);
    } catch (err: any) {
      setError('Failed to generate report data.');
    } finally {
      setLoading(false);
    }
  };

  const getColumns = () => {
    switch(reportType) {
      case 'cases':
        return ['Case Number', 'Title', 'Status', 'Date'];
      case 'evidence':
        return ['Evidence Number', 'Title', 'Category', 'Status', 'Date', 'Hash Verification Status'];
      case 'custody-events':
        return ['Event Time', 'Action', 'From Person', 'To Person', 'Notes'];
      case 'audit-logs':
        return ['Date', 'Module', 'Action', 'Description'];
      default:
        return [];
    }
  };

  const getRows = () => {
    return data.map(item => {
      switch(reportType) {
        case 'cases':
          return [item.caseNumber, item.title, item.status, new Date(item.createdAt).toLocaleDateString()];
        case 'evidence':
          return [item.evidenceNumber, item.title, item.category, item.status, new Date(item.collectionDate).toLocaleDateString(), item.hashVerificationStatus || 'N/A'];
        case 'custody-events':
          return [new Date(item.eventTime).toLocaleString(), item.action, item.fromPerson, item.toPerson, item.notes || '-'];
        case 'audit-logs':
          return [new Date(item.timestamp).toLocaleString(), item.entityType || 'System', item.action, item.description || '-'];
        default:
          return [];
      }
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `System Report: ${reportType.replace('-', ' ').toUpperCase()}`;
    const generationDate = `Generated on: ${new Date().toLocaleString()}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(generationDate, 14, 30);

    const headers = [getColumns()];
    const rows = getRows();

    autoTable(doc, {
      startY: 40,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      didDrawPage: (dataArg) => {
        // Footer
        doc.setFontSize(10);
        doc.text(`Page ${dataArg.pageNumber}`, dataArg.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`${reportType}-report-${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    const headers = getColumns();
    const rows = getRows();

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}-report-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '1000px', width: '100%' }}>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>System Reports</h1>

        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label className="input-label">Report Type</label>
            <select className="input-field" value={reportType} onChange={(e) => { setReportType(e.target.value as ReportType); setGenerated(false); }}>
              <option value="cases">Cases</option>
              <option value="evidence">Evidence</option>
              <option value="custody-events">Chain of Custody</option>
              <option value="audit-logs">Audit Logs</option>
            </select>
          </div>
          <div></div>

          <div>
            <label className="input-label">Start Date (Optional)</label>
            <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="input-label">End Date (Optional)</label>
            <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {(reportType === 'evidence' || reportType === 'custody-events') && (
            <div>
              <label className="input-label">Case ID (Optional)</label>
              <input type="text" className="input-field" placeholder="Filter by Case UUID" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
            </div>
          )}

          {reportType === 'custody-events' && (
            <div>
              <label className="input-label">Evidence ID (Optional)</label>
              <input type="text" className="input-field" placeholder="Filter by Evidence UUID" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} />
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {generated && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Report Preview ({data.length} records)</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={exportCSV} className="btn-primary" style={{ background: 'var(--accent-color)' }} disabled={data.length === 0}>
                  Export CSV
                </button>
                <button onClick={exportPDF} className="btn-primary" disabled={data.length === 0}>
                  Export PDF
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {getColumns().map(col => (
                      <th key={col} style={{ padding: '0.75rem', textAlign: 'left', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    getRows().map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '0.75rem' }}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={getColumns().length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No records found for the given criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
