import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage, setToken } from '../../api/client'
import { LoginForm } from '../../components/LoginForm'

export function ApplicantLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  async function login(email: string, password: string) {
    setError('')
    try { const { data } = await api.post('/login', { email, password }); setToken('applicant', data.token); navigate('/applications') }
    catch (e) { setError(errorMessage(e)) }
  }
  return <><LoginForm title="申請者ログイン" onSubmit={login} error={error} /><p className="login-link"><Link to="/reviewer/login">審査担当者はこちら</Link></p></>
}
