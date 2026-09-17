import { type FormEvent, useState } from 'react'

export function LoginForm({ title, onSubmit, error }: { title: string; onSubmit: (email: string, password: string) => Promise<void>; error: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true)
    try { await onSubmit(email, password) } finally { setBusy(false) }
  }
  return <div className="login-shell"><form className="card login-card" onSubmit={submit}>
    <h1>{title}</h1>
    {error && <div className="alert error">{error}</div>}
    <label>メールアドレス<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
    <label>パスワード<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
    <button className="button primary" disabled={busy}>{busy ? 'ログイン中…' : 'ログイン'}</button>
  </form></div>
}
