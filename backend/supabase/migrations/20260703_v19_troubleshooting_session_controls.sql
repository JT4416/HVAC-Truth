-- V19 additions: homeowner controls for saved troubleshooting sessions

alter table public.troubleshooting_sessions
  add column if not exists archived_at timestamptz,
  add column if not exists homeowner_label text,
  add column if not exists last_used_in_lead_at timestamptz,
  add column if not exists last_used_in_report_at timestamptz;

create index if not exists troubleshooting_sessions_active_user_created_idx
  on public.troubleshooting_sessions(user_id, created_at desc)
  where archived_at is null;

create index if not exists troubleshooting_sessions_attach_lead_idx
  on public.troubleshooting_sessions(user_id, attach_to_lead_request, created_at desc)
  where archived_at is null;

create index if not exists troubleshooting_sessions_attach_report_idx
  on public.troubleshooting_sessions(user_id, attach_to_contractor_report, created_at desc)
  where archived_at is null;

-- V19 rule:
-- Homeowners control whether a saved troubleshooting session is attached to reports/leads.
-- Archived sessions remain available for audit/history but are hidden from active attachment flows.
