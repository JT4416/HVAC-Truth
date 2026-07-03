create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  zip_code text not null,
  created_at timestamptz default now()
);

create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  zip_code text not null,
  home_type text,
  square_feet integer,
  year_built integer,
  created_at timestamptz default now()
);

create table if not exists public.hvac_systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  home_id uuid references public.homes(id) on delete cascade,
  system_type text,
  brand text,
  model_number text,
  serial_number text,
  estimated_age_years integer,
  tonnage numeric,
  refrigerant_type text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.troubleshooting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id),
  symptoms jsonb not null default '{}'::jsonb,
  result_category text,
  recommendation text,
  created_at timestamptz default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id),
  contractor_name text,
  repair_type text not null,
  quoted_amount numeric,
  zip_code text,
  urgency_level text,
  quote_text text,
  fairness_result text,
  red_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text,
  website text,
  zip_code text,
  service_radius_miles integer,
  rating numeric,
  review_count integer,
  license_number text,
  verified boolean default false,
  emergency_service boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.maintenance_tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  summary text not null,
  safe_steps jsonb not null default '[]'::jsonb,
  when_to_call_pro text,
  created_at timestamptz default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  user_question text not null,
  assistant_answer text,
  safety_escalation boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.homes enable row level security;
alter table public.hvac_systems enable row level security;
alter table public.troubleshooting_sessions enable row level security;
alter table public.quotes enable row level security;
alter table public.ai_conversations enable row level security;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage their homes" on public.homes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their systems" on public.hvac_systems for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage troubleshooting" on public.troubleshooting_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage quotes" on public.quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage conversations" on public.ai_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Anyone can read contractors" on public.contractors for select using (true);
create policy "Anyone can read maintenance tips" on public.maintenance_tips for select using (true);

-- V2 additions
alter table public.contractors enable row level security;
alter table public.maintenance_tips enable row level security;

create table if not exists public.contractor_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  contractor_id uuid references public.contractors(id) on delete set null,
  zip_code text not null,
  symptom_summary text,
  urgency_level text,
  lead_status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text not null,
  safety_category text default 'safe-homeowner-maintenance',
  url text,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.contractor_leads enable row level security;
alter table public.app_events enable row level security;
alter table public.affiliate_products enable row level security;

create policy "Users can create their own contractor leads" on public.contractor_leads for insert with check (auth.uid() = user_id);
create policy "Users can read their own contractor leads" on public.contractor_leads for select using (auth.uid() = user_id);
create policy "Users can create their own app events" on public.app_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "Anyone can read active affiliate products" on public.affiliate_products for select using (active = true);

insert into public.maintenance_tips (title, category, summary, safe_steps, when_to_call_pro)
values
('Replace your air filter the right way', 'airflow', 'A clogged filter is one of the most common causes of poor airflow, frozen coils, high bills, and comfort complaints.', '["Turn the system off at the thermostat.", "Remove the old filter.", "Confirm the size printed on the filter frame.", "Install the new filter with the airflow arrow pointing toward the unit.", "Write the date on the filter frame."]'::jsonb, 'Call if airflow remains weak or the system freezes with a clean filter.'),
('Keep the outdoor unit breathing', 'outdoor-unit', 'The outdoor unit needs open airflow to reject heat. Blocked coils and debris can reduce cooling and raise electric use.', '["Turn cooling off.", "Remove leaves and loose debris around the unit.", "Keep plants trimmed back around the cabinet.", "Gently rinse the outside coil from the outside only."]'::jsonb, 'Call if the fan is noisy, not spinning, or the coil is packed with dirt.'),
('Prevent AC drain backups', 'drain', 'Your AC removes humidity from the air. That water must drain safely. Slime, dust, algae, and debris can clog the drain.', '["Look for water near the indoor unit.", "Find the outdoor drain termination if visible.", "Use a wet/dry vacuum at the drain outlet only if accessible and safe.", "Avoid harsh chemicals."]'::jsonb, 'Call if water continues, a float switch shuts the unit off, or damage risk exists.')
on conflict do nothing;

