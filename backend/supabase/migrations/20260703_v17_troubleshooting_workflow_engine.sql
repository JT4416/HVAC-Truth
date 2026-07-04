-- V17 additions: homeowner-safe troubleshooting workflow sessions

create table if not exists public.troubleshooting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete set null,
  workflow_id text not null,
  workflow_title text not null,
  symptom text,
  severity text not null check (severity in ('safe-check', 'caution', 'call-pro', 'urgent-stop')),
  answers jsonb not null default '{}'::jsonb,
  result_summary text,
  safe_steps jsonb not null default '[]'::jsonb,
  do_not_do jsonb not null default '[]'::jsonb,
  call_pro_when jsonb not null default '[]'::jsonb,
  homeowner_script text,
  contractor_report_notes jsonb not null default '[]'::jsonb,
  attach_to_contractor_report boolean default true,
  attach_to_lead_request boolean default true,
  created_at timestamptz default now()
);

alter table public.troubleshooting_sessions enable row level security;

create policy "Users can read own troubleshooting sessions" on public.troubleshooting_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create own troubleshooting sessions" on public.troubleshooting_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own troubleshooting sessions" on public.troubleshooting_sessions
  for update using (auth.uid() = user_id);

create index if not exists troubleshooting_sessions_user_created_idx
  on public.troubleshooting_sessions(user_id, created_at desc);

create index if not exists troubleshooting_sessions_system_created_idx
  on public.troubleshooting_sessions(hvac_system_id, created_at desc);

create index if not exists troubleshooting_sessions_workflow_idx
  on public.troubleshooting_sessions(workflow_id, created_at desc);

-- V17 rule:
-- Troubleshooting output may be attached to contractor reports and lead packets,
-- but homeowner instructions must remain limited to safe checks and documentation.
