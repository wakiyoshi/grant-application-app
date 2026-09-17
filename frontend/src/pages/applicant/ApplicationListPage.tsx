import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, authHeaders, errorMessage } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'
import type { GrantApplication } from '../../types/application'

export function ApplicationListPage() {
  const [items, setItems] = useState<GrantApplication[]>([])
  const [error, setError] = useState('')
  useEffect(() => { api.get('/applications', { headers: authHeaders('applicant') }).then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e))) }, [])
  return <>
    <div className="page-title"><div><h1>申請一覧</h1><p>作成した補助金申請を確認できます。</p></div><Link className="button primary" to="/applications/new">新規申請</Link></div>
    {error && <div className="alert error">{error}</div>}
    <div className="card table-wrap"><table><thead><tr><th>申請番号</th><th>医療機関名</th><th>申請金額</th><th>ステータス</th><th>更新日</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}><td><Link to={`/applications/${item.id}`}>#{item.id}</Link></td><td>{item.medical_institution_name}</td><td>{item.amount.toLocaleString()} 円</td><td><StatusBadge status={item.status} /></td><td>{new Date(item.updated_at).toLocaleDateString('ja-JP')}</td></tr>)}</tbody></table>
      {!items.length && !error && <p className="empty">申請はまだありません。</p>}
    </div>
  </>
}
