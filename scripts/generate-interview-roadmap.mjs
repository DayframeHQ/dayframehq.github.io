import { readFileSync, writeFileSync } from 'node:fs'

const sourceUrl = new URL('../src/data/interviewRoadmap.json', import.meta.url)
const outputUrl = new URL('../supabase/migrations/202609010001_interview_study_os.sql', import.meta.url)
const roadmap = JSON.parse(readFileSync(sourceUrl, 'utf8'))

const noteSchemas = {
  dsa: ['Pattern','Named Algorithm','Trigger','Brute Force','Key Observation','Invariant','Pointer / State Movement','Algorithm','Time Complexity','Space Complexity','Edge Cases','Mistake I Made','What I Learned','Code Notes','Interview Explanation','Confidence','Personal Notes'],
  hld: ['Definition','Why it exists','Functional role','Non-functional impact','Scalability implications','Availability implications','Latency implications','Trade-offs','Alternatives','Common failure modes','Where used','Example systems','Interview talking points','Diagram','Open questions','Personal notes'],
  hldDesign: ['Clarifying Questions','Functional Requirements','Non-functional Requirements','Capacity Estimates','Core Entities','API Design','Database Choice','High-Level Architecture','Data Flow','Scaling','Caching','Consistency','Fault Tolerance','Bottlenecks','Trade-offs','Follow-up Questions'],
  lld: ['Requirements','Actors','Use Cases','Entities','Responsibilities','Relationships','Interfaces','Composition vs inheritance','SOLID principles applied','Design patterns','Class diagram','Sequence diagram','Important methods','Extension points','Trade-offs','Implementation notes','Interview explanation'],
}

function item(task, weekNumber) {
  return {
    type: task.type,
    title: task.title,
    minutes: task.minutes,
    required: task.required ?? true,
    metadata: {
      interview_task_id: task.id,
      interview_os: true,
      week: weekNumber,
      subject: task.subject,
      topic: task.topic,
      difficulty: task.difficulty,
      leetcode_number: task.leetcodeNumber,
      leetcode_slug: task.leetcodeSlug,
      guided: task.guided ?? false,
      description: task.description,
      resource_keys: task.resources ?? [],
      priority: task.priority ?? (task.subject === 'REVISION' ? 'optional' : 'high'),
    },
  }
}

const phases = [{
  name: 'Software Engineering Interview Preparation',
  description: 'DSA, HLD, LLD, distributed systems, revision and mock interviews.',
  start_week: 1,
  end_week: 9,
  blocks: roadmap.weeks.map((week) => ({
    name: `Week ${week.number} — ${week.title}`,
    description: `${week.startDate} to ${week.endDate}`,
    type: 'week',
    week: week.number + 1,
    sessions: week.days.map((day) => {
      const date = new Date(`${day.date}T12:00:00Z`)
      const mondayIndex = (date.getUTCDay() + 6) % 7
      return {
        title: `Interview Prep — ${day.label}`,
        description: `Week ${week.number} · ${week.title}`,
        // The canonical roadmap starts on Tuesday, 1 September. Every block is
        // positioned relative to that date, so Monday is always offset -1.
        day_offset: mondayIndex - 1,
        minutes: day.tasks.reduce((sum, task) => sum + task.minutes, 0),
        items: day.tasks.map((task) => item(task, week.number)),
      }
    }),
  })),
}]

const content = {
  content_status: 'complete',
  interview_os: true,
  canonical_start_date: roadmap.startDate,
  canonical_end_date: roadmap.endDate,
  note_schemas: noteSchemas,
  baseline: roadmap.baseline,
  phases,
}

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`
const resourceRows = roadmap.resources.map((resource) => `(${[
  sqlString(resource.key), sqlString(resource.provider), sqlString(resource.title), sqlString(resource.providerHost), sqlString(resource.path),
  sqlString(resource.resourceType), resource.isPrimary, resource.isFree, sqlString(resource.topicId),
].join(',')})`).join(',\n')

const sql = `-- Generated from src/data/interviewRoadmap.json. Do not hand-edit the curriculum payload.
-- Regenerate with: node scripts/generate-interview-roadmap.mjs

begin;

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  resource_key text not null unique,
  provider text not null check (provider in ('LEETCODE','EDUCATIVE','GEEKS_FOR_GEEKS','SYSTEM_DESIGN_PRIMER','REFACTORING_GURU')),
  title text not null,
  provider_host text not null,
  path text not null check (path like '/%'),
  resource_type text not null,
  is_primary boolean not null default false,
  is_free boolean not null default false,
  topic_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_resources enable row level security;
drop policy if exists learning_resources_read_authenticated on public.learning_resources;
create policy learning_resources_read_authenticated on public.learning_resources for select to authenticated using (true);

alter table public.planned_items drop constraint if exists planned_items_status_check;
alter table public.planned_items add constraint planned_items_status_check check (status in ('planned','active','completed','review_needed','skipped'));
alter table public.planned_items add column if not exists completed_at timestamptz;
alter table public.planned_items add column if not exists score smallint check (score between 0 and 3);
alter table public.planned_items add column if not exists confidence smallint check (confidence between 1 and 5);
alter table public.planned_items add column if not exists needs_revision boolean not null default false;
alter table public.planned_items add column if not exists attempt_count integer not null default 0;
alter table public.planned_items add column if not exists problem_status text check (problem_status in ('UNSEEN','ATTEMPTED','SOLVED_WITH_SOLUTION','SOLVED_WITH_HINT','SOLVED_INDEPENDENTLY','MASTERED'));
alter table public.planned_items add column if not exists quick_note text;
alter table public.planned_items add column if not exists structured_notes jsonb not null default '{}'::jsonb;
alter table public.planned_items add column if not exists rescheduled_for date;

