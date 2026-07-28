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
        return ['Date', 'Module', 'Action', 'Previous Hash', 'Current Hash', 'Description'];
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
          return [new Date(item.timestamp).toLocaleString(), item.entityType || 'System', item.action, item.previousHash || '-', item.newHash || '-', item.description || '-'];
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
      headStyles: { fillColor: [59, 130, 246] },
      didDrawPage: (dataArg) => {
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
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">System Reports</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
        <form onSubmit={handleGenerate}>
          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Report Type</label>
              <select className="input-field" value={reportType} onChange={(e) => { setReportType(e.target.value as ReportType); setGenerated(false); }}>
                <option value="cases">Cases</option>
                <option value="evidence">Evidence</option>
                <option value="custody-events">Chain of Custody</option>
                <option value="audit-logs">Audit Logs</option>
              </select>
            </div>
            <div />
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Start Date (Optional)</label>
              <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">End Date (Optional)</label>
              <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {(reportType === 'evidence' || reportType === 'custody-events') && (
            <div className="form-group">
              <label className="input-label">Case ID (Optional)</label>
              <input type="text" className="input-field" placeholder="Filter by Case UUID" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
            </div>
          )}

          {reportType === 'custody-events' && (
            <div className="form-group">
              <label className="input-label">Evidence ID (Optional)</label>
              <input type="text" className="input-field" placeholder="Filter by Evidence UUID" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} />
            </div>
          )}

          <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {generated && (
        <div className="glass-panel animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <h3 className="font-semibold text-lg">
              Report Preview <span className="text-secondary text-sm font-medium">({data.length} records)</span>
            </h3>
            <div className="btn-group">
              <button onClick={exportCSV} className="btn-primary btn-sm" disabled={data.length === 0}>
                Export CSV
              </button>
              <button onClick={exportPDF} className="btn-secondary btn-sm" disabled={data.length === 0}>
                Export PDF
              </button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {getColumns().map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  getRows().map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="text-sm">{cell}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={getColumns().length} className="table-empty">
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
  );
}
