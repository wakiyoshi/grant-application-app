import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, authHeaders, errorMessage } from '../../api/client'
import type { ApplicationInput } from '../../types/application'

const emptyForm: ApplicationInput = { corporation_name: '', corporation_number: '', medical_institution_name: '', contact_name: '', email: '', amount: 0, description: '' }

export function ApplicationFormPage() {
  const { id } = useParams(); const editing = Boolean(id); const navigate = useNavigate()
  const [form, setForm] = useState<ApplicationInput>(emptyForm); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { if (id) api.get(`/applications/${id}`, { headers: authHeaders('applicant') }).then(({ data }) => setForm(data)).catch((e) => setError(errorMessage(e))) }, [id])
  function field(name: keyof ApplicationInput, value: string) { setForm((current) => ({ ...current, [name]: name === 'amount' ? Number(value) : value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { const response = editing ? await api.put(`/applications/${id}`, form, { headers: authHeaders('applicant') }) : await api.post('/applications', form, { headers: authHeaders('applicant') }); navigate(`/applications/${response.data.id}`) }
    catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  return <><div className="page-title"><div><h1>{editing ? '申請を編集' : '新規申請'}</h1><p>すべての項目を入力してください。</p></div></div>
    {error && <div className="alert error pre-wrap">{error}</div>}
    <form className="card form-grid" onSubmit={submit}>
      <label>法人名<input value={form.corporation_name} onChange={(e) => field('corporation_name', e.target.value)} maxLength={255} required /></label>
      <label>法人番号<input value={form.corporation_number} onChange={(e) => field('corporation_number', e.target.value)} pattern="[0-9]{13}" title="13桁の数字" required /></label>
      <label>医療機関名<input value={form.medical_institution_name} onChange={(e) => field('medical_institution_name', e.target.value)} required /></label>
      <label>担当者名<input value={form.contact_name} onChange={(e) => field('contact_name', e.target.value)} required /></label>
      <label>メールアドレス<input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} required /></label>
      <label>申請金額（円）<input type="number" min="1" value={form.amount || ''} onChange={(e) => field('amount', e.target.value)} required /></label>
      <label className="full">申請内容<textarea rows={8} value={form.description} onChange={(e) => field('description', e.target.value)} maxLength={10000} required /></label>
      <div className="form-actions full"><Link className="button secondary" to={editing ? `/applications/${id}` : '/applications'}>キャンセル</Link><button className="button primary" disabled={busy}>{busy ? '保存中…' : '保存'}</button></div>
    </form>
  </>
}
