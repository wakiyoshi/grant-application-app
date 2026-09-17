import { Link, Outlet, useNavigate } from 'react-router-dom'
import { api, authHeaders, clearToken, type Role } from '../api/client'

export function AppLayout({ role }: { role: Role }) {
  const navigate = useNavigate()
  const reviewer = role === 'reviewer'
  async function logout() {
    try { await api.post(reviewer ? '/reviewer/logout' : '/logout', undefined, { headers: authHeaders(role) }) }
    finally { clearToken(role); navigate(reviewer ? '/reviewer/login' : '/login') }
  }
  return <>
    <header className="app-header">
      <Link to={reviewer ? '/reviewer/applications' : '/applications'} className="brand">医療法人 補助金申請システム</Link>
      <div className="header-actions"><span>{reviewer ? '審査担当者' : '申請者'}</span><button className="button secondary" onClick={logout}>ログアウト</button></div>
    </header>
    <main className="container"><Outlet /></main>
  </>
}
