import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, authHeaders, errorMessage } from '../../api/client'
import { ApplicationFields } from '../../components/ApplicationFields'
import { StatusBadge } from '../../components/StatusBadge'
import { DocumentsCard } from '../../components/DocumentsCard'
import type { GrantApplication } from '../../types/application'

export function ReviewDetailPage() {
  const { id } = useParams(); const [item, setItem] = useState<GrantApplication>(); const [comment, setComment] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { api.get(`/reviewer/applications/${id}`, { headers: authHeaders('reviewer') }).then(({ data }) => setItem(data)).catch((e) => setError(errorMessage(e))) }, [id])
  async function review(action: 'approve' | 'return') {
    if (action === 'return' && !comment.trim()) { setError('差戻し理由を入力してください。'); return }
    if (!confirm(action === 'approve' ? 'この申請を承認しますか？' : 'この申請を差し戻しますか？')) return
    setBusy(true); setError('')
    try { const { data } = await api.post(`/reviewer/applications/${id}/${action}`, action === 'return' ? { comment } : undefined, { headers: authHeaders('reviewer') }); setItem(data) }
    catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  if (!item) return <div className="alert error">{error || '読み込み中…'}</div>
  const reviewable = item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW'
  return <><div className="page-title"><div><h1>審査詳細 #{item.id}</h1><StatusBadge status={item.status} /></div><Link className="button secondary" to="/reviewer/applications">一覧へ戻る</Link></div>
    {error && <div className="alert error pre-wrap">{error}</div>}<div className="card"><ApplicationFields application={item} /></div>
    <DocumentsCard applicationId={item.id} documents={item.documents ?? []} role="reviewer" />
    {reviewable && <div className="card review-box"><label>差戻し理由<textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="差戻しの場合は必須です" /></label><div className="action-bar"><button className="button danger" disabled={busy} onClick={() => review('return')}>差し戻す</button><button className="button primary" disabled={busy} onClick={() => review('approve')}>承認する</button></div></div>}
  </>
}
