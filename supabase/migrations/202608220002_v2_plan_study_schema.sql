-- Dayframe V2: shared planning, Study, nutrition summaries and private imports.
-- This migration is additive and preserves every V1 row and table.

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  domain text not null check (domain in ('train','study')),
  name text not null,
  short_description text,
  goal text,
  difficulty text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  version text not null,
  duration_weeks integer,
  days_per_week_min integer,
  days_per_week_max integer,
  expected_hours_per_week numeric,
  expected_session_minutes integer,
  content jsonb not null,
  published_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, version)
);

create table public.template_sources (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  title text not null,
  author_or_org text,
  url text,
  source_type text,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('train','study')),
  template_id uuid references public.templates(id) on delete set null,
  template_version_id uuid references public.template_versions(id) on delete set null,
  name text not null,
  goal text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
  start_date date,
  target_date date,
  expected_minutes_per_week integer,
  source text not null check (source in ('curated_template','custom','imported_document')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.plan_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  start_week integer,
  end_week integer,
  status text not null default 'not_started' check (status in ('not_started','active','completed','skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  phase_id uuid references public.plan_phases(id) on delete set null,
  name text not null,
  description text,
  position integer not null default 0,
  block_type text not null check (block_type in ('week','module','cycle','custom')),
  planned_start date,
  planned_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  phase_id uuid references public.plan_phases(id) on delete set null,
  block_id uuid references public.plan_blocks(id) on delete set null,
  domain text not null check (domain in ('train','study')),
  title text not null,
  description text,
  scheduled_date date not null,
  scheduled_time time,
  estimated_minutes integer,
  status text not null default 'planned' check (status in ('planned','active','completed','partially_completed','skipped','rescheduled')),
  original_session_id uuid references public.planned_sessions(id) on delete set null,
  rescheduled_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.plan_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  completion_rule text not null default 'manual' check (completion_rule in ('manual','session_count','item_count','metric')),
  target_value numeric,
  current_value numeric,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  parent_topic_id uuid references public.study_topics(id) on delete set null,
  name text not null,
  slug text not null,
  area text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system and user_id is null) or (not is_system and user_id is not null)),
  unique (user_id, slug)
);

create table public.study_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  is_system boolean not null default false,
  title text not null,
  provider text,
  url text,
  resource_type text not null check (resource_type in ('course','article','video','book','problem_set','documentation','repository','other')),
  access_type text not null default 'free' check (access_type in ('free','paid','mixed')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system and user_id is null) or (not is_system and user_id is not null))
);

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  is_system boolean not null default false,
  task_type text not null check (task_type in ('problem','lesson','reading','project','project_task','design','mock','review','explain','custom')),
  title text not null,
  description text,
  topic_id uuid references public.study_topics(id) on delete set null,
  difficulty text,
  resource_id uuid references public.study_resources(id) on delete set null,
  external_url text,
  estimated_minutes integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system and user_id is null) or (not is_system and user_id is not null))
);

