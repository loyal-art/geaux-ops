export type UserRole           = 'owner' | 'admin' | 'partner' | 'manager' | 'worker' | 'team_member' | 'family_member' | 'viewer'
export type JobStatus          = 'unassigned' | 'in_progress' | 'waiting' | 'ready' | 'queued' | 'blocked' | 'cancelled' | 'completed' | 'archived'
export type JobPriority        = 'urgent' | 'normal' | 'low'
export type JobCategory        = 'business' | 'home' | 'personal' | 'misc'
export type RecurringFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly'
export type ProjectStatus      = 'active' | 'paused' | 'complete'

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
  project_id:        string | null
  category:          JobCategory
  title:             string
  client_name:       string | null
  finish_definition: string | null
  focus:             string | null
  status:            JobStatus
  priority:          JobPriority
  assigned_to:       string | null
  group_id:          string | null
  allowance_total:   number
  due_date:          string | null
  created_by:          string | null
  created_at:          string
  completed_at:        string | null
  archived_at:         string | null
  submitted_via_portal: boolean
  // Joined from job_templates (Supabase may return array or single object)
  job_templates: Array<{ name: string; color: string }> | { name: string; color: string } | null
  // Joined from job_steps
  job_steps: Array<{ id: string; done: boolean; completed_at: string | null }>
  // Optional join for project name (used in dashboard search)
  projects?: { name: string } | null
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

export interface RecurringSchedule {
  id:                 string
  template_id:        string
  frequency:          RecurringFrequency
  group_id:           string | null
  assigned_to:        string | null
  active:             boolean
  last_generated_at:  string | null
  next_generate_at:   string | null
  created_at:         string
  // Joined
  job_templates: { name: string; color: string } | null
  users:         { display_name: string | null } | null
}

export interface Invite {
  id:          string
  email:       string
  role:        UserRole
  invited_by:  string | null
  created_at:  string
  accepted_at: string | null
  // Joined from users (invited_by)
  users?: { display_name: string | null } | null
}

export interface JobComment {
  id:                string
  job_id:            string
  user_id:           string | null
  text:              string
  is_client_visible: boolean
  created_at:        string
  // Joined from users
  users: { display_name: string | null } | null
}

export interface Client {
  id:            string
  name:          string
  contact_name:  string | null
  contact_email: string | null
  contact_phone: string | null
  locations:     unknown[]
  notes:         string | null
  created_by:    string | null
  created_at:    string
  // Joined: projects count + statuses
  projects?: Array<{ id: string; status: ProjectStatus }>
}

export interface Project {
  id:          string
  client_id:   string
  name:        string
  description: string | null
  status:      ProjectStatus
  created_by:  string | null
  created_at:  string
  updated_at:  string
  // Joined
  clients?: { id: string; name: string } | null
  jobs?:    Array<{ id: string; status: JobStatus }>
}

export type GroupType = 'business' | 'household' | 'personal' | 'misc'

export interface Group {
  id:            string
  name:          string
  description:   string | null
  type:          GroupType
  contact_email: string | null
  contact_phone: string | null
  locations:     unknown[]
  notes:         string | null
  created_by:    string | null
  created_at:    string
  // Joined
  group_members?: Array<{ user_id: string; users?: { display_name: string | null; email: string } | null }>
}

export interface GroupMember {
  group_id:      string
  user_id:       string
  role_in_group: string | null
  joined_at:     string
}

export interface Contact {
  id:         string
  group_id:   string
  name:       string
  email:      string | null
  phone:      string | null
  company:    string | null
  notes:      string | null
  created_by: string | null
  created_at: string
}
