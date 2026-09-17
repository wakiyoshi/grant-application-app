import { useRef, useState } from 'react'
import { api, authHeaders, errorMessage, type Role } from '../api/client'
import type { ApplicationDocument } from '../types/application'

interface Props {
  applicationId: number
  documents: ApplicationDocument[]
  role: Role
  editable?: boolean
  onChange?: (documents: ApplicationDocument[]) => void
}

export function DocumentsCard({ applicationId, documents, role, editable = false, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const basePath = role === 'reviewer' ? `/reviewer/applications/${applicationId}` : `/applications/${applicationId}`

  async function upload() {
    if (!files.length) return
    setBusy(true); setError('')
    const form = new FormData()
    files.forEach((file) => form.append('documents[]', file))
    try {
      const { data } = await api.post<ApplicationDocument[]>(`${basePath}/documents`, form, { headers: authHeaders(role) })
      onChange?.([...documents, ...data])
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) { setError(errorMessage(e)) }
    finally { setBusy(false) }
  }

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

  async function remove(documentId: number) {
    if (!confirm('この書類を削除しますか？')) return
    setError('')
    try {
      await api.delete(`${basePath}/documents/${documentId}`, { headers: authHeaders(role) })
      onChange?.(documents.filter((document) => document.id !== documentId))
    } catch (e) { setError(errorMessage(e)) }
  }

  return <div className="card documents-card">
    <h2>申請書類</h2>
    {error && <div className="alert error pre-wrap">{error}</div>}
    {documents.length ? <ul className="document-list">{documents.map((document) => <li key={document.id}>
      <div><strong>{document.original_name}</strong><small>{(document.size / 1024 / 1024).toFixed(2)} MB</small></div>
      <div className="document-actions"><button className="button secondary" onClick={() => download(document)}>ダウンロード</button>{editable && <button className="button danger" onClick={() => remove(document.id)}>削除</button>}</div>
    </li>)}</ul> : <p className="empty compact">添付書類はありません。</p>}
    {editable && <div className="upload-box">
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
      <p>PDF・JPEG・PNG・WebP、1ファイル10MBまで、最大5ファイル</p>
      <button className="button primary" disabled={!files.length || busy} onClick={upload}>{busy ? 'アップロード中…' : 'アップロード'}</button>
    </div>}
  </div>
}
