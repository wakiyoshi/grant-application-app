import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, authHeaders, errorMessage } from '../../api/client'
import { ApplicationFields } from '../../components/ApplicationFields'
import { StatusBadge } from '../../components/StatusBadge'
import { DocumentsCard } from '../../components/DocumentsCard'
import type { GrantApplication } from '../../types/application'

export function ApplicationDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const [item, setItem] = useState<GrantApplication>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { api.get(`/applications/${id}`, { headers: authHeaders('applicant') }).then(({ data }) => setItem(data)).catch((e) => setError(errorMessage(e))) }, [id])
  async function submit() { if (!confirm('この申請を提出しますか？')) return; setBusy(true); try { const { data } = await api.post(`/applications/${id}/submit`, undefined, { headers: authHeaders('applicant') }); setItem(data) } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) } }
  async function remove() { if (!confirm('この申請を削除しますか？')) return; try { await api.delete(`/applications/${id}`, { headers: authHeaders('applicant') }); navigate('/applications') } catch (e) { setError(errorMessage(e)) } }
  if (!item) return <div className="alert error">{error || '読み込み中…'}</div>
  const editable = item.status === 'DRAFT' || item.status === 'RETURNED'
  return <><div className="page-title"><div><h1>申請詳細 #{item.id}</h1><StatusBadge status={item.status} /></div><Link className="button secondary" to="/applications">一覧へ戻る</Link></div>
    {error && <div className="alert error">{error}</div>}<div className="card"><ApplicationFields application={item} /></div>
    <DocumentsCard applicationId={item.id} documents={item.documents ?? []} role="applicant" editable={editable} onChange={(documents) => setItem({ ...item, documents })} />
    {editable && <div className="action-bar"><Link className="button secondary" to={`/applications/${item.id}/edit`}>編集</Link><button className="button danger" onClick={remove}>削除</button><button className="button primary" disabled={busy} onClick={submit}>{busy ? '提出中…' : '申請を提出'}</button></div>}
  </>
}