create table public.planned_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  domain text not null check (domain in ('train','study')),
  item_type text not null,
  title text not null,
  position integer not null default 0,
  estimated_minutes integer,
  required boolean not null default true,
  status text not null default 'planned' check (status in ('planned','active','completed','skipped')),
  study_task_id uuid references public.study_tasks(id) on delete set null,
  program_exercise_id uuid references public.program_exercises(id) on delete set null,
  source_resource_id uuid references public.study_resources(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  session_type text not null check (session_type in ('learn','practice','build','review','explain','mock','read')),
  focus_topic_id uuid references public.study_topics(id) on delete set null,
  planned_minutes integer,
  actual_minutes integer,
  energy_before smallint check (energy_before between 1 and 5),
  focus_score smallint check (focus_score between 1 and 5),
  notes text,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  study_task_id uuid not null references public.study_tasks(id) on delete cascade,
  attempt_number integer not null default 1,
  result text not null check (result in ('independent','hint','solution_assisted','partial','failed','completed','needs_review')),
  duration_seconds integer,
  confidence_before smallint check (confidence_before between 1 and 5),
  confidence_after smallint check (confidence_after between 1 and 5),
  difficulty_perceived smallint check (difficulty_perceived between 1 and 5),
  answer_summary text,
  what_i_missed text,
  time_complexity text,
  space_complexity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  session_id uuid references public.study_sessions(id) on delete set null,
  task_id uuid references public.study_tasks(id) on delete set null,
  topic_id uuid references public.study_topics(id) on delete set null,
  note_type text not null check (note_type in ('concept','mistake','solution','summary','design','question','insight')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.study_tasks(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete cascade,
  note_id uuid references public.study_notes(id) on delete cascade,
  scheduled_for date not null,
  completed_at timestamptz,
  review_type text not null check (review_type in ('recall','resolve','reimplement','explain','quiz')),
  confidence_before smallint check (confidence_before between 1 and 5),
  confidence_after smallint check (confidence_after between 1 and 5),
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(task_id, topic_id, note_id) >= 1)
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('nutrition_screenshot','study_plan_document','workout_plan_document')),
  status text not null check (status in ('uploaded','processing','review','completed','failed','expired')),
  original_filename text,
  mime_type text,
  provider text,
  extracted_data jsonb,
  confidence jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

create table public.daily_nutrition_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fiber_g numeric,
  source text not null check (source in ('screenshot','manual','imported','other')),
  source_label text,
  use_as_daily_total boolean not null default true,
  import_job_id uuid references public.import_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date)
);

alter table public.workout_programs add column plan_id uuid references public.plans(id) on delete set null;
alter table public.workout_sessions add column planned_session_id uuid references public.planned_sessions(id) on delete set null;
alter table public.user_preferences add column leetcode_profile_url text;

create index plans_user_status_idx on public.plans(user_id, status);
create index planned_sessions_user_date_idx on public.planned_sessions(user_id, scheduled_date);
create index planned_sessions_user_status_idx on public.planned_sessions(user_id, status);
create index planned_sessions_plan_date_idx on public.planned_sessions(plan_id, scheduled_date);
create index planned_items_session_position_idx on public.planned_items(planned_session_id, position);
create index study_sessions_user_started_idx on public.study_sessions(user_id, started_at);
create index study_sessions_plan_started_idx on public.study_sessions(plan_id, started_at);
create index study_attempts_user_task_idx on public.study_attempts(user_id, study_task_id);
create index study_attempts_session_idx on public.study_attempts(study_session_id);
create index study_notes_user_topic_idx on public.study_notes(user_id, topic_id);
create index study_notes_user_created_idx on public.study_notes(user_id, created_at);
create index study_reviews_user_due_idx on public.study_reviews(user_id, scheduled_for) where completed_at is null;
create index import_jobs_user_created_idx on public.import_jobs(user_id, created_at);
create index import_jobs_user_status_idx on public.import_jobs(user_id, status);

-- Public catalog: authenticated users can read published versions only.
alter table public.templates enable row level security;
alter table public.template_versions enable row level security;
alter table public.template_sources enable row level security;
create policy templates_read_published on public.templates for select to authenticated using (status = 'published');
create policy template_versions_read_published on public.template_versions for select to authenticated using (published_at is not null and exists (select 1 from public.templates t where t.id = template_id and t.status = 'published'));
create policy template_sources_read_published on public.template_sources for select to authenticated using (exists (select 1 from public.template_versions v join public.templates t on t.id = v.template_id where v.id = template_version_id and v.published_at is not null and t.status = 'published'));

