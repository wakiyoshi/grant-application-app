import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage, setToken } from '../../api/client'
import { LoginForm } from '../../components/LoginForm'

export function ReviewerLoginPage() {
  const navigate = useNavigate(); const [error, setError] = useState('')
  async function login(email: string, password: string) {
    setError('')
    try { const { data } = await api.post('/reviewer/login', { email, password }); setToken('reviewer', data.token); navigate('/reviewer/applications') }
    catch (e) { setError(errorMessage(e)) }
  }
  return <><LoginForm title="審査担当者ログイン" onSubmit={login} error={error} /><p className="login-link"><Link to="/login">申請者はこちら</Link></p></>
}
