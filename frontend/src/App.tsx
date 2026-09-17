import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ApplicantLoginPage } from './pages/applicant/ApplicantLoginPage'
import { ApplicationListPage } from './pages/applicant/ApplicationListPage'
import { ApplicationDetailPage } from './pages/applicant/ApplicationDetailPage'
import { ApplicationFormPage } from './pages/applicant/ApplicationFormPage'
import { ReviewerLoginPage } from './pages/reviewer/ReviewerLoginPage'
import { ReviewListPage } from './pages/reviewer/ReviewListPage'
import { ReviewDetailPage } from './pages/reviewer/ReviewDetailPage'

export default function App() {
  return <Routes>
    <Route path="/login" element={<ApplicantLoginPage />} />
    <Route path="/reviewer/login" element={<ReviewerLoginPage />} />
    <Route element={<ProtectedRoute role="applicant" />}>
      <Route element={<AppLayout role="applicant" />}>
        <Route path="/applications" element={<ApplicationListPage />} />
        <Route path="/applications/new" element={<ApplicationFormPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute role="reviewer" />}>
      <Route element={<AppLayout role="reviewer" />}>
        <Route path="/reviewer/applications" element={<ReviewListPage />} />
        <Route path="/reviewer/applications/:id" element={<ReviewDetailPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
