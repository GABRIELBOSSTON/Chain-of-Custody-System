import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Activation from './pages/Activation';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import UserForm from './pages/UserForm';
import CasesList from './pages/CasesList';
import CaseForm from './pages/CaseForm';
import EvidencesList from './pages/EvidencesList';
import EvidenceForm from './pages/EvidenceForm';
import EvidenceDetail from './pages/EvidenceDetail';
import CustodyEventForm from './pages/CustodyEventForm';
import AuditLogsList from './pages/AuditLogsList';
import Reports from './pages/Reports';
import QrRedirect from './pages/QrRedirect';
import QrScanner from './pages/QrScanner';
import ExternalTransferForm from './pages/ExternalTransferForm';
import CourtPresentationForm from './pages/CourtPresentationForm';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activation" element={<Activation />} />
        
        {/* Protected Routes with Layout */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/edit/:id" element={<UserForm />} />
            <Route path="/cases" element={<CasesList />} />
            <Route path="/cases/new" element={<CaseForm />} />
            <Route path="/cases/edit/:id" element={<CaseForm />} />
            <Route path="/evidences" element={<EvidencesList />} />
            <Route path="/evidences/new" element={<EvidenceForm />} />
            <Route path="/evidences/edit/:id" element={<EvidenceForm />} />
            <Route path="/evidences/:id/detail" element={<EvidenceDetail />} />
            <Route path="/evidences/:id/custody/new" element={<CustodyEventForm />} />
            <Route path="/evidences/:id/custody/external" element={<ExternalTransferForm />} />
            <Route path="/evidences/:id/court/new" element={<CourtPresentationForm />} />
            <Route path="/audit-logs" element={<AuditLogsList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/qr-redirect" element={<QrRedirect />} />
            <Route path="/scan" element={<QrScanner />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