alter table public.study_attempts add column if not exists score smallint check (score between 0 and 3);
alter table public.study_attempts add column if not exists problem_status text check (problem_status in ('UNSEEN','ATTEMPTED','SOLVED_WITH_SOLUTION','SOLVED_WITH_HINT','SOLVED_INDEPENDENTLY','MASTERED'));
alter table public.study_notes add column if not exists planned_item_id uuid references public.planned_items(id) on delete set null;
alter table public.study_notes add column if not exists structured_content jsonb not null default '{}'::jsonb;

create table if not exists public.problem_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planned_item_id uuid not null references public.planned_items(id) on delete cascade,
  attempt_number integer not null default 1,
  result text not null check (result in ('ATTEMPTED','SOLVED_WITH_SOLUTION','SOLVED_WITH_HINT','SOLVED_INDEPENDENTLY','MASTERED')),
  score smallint check (score between 0 and 3),
  duration_minutes integer,
  confidence smallint check (confidence between 1 and 5),
  notes text,
  attempted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.problem_attempts enable row level security;
drop policy if exists problem_attempts_select_owner on public.problem_attempts;
drop policy if exists problem_attempts_insert_owner on public.problem_attempts;
drop policy if exists problem_attempts_update_owner on public.problem_attempts;
drop policy if exists problem_attempts_delete_owner on public.problem_attempts;
create policy problem_attempts_select_owner on public.problem_attempts for select to authenticated using ((select auth.uid())=user_id);
create policy problem_attempts_insert_owner on public.problem_attempts for insert to authenticated with check ((select auth.uid())=user_id);
create policy problem_attempts_update_owner on public.problem_attempts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy problem_attempts_delete_owner on public.problem_attempts for delete to authenticated using ((select auth.uid())=user_id);

create index if not exists planned_items_user_status_idx on public.planned_items(user_id,status);
create index if not exists planned_items_revision_idx on public.planned_items(user_id,needs_revision) where needs_revision;
create index if not exists study_notes_planned_item_idx on public.study_notes(user_id,planned_item_id);
create index if not exists problem_attempts_item_idx on public.problem_attempts(user_id,planned_item_id,attempted_at desc);

insert into public.learning_resources(resource_key,provider,title,provider_host,path,resource_type,is_primary,is_free,topic_key) values
${resourceRows}
on conflict (resource_key) do update set
  provider=excluded.provider,title=excluded.title,provider_host=excluded.provider_host,path=excluded.path,
  resource_type=excluded.resource_type,is_primary=excluded.is_primary,is_free=excluded.is_free,topic_key=excluded.topic_key,updated_at=now();

update public.templates set
  name='Software Engineering Interview Preparation',
  short_description='A precise nine-week DSA, HLD, LLD, distributed-systems, revision and mock-interview operating system.',
  goal='Prepare for software engineering interviews',
  difficulty='Advanced',
  featured=true,
  updated_at=now()
where id='10000000-0000-4000-8000-000000000106';

insert into public.template_versions(
  id,template_id,version,duration_weeks,days_per_week_min,days_per_week_max,
  expected_hours_per_week,expected_session_minutes,content,published_at,reviewed_at
) values (
  '20000000-0000-4000-8000-000000000108','10000000-0000-4000-8000-000000000106','2.0',9,6,7,16,150,
  ${sqlString(JSON.stringify(content))}::jsonb,now(),now()
)
on conflict (template_id,version) do update set
  duration_weeks=excluded.duration_weeks,days_per_week_min=excluded.days_per_week_min,days_per_week_max=excluded.days_per_week_max,
  expected_hours_per_week=excluded.expected_hours_per_week,expected_session_minutes=excluded.expected_session_minutes,
  content=excluded.content,published_at=excluded.published_at,reviewed_at=excluded.reviewed_at,updated_at=now();

delete from public.template_sources where template_version_id='20000000-0000-4000-8000-000000000108';
insert into public.template_sources(template_version_id,title,author_or_org,url,source_type,description,position) values
('20000000-0000-4000-8000-000000000108','Grokking Coding Interview Patterns','Educative','https://www.educative.io/courses/grokking-coding-interview','course','Primary DSA theory curriculum.',1),
('20000000-0000-4000-8000-000000000108','LeetCode Problems','LeetCode','https://leetcode.com/problemset/','problem_set','Canonical problem statements using persisted slugs.',2),
('20000000-0000-4000-8000-000000000108','Grokking Modern System Design Interview','Educative','https://www.educative.io/courses/grokking-the-system-design-interview','course','Primary HLD curriculum.',3),
('20000000-0000-4000-8000-000000000108','Grokking the Low-Level Design Interview','Educative','https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles','course','Primary LLD curriculum.',4),
('20000000-0000-4000-8000-000000000108','Distributed Systems for Practitioners','Educative','https://www.educative.io/courses/distributed-systems-practitioners','course','Primary distributed-systems curriculum.',5),
('20000000-0000-4000-8000-000000000108','System Design Primer','donnemartin','https://github.com/donnemartin/system-design-primer','repository','Free HLD alternative.',6);

commit;
`

writeFileSync(outputUrl, sql)
console.log(`Wrote ${outputUrl.pathname}`)
