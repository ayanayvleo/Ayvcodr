// Types for privacy & compliance frontend API
export interface ConsentUpdateRequest {
  data_processing_consent?: boolean
  marketing_consent?: boolean
  analytics_consent?: boolean
  cookie_consent?: boolean
}

export interface AuditLogEntry {
  id: string
  action: string
  timestamp: string
  status: string
  details: string
}
