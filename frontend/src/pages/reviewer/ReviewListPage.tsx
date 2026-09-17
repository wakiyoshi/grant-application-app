import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, authHeaders, errorMessage } from '../../api/client'
import { StatusBadge } from '../../components/StatusBadge'
import type { GrantApplication } from '../../types/application'

export function ReviewListPage() {
  const [items, setItems] = useState<GrantApplication[]>([]); const [error, setError] = useState('')
  useEffect(() => { api.get('/reviewer/applications', { headers: authHeaders('reviewer') }).then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e))) }, [])
  return <><div className="page-title"><div><h1>審査一覧</h1><p>提出された申請を確認・審査します。</p></div></div>
    {error && <div className="alert error">{error}</div>}<div className="card table-wrap"><table><thead><tr><th>申請番号</th><th>法人名</th><th>医療機関名</th><th>申請金額</th><th>ステータス</th><th>提出日</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}><td><Link to={`/reviewer/applications/${item.id}`}>#{item.id}</Link></td><td>{item.corporation_name}</td><td>{item.medical_institution_name}</td><td>{item.amount.toLocaleString()} 円</td><td><StatusBadge status={item.status} /></td><td>{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('ja-JP') : '-'}</td></tr>)}</tbody></table>
      {!items.length && !error && <p className="empty">審査対象の申請はありません。</p>}</div></>
}