-- V3 additions: secure homeowner system profile photos and data plate extraction readiness
alter table public.hvac_systems
  add column if not exists indoor_model_number text,
  add column if not exists indoor_serial_number text,
  add column if not exists outdoor_model_number text,
  add column if not exists outdoor_serial_number text,
  add column if not exists filter_size text,
  add column if not exists install_date date,
  add column if not exists warranty_notes text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.hvac_system_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete cascade,
  photo_type text not null check (photo_type in ('indoor_data_plate', 'outdoor_data_plate', 'quote_photo', 'equipment_photo', 'other')),
  storage_bucket text not null default 'system-data-plates',
  storage_path text not null,
  mime_type text,
  extracted_text text,
  extraction_status text default 'not_started' check (extraction_status in ('not_started', 'queued', 'completed', 'needs_review', 'failed')),
  created_at timestamptz default now(),
  unique(storage_bucket, storage_path)
);

create table if not exists public.data_plate_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete cascade,
  photo_id uuid references public.hvac_system_photos(id) on delete cascade,
  extracted_brand text,
  extracted_model_number text,
  extracted_serial_number text,
  extracted_refrigerant_type text,
  extracted_tonnage numeric,
  extracted_manufacture_date text,
  confidence_score numeric,
  raw_result jsonb not null default '{}'::jsonb,
  needs_homeowner_review boolean default true,
  created_at timestamptz default now()
);

alter table public.hvac_system_photos enable row level security;
alter table public.data_plate_extractions enable row level security;

create policy "Users can manage their system photos" on public.hvac_system_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their data plate extractions" on public.data_plate_extractions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Run this once in Supabase storage setup:
-- insert into storage.buckets (id, name, public) values ('system-data-plates', 'system-data-plates', false)
-- on conflict (id) do nothing;

