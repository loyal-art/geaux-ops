export type UserRole     = 'owner' | 'partner' | 'team_member' | 'family_member'
export type JobStatus    = 'unassigned' | 'in_progress' | 'blocked' | 'cancelled' | 'completed' | 'archived'
export type JobPriority  = 'urgent' | 'normal' | 'low'

export interface Profile {
  id:           string
  email:        string
  display_name: string | null
  role:         UserRole
  avatar_url:   string | null
}

export interface TemplateStep {
  text:             string
  sort_order:       number
  is_high_impact:   boolean
  allowance_amount: number
}

export interface JobTemplate {
  id:            string
  name:          string
  color:         string
  category:      'business' | 'household' | 'custom'
  default_steps: TemplateStep[]
  created_at:    string
}

export interface Job {
  id:                string
  template_id:       string | null
  title:             string
  client_name:       string | null
  finish_definition: string | null
  status:            JobStatus
  priority:          JobPriority
  assigned_to:       string | null
  group_id:          string | null
  allowance_total:   number
  due_date:          string | null
  created_by:        string | null
  created_at:        string
  completed_at:      string | null
  archived_at:       string | null
  // Joined from job_templates (Supabase may return array or single object)
  job_templates: Array<{ name: string; color: string }> | { name: string; color: string } | null
  // Joined from job_steps
  job_steps: Array<{ id: string; done: boolean }>
}

export interface JobStep {
  id:               string
  job_id:           string
  text:             string
  done:             boolean
  is_high_impact:   boolean
  completed_by:     string | null
  completed_at:     string | null
  allowance_amount: number
  sort_order:       number
  created_at:       string
}

export interface JobComment {
  id:         string
  job_id:     string
  user_id:    string | null
  text:       string
  created_at: string
  // Joined from users
  users: { display_name: string | null } | null
}