-- Mixed system/owner Study reference data.
alter table public.study_topics enable row level security;
alter table public.study_resources enable row level security;
alter table public.study_tasks enable row level security;
create policy study_topics_read on public.study_topics for select to authenticated using (is_system or (select auth.uid()) = user_id);
create policy study_topics_insert_owner on public.study_topics for insert to authenticated with check (not is_system and (select auth.uid()) = user_id);
create policy study_topics_update_owner on public.study_topics for update to authenticated using (not is_system and (select auth.uid()) = user_id) with check (not is_system and (select auth.uid()) = user_id);
create policy study_topics_delete_owner on public.study_topics for delete to authenticated using (not is_system and (select auth.uid()) = user_id);
create policy study_resources_read on public.study_resources for select to authenticated using (is_system or (select auth.uid()) = user_id);
create policy study_resources_insert_owner on public.study_resources for insert to authenticated with check (not is_system and (select auth.uid()) = user_id);
create policy study_resources_update_owner on public.study_resources for update to authenticated using (not is_system and (select auth.uid()) = user_id) with check (not is_system and (select auth.uid()) = user_id);
create policy study_resources_delete_owner on public.study_resources for delete to authenticated using (not is_system and (select auth.uid()) = user_id);
create policy study_tasks_read on public.study_tasks for select to authenticated using (is_system or (select auth.uid()) = user_id);
create policy study_tasks_insert_owner on public.study_tasks for insert to authenticated with check (not is_system and (select auth.uid()) = user_id);
create policy study_tasks_update_owner on public.study_tasks for update to authenticated using (not is_system and (select auth.uid()) = user_id) with check (not is_system and (select auth.uid()) = user_id);
create policy study_tasks_delete_owner on public.study_tasks for delete to authenticated using (not is_system and (select auth.uid()) = user_id);

-- Every personal V2 table gets complete owner CRUD policies.
do $$
declare table_name text;
begin
  foreach table_name in array array['plans','plan_phases','plan_blocks','planned_sessions','planned_items','plan_milestones','study_sessions','study_attempts','study_notes','study_reviews','daily_nutrition_summaries','import_jobs'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_owner', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_owner', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_owner', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete_owner', table_name);
  end loop;
end $$;

