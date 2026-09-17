export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RETURNED'

export interface ApplicationDocument {
  id: number
  application_id: number
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

export interface GrantApplication {
  id: number
  applicant_id: number
  corporation_name: string
  corporation_number: string
  medical_institution_name: string
  contact_name: string
  email: string
  amount: number
  description: string
  status: ApplicationStatus
  reviewer_id: number | null
  review_comment: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  documents: ApplicationDocument[]
}

export type ApplicationInput = Pick<GrantApplication, 'corporation_name' | 'corporation_number' | 'medical_institution_name' | 'contact_name' | 'email' | 'amount' | 'description'>

export const statusLabels: Record<ApplicationStatus, string> = {
  DRAFT: '下書き', SUBMITTED: '提出済み', UNDER_REVIEW: '審査中', APPROVED: '承認', RETURNED: '差戻し',
}
