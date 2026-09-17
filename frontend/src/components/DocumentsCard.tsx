import { useEffect, useState } from 'react'
import { api, authHeaders, errorMessage, type Role } from '../api/client'
import type { ApplicationDocument } from '../types/application'

interface Props {
  applicationId: number
  documents: ApplicationDocument[]
  role: Role
}

function ImagePreview({ path, name, role }: { path: string, name: string, role: Role }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    api.get(path, { headers: authHeaders(role), responseType: 'blob' }).then(({ data }) => {
      objectUrl = URL.createObjectURL(data)
      if (active) setUrl(objectUrl)
      else URL.revokeObjectURL(objectUrl)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path, role])

  if (failed) return <div className="document-preview placeholder error-text">プレビューを表示できません</div>
  return url ? <a className="document-preview-link" href={url} target="_blank" rel="noreferrer" title="画像を拡大表示">
    <img className="document-preview" src={url} alt={`${name}のプレビュー`} />
  </a> : <div className="document-preview placeholder">読込中</div>
}

export function DocumentsCard({ applicationId, documents, role }: Props) {
  const [error, setError] = useState('')
  const basePath = role === 'reviewer' ? `/reviewer/applications/${applicationId}` : `/applications/${applicationId}`

  async function download(document: ApplicationDocument) {
    setError('')
    try {
      const { data } = await api.get(`${basePath}/documents/${document.id}`, { headers: authHeaders(role), responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const anchor = window.document.createElement('a')
      anchor.href = url; anchor.download = document.original_name; anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError(errorMessage(e)) }
  }

  return <div className="card documents-card">
    <h2>添付画像・書類</h2>
    {error && <div className="alert error pre-wrap">{error}</div>}
    {documents.length ? <ul className="document-list">{documents.map((document) => <li key={document.id}>
      <div className="document-info">{document.mime_type.startsWith('image/') && <ImagePreview path={`${basePath}/documents/${document.id}`} name={document.original_name} role={role} />}
        <div><strong>{document.original_name}</strong><small>{(document.size / 1024 / 1024).toFixed(2)} MB</small></div>
      </div>
      <div className="document-actions"><button className="button secondary" onClick={() => download(document)}>ダウンロード</button></div>
    </li>)}</ul> : <p className="empty compact">添付画像・書類はありません。</p>}
  </div>
}