-- Transactionally copy a published template into normalized, user-owned rows.
create or replace function public.copy_template_version(p_template_version_id uuid, p_start_date date default current_date)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_version record; v_plan uuid; v_phase uuid; v_block uuid; v_session uuid;
  v_program uuid; v_program_day uuid; v_exercise uuid; v_program_exercise uuid; v_task uuid; v_row record;
  phase jsonb; block jsonb; session jsonb; item jsonb; phase_n integer := 0; block_n integer; session_n integer; item_n integer; repeat_n integer; repeat_max integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select v.*, t.id as public_template_id, t.domain, t.name, t.goal into v_version
  from public.template_versions v join public.templates t on t.id = v.template_id
  where v.id = p_template_version_id and v.published_at is not null and t.status = 'published';
  if not found then raise exception 'Published template version not found'; end if;
  insert into public.plans(user_id,domain,template_id,template_version_id,name,goal,status,start_date,target_date,expected_minutes_per_week,source)
  values(v_user,v_version.domain,v_version.public_template_id,v_version.id,v_version.name,v_version.goal,'active',p_start_date,
    case when v_version.duration_weeks is null then null else p_start_date + (v_version.duration_weeks * 7 - 1) end,
    (v_version.expected_hours_per_week * 60)::integer,'curated_template') returning id into v_plan;
  for phase in select * from jsonb_array_elements(coalesce(v_version.content->'phases','[]')) loop
    phase_n := phase_n + 1;
    insert into public.plan_phases(user_id,plan_id,name,description,position,start_week,end_week,status)
    values(v_user,v_plan,phase->>'name',phase->>'description',phase_n,(phase->>'start_week')::integer,(phase->>'end_week')::integer,case when phase_n=1 then 'active' else 'not_started' end) returning id into v_phase;
    block_n := 0;
    for block in select * from jsonb_array_elements(coalesce(phase->'blocks','[]')) loop
      block_n := block_n + 1;
      insert into public.plan_blocks(user_id,plan_id,phase_id,name,description,position,block_type,planned_start,planned_end)
      values(v_user,v_plan,v_phase,block->>'name',block->>'description',block_n,coalesce(block->>'type','week'),p_start_date + (coalesce((block->>'week')::integer,block_n)-1)*7,p_start_date + (coalesce((block->>'week')::integer,block_n)-1)*7+6) returning id into v_block;
      repeat_max := case when v_version.domain = 'train' and coalesce(block->>'type','week') = 'cycle' then greatest(coalesce(v_version.duration_weeks,1)-1,0) else 0 end;
      for repeat_n in 0..repeat_max loop
        session_n := 0;
        for session in select * from jsonb_array_elements(coalesce(block->'sessions','[]')) loop
          session_n := session_n + 1;
          insert into public.planned_sessions(user_id,plan_id,phase_id,block_id,domain,title,description,scheduled_date,scheduled_time,estimated_minutes)
          values(v_user,v_plan,v_phase,v_block,v_version.domain,session->>'title',session->>'description',p_start_date + (coalesce((block->>'week')::integer,block_n)-1+repeat_n)*7 + coalesce((session->>'day_offset')::integer,session_n-1),nullif(session->>'time','')::time,(session->>'minutes')::integer) returning id into v_session;
          item_n := 0;
          for item in select * from jsonb_array_elements(coalesce(session->'items','[]')) loop
            item_n := item_n + 1;
            insert into public.planned_items(user_id,planned_session_id,domain,item_type,title,position,estimated_minutes,required,metadata)
            values(v_user,v_session,v_version.domain,coalesce(item->>'type','task'),item->>'title',item_n,(item->>'minutes')::integer,coalesce((item->>'required')::boolean,true),coalesce(item->'metadata','{}'));
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
  if v_version.domain = 'study' then
    for v_row in select pi.id, pi.title, pi.item_type, pi.estimated_minutes, pi.metadata from public.planned_items pi join public.planned_sessions ps on ps.id=pi.planned_session_id where ps.plan_id=v_plan loop
      insert into public.study_tasks(user_id,is_system,task_type,title,estimated_minutes,metadata)
      values(v_user,false,case when v_row.item_type in ('problem','lesson','reading','project','project_task','design','mock','review','explain','custom') then v_row.item_type else 'custom' end,v_row.title,v_row.estimated_minutes,v_row.metadata) returning id into v_task;
      update public.planned_items set study_task_id=v_task where id=v_row.id;
    end loop;
  else
    insert into public.workout_programs(user_id,plan_id,name,description,is_active,start_date)
    values(v_user,v_plan,v_version.name,'Personal copy of Dayframe template version '||v_version.version,true,p_start_date) returning id into v_program;
    for session in select * from jsonb_array_elements(coalesce(v_version.content#>'{phases,0,blocks,0,sessions}','[]')) loop
      insert into public.workout_program_days(user_id,program_id,name,weekday,position)
      values(v_user,v_program,session->>'title',extract(dow from p_start_date + coalesce((session->>'day_offset')::integer,0))::smallint,coalesce((session->>'day_offset')::integer,0)) returning id into v_program_day;
      item_n := 0;
      for item in select * from jsonb_array_elements(coalesce(session->'items','[]')) loop
        item_n := item_n + 1;
        select id into v_exercise from public.exercises where lower(name)=lower(item->>'title') order by is_system desc limit 1;
        if v_exercise is null then insert into public.exercises(user_id,name,category,is_system) values(v_user,item->>'title','Custom',false) returning id into v_exercise; end if;
        insert into public.program_exercises(user_id,program_day_id,exercise_id,position,prescribed_sets,rep_min,rep_max,target_rir,notes)
        values(v_user,v_program_day,v_exercise,item_n,coalesce((item#>>'{metadata,sets}')::smallint,3),(item#>>'{metadata,rep_min}')::smallint,(item#>>'{metadata,rep_max}')::smallint,(item#>>'{metadata,target_rir}')::numeric,'Copied from immutable template version') returning id into v_program_exercise;
        update public.planned_items pi set program_exercise_id=v_program_exercise from public.planned_sessions ps where pi.planned_session_id=ps.id and ps.plan_id=v_plan and pi.position=item_n and pi.title=item->>'title';
        v_exercise := null;
      end loop;
    end loop;
  end if;
  return v_plan;
end $$;
revoke all on function public.copy_template_version(uuid,date) from public;
grant execute on function public.copy_template_version(uuid,date) to authenticated;