-- Storage policies for private homeowner data plate photos.
-- These policies assume object paths start with auth.uid(), e.g. <user_id>/<system_id>/outdoor-123.jpg
create policy "Users can upload their own data plate photos"
  on storage.objects for insert
  with check (
    bucket_id = 'system-data-plates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own data plate photos"
  on storage.objects for select
  using (
    bucket_id = 'system-data-plates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own data plate photos"
  on storage.objects for update
  using (
    bucket_id = 'system-data-plates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own data plate photos"
  on storage.objects for delete
  using (
    bucket_id = 'system-data-plates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- V4 additions: System Age & Size Decoder
create table if not exists public.manufacturer_decoder_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  manufacturer text not null,
  brand_family text,
  aliases jsonb not null default '[]'::jsonb,
  equipment_types jsonb not null default '[]'::jsonb,
  capacity_strategy text,
  capacity_code_regex text,
  age_strategy text,
  serial_regex text,
  confidence_when_matched text not null default 'low' check (confidence_when_matched in ('high', 'medium', 'low', 'unable')),
  verification_status text not null default 'starter_rule_needs_verification' check (verification_status in ('starter_rule_needs_verification', 'verified_internal', 'manufacturer_confirmed')),
  homeowner_explanation text not null,
  notes text,
  source_notes text,
  active boolean default true,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.system_decode_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete set null,
  photo_id uuid references public.hvac_system_photos(id) on delete set null,
  input_brand text,
  input_model_number text,
  input_serial_number text,
  normalized_brand text,
  normalized_model_number text,
  normalized_serial_number text,
  equipment_type text,
  estimated_manufacture_year integer,
  estimated_manufacture_month integer,
  estimated_age_years integer,
  estimated_tonnage numeric,
  estimated_btuh integer,
  refrigerant_type text,
  confidence text not null default 'unable' check (confidence in ('high', 'medium', 'low', 'unable')),
  confidence_reasons jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  matched_rule_keys jsonb not null default '[]'::jsonb,
  raw_result jsonb not null default '{}'::jsonb,
  homeowner_confirmed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.decoder_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  decode_result_id uuid references public.system_decode_results(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('correct', 'incorrect', 'needs_review', 'manufacturer_confirmed', 'contractor_confirmed')),
  corrected_brand text,
  corrected_model_number text,
  corrected_serial_number text,
  corrected_manufacture_year integer,
  corrected_manufacture_month integer,
  corrected_tonnage numeric,
  notes text,
  created_at timestamptz default now()
);

alter table public.manufacturer_decoder_rules enable row level security;
alter table public.system_decode_results enable row level security;
alter table public.decoder_feedback enable row level security;

create policy "Anyone can read active decoder rules" on public.manufacturer_decoder_rules
  for select using (active = true);

create policy "Users can manage their decode results" on public.system_decode_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can create decoder feedback" on public.decoder_feedback
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can read their own decoder feedback" on public.decoder_feedback
  for select using (auth.uid() = user_id);

alter table public.hvac_systems
  add column if not exists decoder_confidence text,
  add column if not exists decoded_manufacture_year integer,
  add column if not exists decoded_manufacture_month integer,
  add column if not exists decoded_size_source text,
  add column if not exists decoded_age_source text;

insert into public.manufacturer_decoder_rules (
  rule_key,
  manufacturer,
  brand_family,
  aliases,
  equipment_types,
  capacity_strategy,
  capacity_code_regex,
  age_strategy,
  serial_regex,
  confidence_when_matched,
  verification_status,
  homeowner_explanation,
  notes,
  source_notes
) values
('goodman-family-common-yy-mm-prefix-001', 'Goodman', 'Goodman / Amana / Daikin residential split systems', '["goodman", "amana", "daikin", "janitrol"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "evaporator_coil", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'year_month_prefix', '^(\\d{2})(0[1-9]|1[0-2])', 'medium', 'starter_rule_needs_verification', 'This looks like a Goodman-family style number. The serial prefix may indicate year and month, and the model may contain a BTUH size code.', 'Starter rule mirrors app seed rule. Verify before production claims.', 'Needs internal/manufacturer verification before high confidence.'),
('carrier-family-capacity-code-001', 'Carrier', 'Carrier / Bryant / Payne / ICP family', '["carrier", "bryant", "payne", "day & night", "heil", "tempstar", "comfortmaker", "arcoaire", "icp"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'none', null, 'low', 'starter_rule_needs_verification', 'This rule can often estimate nominal system size from a common BTUH code, but serial age patterns need brand/era verification.', 'Capacity-only starter rule.', 'Needs internal/manufacturer verification before high confidence.'),
('lennox-family-capacity-code-001', 'Lennox', 'Lennox / Ducane / Armstrong family', '["lennox", "ducane", "concord", "armstrong air", "aire-flo"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'none', null, 'low', 'starter_rule_needs_verification', 'This can estimate size when a standard BTUH code is present, but age should remain unconfirmed until the serial rule is verified.', 'Capacity-only starter rule.', 'Needs internal/manufacturer verification before high confidence.'),
('trane-american-standard-capacity-code-001', 'Trane', 'Trane / American Standard', '["trane", "american standard", "runtru"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'none', null, 'low', 'starter_rule_needs_verification', 'The model may reveal size, but the serial number age code must be checked against the correct Trane/American Standard era.', 'Capacity-only starter rule.', 'Needs internal/manufacturer verification before high confidence.'),
('rheem-ruud-capacity-code-001', 'Rheem', 'Rheem / Ruud', '["rheem", "ruud", "weatherking"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'none', null, 'low', 'starter_rule_needs_verification', 'The app may estimate size from the model, but age should remain a best-effort or unknown until a verified Rheem/Ruud serial rule is loaded.', 'Capacity-only starter rule.', 'Needs internal/manufacturer verification before high confidence.'),
('york-jci-capacity-code-001', 'York', 'York / Coleman / Luxaire / Johnson Controls family', '["york", "coleman", "luxaire", "guardian"]'::jsonb, '["central_ac", "heat_pump", "air_handler", "package_unit", "unknown"]'::jsonb, 'btuh_code_anywhere', '(018|024|030|036|042|048|060)', 'none', null, 'low', 'starter_rule_needs_verification', 'The model can sometimes reveal size, but the age result should be withheld unless a verified York-family date code rule matches.', 'Capacity-only starter rule.', 'Needs internal/manufacturer verification before high confidence.')
on conflict (rule_key) do nothing;

-- V5 additions: authentication persistence support, lookup indexes, and profile photo storage readiness
create index if not exists homes_user_id_idx on public.homes(user_id);
create index if not exists hvac_systems_user_id_idx on public.hvac_systems(user_id);
create index if not exists hvac_system_photos_system_id_idx on public.hvac_system_photos(hvac_system_id);
create index if not exists system_decode_results_user_system_idx on public.system_decode_results(user_id, hvac_system_id);

-- Optional: uncomment when you want one primary home per homeowner in the MVP.
-- create unique index if not exists homes_one_primary_home_per_user_idx on public.homes(user_id);

-- Supabase storage bucket creation. Run in Supabase SQL editor if the bucket was not created in the dashboard.
insert into storage.buckets (id, name, public)
values ('system-data-plates', 'system-data-plates', false)
on conflict (id) do nothing;

-- V6 additions: Data Plate OCR and homeowner confirmation support
alter table public.hvac_system_photos
  add column if not exists ocr_text text,
  add column if not exists ocr_extraction jsonb not null default '{}'::jsonb,
  add column if not exists ocr_status text not null default 'not_requested' check (ocr_status in ('not_requested', 'queued', 'completed', 'needs_review', 'failed')),
  add column if not exists homeowner_confirmed boolean default false;

alter table public.system_decode_results
  add column if not exists raw_ocr_text text,
  add column if not exists ocr_extraction jsonb not null default '{}'::jsonb,
  add column if not exists equipment_side text not null default 'unknown' check (equipment_side in ('indoor', 'outdoor', 'unknown'));

create table if not exists public.ocr_review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete cascade,
  photo_id uuid references public.hvac_system_photos(id) on delete set null,
  original_extraction jsonb not null default '{}'::jsonb,
  confirmed_brand text,
  confirmed_model_number text,
  confirmed_serial_number text,
  confirmed_equipment_type text,
  confirmed_refrigerant_type text,
  created_at timestamptz default now()
);

alter table public.ocr_review_events enable row level security;

create policy "Users can manage their OCR review events" on public.ocr_review_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists hvac_system_photos_ocr_status_idx on public.hvac_system_photos(user_id, ocr_status);
create index if not exists system_decode_results_equipment_side_idx on public.system_decode_results(user_id, equipment_side);

-- V7 additions: contractor-ready report and air handler location pricing context
alter table public.hvac_systems
  add column if not exists air_handler_location text,
  add column if not exists air_handler_location_notes text,
  add column if not exists access_notes text;

create table if not exists public.contractor_system_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  home_id uuid references public.homes(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete cascade,
  report_status text not null default 'draft' check (report_status in ('draft', 'shared', 'archived')),
  zip_code text,
  air_handler_location text,
  air_handler_location_notes text,
  access_notes text,
  report_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contractor_system_reports enable row level security;

create policy "Users can manage their contractor system reports" on public.contractor_system_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists contractor_system_reports_user_id_idx on public.contractor_system_reports(user_id);
create index if not exists contractor_system_reports_hvac_system_id_idx on public.contractor_system_reports(hvac_system_id);
create index if not exists hvac_systems_air_handler_location_idx on public.hvac_systems(air_handler_location);

-- V8 additions: contractor lead request flow with attached system report snapshots
create table if not exists public.contractor_lead_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  hvac_system_id uuid references public.hvac_systems(id) on delete set null,
  zip_code text not null,
  service_type text not null check (service_type in ('no_cooling', 'not_turning_on', 'water_leak', 'noise', 'maintenance', 'quote_second_opinion', 'replacement_estimate', 'other')),
  urgency text not null check (urgency in ('emergency_today', 'within_24_hours', 'this_week', 'planning_ahead')),
  symptom_summary text not null,
  desired_outcome text,
  contact_preference text not null check (contact_preference in ('phone', 'text', 'email', 'app_message')),
  preferred_time_window text,
  homeowner_name text,
  homeowner_phone text,
  homeowner_email text,
  attach_contractor_report boolean default true,
  report_snapshot jsonb not null default '{}'::jsonb,
  selected_contractors jsonb not null default '[]'::jsonb,
  lead_summary text,
  lead_status text not null default 'draft' check (lead_status in ('draft', 'submitted', 'sent', 'accepted', 'declined', 'scheduled', 'closed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contractor_lead_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lead_request_id uuid references public.contractor_lead_requests(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  contractor_name text not null,
  contractor_phone text,
  contractor_email text,
  recipient_status text not null default 'selected' check (recipient_status in ('selected', 'sent', 'viewed', 'responded', 'accepted', 'declined', 'scheduled', 'closed')),
  response_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contractor_lead_requests enable row level security;
alter table public.contractor_lead_recipients enable row level security;

create policy "Users can manage their contractor lead requests" on public.contractor_lead_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their contractor lead recipients" on public.contractor_lead_recipients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists contractor_lead_requests_user_id_idx on public.contractor_lead_requests(user_id);
create index if not exists contractor_lead_requests_system_id_idx on public.contractor_lead_requests(hvac_system_id);
create index if not exists contractor_lead_requests_zip_status_idx on public.contractor_lead_requests(zip_code, lead_status);
create index if not exists contractor_lead_recipients_request_id_idx on public.contractor_lead_recipients(lead_request_id);

-- V9 additions: contractor contact routing and public-contact lead delivery
alter table public.contractors add column if not exists website text;
alter table public.contractors add column if not exists contact_page_url text;
alter table public.contractors add column if not exists published_email text;
alter table public.contractors add column if not exists google_place_id text;
alter table public.contractors add column if not exists google_maps_url text;
alter table public.contractors add column if not exists yelp_business_url text;
alter table public.contractors add column if not exists hvac_truth_verified boolean default false;
alter table public.contractors add column if not exists accepts_dashboard_leads boolean default false;
alter table public.contractors add column if not exists accepts_email_leads boolean default true;
alter table public.contractors add column if not exists accepts_sms_leads boolean default false;
alter table public.contractors add column if not exists discovery_source text;
alter table public.contractors add column if not exists contact_source text;
alter table public.contractors add column if not exists contact_confidence text check (contact_confidence in ('verified', 'published', 'inferred', 'unknown')) default 'unknown';

alter table public.contractor_lead_recipients add column if not exists contractor_website text;
alter table public.contractor_lead_recipients add column if not exists contractor_contact_page_url text;
alter table public.contractor_lead_recipients add column if not exists delivery_method text check (delivery_method in ('verified_dashboard', 'published_email', 'website_contact_form', 'website', 'phone', 'sms', 'google_profile', 'yelp_profile', 'none')) default 'none';
alter table public.contractor_lead_recipients add column if not exists delivery_destination text;
alter table public.contractor_lead_recipients add column if not exists route_instructions text;
alter table public.contractor_lead_recipients add column if not exists delivered_at timestamptz;
alter table public.contractor_lead_recipients add column if not exists homeowner_action_required boolean default true;

create table if not exists public.contractor_contact_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lead_request_id uuid references public.contractor_lead_requests(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  contractor_name text not null,
  preferred_method text not null check (preferred_method in ('verified_dashboard', 'published_email', 'website_contact_form', 'website', 'phone', 'sms', 'google_profile', 'yelp_profile', 'none')),
  fallback_methods jsonb not null default '[]'::jsonb,
  destination text,
  route_label text,
  route_instructions text,
  can_auto_send boolean default false,
  requires_homeowner_action boolean default true,
  prepared_message text,
  route_status text not null default 'prepared' check (route_status in ('prepared', 'opened', 'email_prepared', 'call_started', 'sms_started', 'shared', 'manual_follow_up_needed', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contractor_contact_discovery_log (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete set null,
  business_name text not null,
  zip_code text,
  discovery_source text not null,
  discovered_phone text,
  discovered_website text,
  discovered_contact_page_url text,
  discovered_email text,
  discovered_google_url text,
  discovered_yelp_url text,
  confidence text not null default 'unknown' check (confidence in ('verified', 'published', 'inferred', 'unknown')),
  notes text,
  created_at timestamptz default now()
);

alter table public.contractor_contact_routes enable row level security;
alter table public.contractor_contact_discovery_log enable row level security;

create policy "Users can manage their contractor contact routes" on public.contractor_contact_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Anyone can read contractor discovery log" on public.contractor_contact_discovery_log
  for select using (true);

create index if not exists contractors_zip_rating_reviews_idx on public.contractors(zip_code, rating, review_count);
create index if not exists contractors_google_place_id_idx on public.contractors(google_place_id);
create index if not exists contractor_contact_routes_request_idx on public.contractor_contact_routes(lead_request_id);
create index if not exists contractor_contact_routes_user_idx on public.contractor_contact_routes(user_id);
create index if not exists contractor_contact_routes_method_idx on public.contractor_contact_routes(preferred_method, route_status);

-- V10 additions: live contractor discovery provider readiness
alter table public.contractors add column if not exists address text;
alter table public.contractors add column if not exists city text;
alter table public.contractors add column if not exists state text;
alter table public.contractors add column if not exists postal_code text;
alter table public.contractors add column if not exists categories jsonb not null default '[]'::jsonb;
alter table public.contractors add column if not exists yelp_business_id text;
alter table public.contractors add column if not exists review_url text;
alter table public.contractors add column if not exists latitude numeric;
alter table public.contractors add column if not exists longitude numeric;
alter table public.contractors add column if not exists last_discovered_at timestamptz;
alter table public.contractors add column if not exists last_provider_refresh_at timestamptz;
alter table public.contractors add column if not exists discovery_confidence text check (discovery_confidence in ('high', 'medium', 'low', 'unknown')) default 'unknown';
alter table public.contractors add column if not exists trust_score integer default 0;
alter table public.contractors add column if not exists trust_score_reasons jsonb not null default '[]'::jsonb;

create table if not exists public.contractor_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  zip_code text not null,
  service_type text,
  provider_status text not null default 'unknown' check (provider_status in ('live', 'cached', 'fallback_demo', 'error', 'unknown')),
  providers_used jsonb not null default '[]'::jsonb,
  result_count integer default 0,
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.contractor_search_results (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid references public.contractor_discovery_runs(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  zip_code text not null,
  business_name text not null,
  phone text,
  website text,
  contact_page_url text,
  published_email text,
  google_place_id text,
  yelp_business_id text,
  google_maps_url text,
  yelp_business_url text,
  address text,
  categories jsonb not null default '[]'::jsonb,
  rating numeric,
  review_count integer,
  distance_miles numeric,
  emergency_service boolean default false,
  hvac_truth_verified boolean default false,
  discovery_sources jsonb not null default '[]'::jsonb,
  source_ids jsonb not null default '{}'::jsonb,
  trust_score integer default 0,
  trust_score_reasons jsonb not null default '[]'::jsonb,
  best_contact_method text,
  best_contact_destination text,
  created_at timestamptz default now()
);

alter table public.contractor_discovery_runs enable row level security;
alter table public.contractor_search_results enable row level security;

create policy "Anyone can insert contractor discovery runs" on public.contractor_discovery_runs
  for insert with check (true);

create policy "Anyone can read contractor discovery runs" on public.contractor_discovery_runs
  for select using (true);

create policy "Anyone can read contractor search results" on public.contractor_search_results
  for select using (true);

create index if not exists contractors_postal_code_idx on public.contractors(postal_code);
create index if not exists contractors_yelp_business_id_idx on public.contractors(yelp_business_id);
create index if not exists contractors_trust_score_idx on public.contractors(trust_score desc);
create index if not exists contractor_discovery_runs_zip_created_idx on public.contractor_discovery_runs(zip_code, created_at desc);
create index if not exists contractor_search_results_zip_score_idx on public.contractor_search_results(zip_code, trust_score desc);
