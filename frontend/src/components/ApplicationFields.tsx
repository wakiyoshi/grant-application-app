import type { GrantApplication } from '../types/application'
export function ApplicationFields({ application }: { application: GrantApplication }) {
  return <dl className="details">
    <div><dt>法人名</dt><dd>{application.corporation_name}</dd></div><div><dt>法人番号</dt><dd>{application.corporation_number}</dd></div>
    <div><dt>医療機関名</dt><dd>{application.medical_institution_name}</dd></div><div><dt>担当者名</dt><dd>{application.contact_name}</dd></div>
    <div><dt>メールアドレス</dt><dd>{application.email}</dd></div><div><dt>申請金額</dt><dd>{application.amount.toLocaleString()} 円</dd></div>
    <div className="full"><dt>申請内容</dt><dd className="pre-wrap">{application.description}</dd></div>
    {application.review_comment && <div className="full"><dt>審査コメント</dt><dd className="pre-wrap">{application.review_comment}</dd></div>}
  </dl>
}
