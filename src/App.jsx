import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { useProfile } from './hooks/useProfile.js'
import Layout from './components/layout/Layout.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Home from './pages/Home.jsx'
import Issues from './pages/Issues.jsx'
import IssueDetail from './pages/IssueDetail.jsx'
import NewIssue from './pages/NewIssue.jsx'
import Polls from './pages/Polls.jsx'
import PollDetail from './pages/PollDetail.jsx'
import Payments from './pages/Payments.jsx'
import Documents from './pages/Documents.jsx'
import Directory from './pages/Directory.jsx'
import Profile from './pages/Profile.jsx'

function Protected({ children }) {
  const { session, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profile || !profile.society_id || !profile.primary_unit_id) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Home />} />
        <Route path="issues" element={<Issues />} />
        <Route path="issues/new" element={<NewIssue />} />
        <Route path="issues/:id" element={<IssueDetail />} />
        <Route path="polls" element={<Polls />} />
        <Route path="polls/:id" element={<PollDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="documents" element={<Documents />} />
        <Route path="directory" element={<Directory />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
