// frontend/src/app.jsx (updated routes)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authUtils } from './lib/utils';

// Layout
import { DashboardLayout } from './components/layout/Dashboard';

// Authentication
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AuthGuard } from './components/auth/AuthGuard';

// Dashboard
import { Dashboard } from './components/dashboard/Dashboard';

// Companies
import { CompanyList } from './components/companies/CompanyList';
import { CompanyForm } from './components/companies/CompanyForm';
import { CompanyDetail } from './components/companies/CompanyDetail';

// Emails
import { EnhancedEmailGenerator } from './components/emails/EnhancedEmailGenerator';
import { EmailList } from './components/emails/EmailList';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            authUtils.isAuthenticated() ? (
              <Navigate to="/dashboard" />
            ) : (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoginForm />
              </div>
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            authUtils.isAuthenticated() ? (
              <Navigate to="/dashboard" />
            ) : (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <RegisterForm />
              </div>
            )
          } 
        />
        
        {/* Protected routes with AuthGuard */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Company routes */}
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/new" element={<CompanyForm />} />
          <Route path="companies/:id/edit" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="companies/:id/generate" element={<EnhancedEmailGenerator />} />
          
          {/* Email routes */}
          <Route path="emails" element={<EmailList />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}