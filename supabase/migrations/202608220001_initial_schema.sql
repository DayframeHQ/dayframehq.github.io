-- Dayframe initial schema
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  preferred_units text not null default 'metric' check (preferred_units in ('metric', 'imperial')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  calorie_target integer,
  protein_target_g numeric,
  carbs_target_g numeric,
  fat_target_g numeric,
  fiber_target_g numeric,
  steps_target integer,
  hydration_target_ml integer,
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_programs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text, is_active boolean not null default false, start_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workout_program_days (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.workout_programs(id) on delete cascade, name text not null, weekday smallint check (weekday between 0 and 6), position integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- System exercises are readable by authenticated users; custom exercises are owner-only.
create table public.exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, category text, equipment text, is_system boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint system_exercise_owner check ((is_system and user_id is null) or (not is_system and user_id is not null))
);
create unique index exercises_system_name_unique on public.exercises (lower(name)) where is_system;

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  program_day_id uuid not null references public.workout_program_days(id) on delete cascade, exercise_id uuid not null references public.exercises(id), position integer not null default 0,
  prescribed_sets smallint not null, rep_min smallint, rep_max smallint, target_rir numeric, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.exercise_substitutions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id), substitute_exercise_id uuid not null references public.exercises(id), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  program_day_id uuid references public.workout_program_days(id) on delete set null, session_date date not null, started_at timestamptz, completed_at timestamptz, status text not null default 'planned' check (status in ('planned','active','completed','skipped')), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade, exercise_id uuid not null references public.exercises(id), position integer not null default 0, pain_score numeric check (pain_score between 0 and 10), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.set_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exercise_log_id uuid not null references public.exercise_logs(id) on delete cascade, set_number smallint not null, weight numeric, weight_unit text not null default 'kg' check (weight_unit in ('kg','lb','bodyweight')), reps smallint, rir numeric check (rir between 0 and 10), completed boolean not null default false, pain_score numeric check (pain_score between 0 and 10), notes text, performed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.foods (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, brand text, serving_quantity numeric not null default 1, serving_unit text not null, calories numeric not null default 0, protein_g numeric not null default 0, carbs_g numeric not null default 0, fat_g numeric not null default 0, fiber_g numeric not null default 0, sugar_g numeric, saturated_fat_g numeric, source text not null default 'user_entered' check (source in ('published','calculated','estimated','user_entered')), is_user_created boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, servings numeric not null default 1 check (servings > 0), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade, food_id uuid not null references public.foods(id), quantity numeric not null check (quantity > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null, meal_type text not null check (meal_type in ('Breakfast','Lunch','Dinner','Snack')), name text not null, food_id uuid references public.foods(id) on delete set null, recipe_id uuid references public.recipes(id) on delete set null, quantity numeric not null default 1, calories numeric not null default 0, protein_g numeric not null default 0, carbs_g numeric not null default 0, fat_g numeric not null default 0, fiber_g numeric not null default 0, source text not null default 'user_entered' check (source in ('published','calculated','estimated','user_entered')), restaurant text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null, activity_type text not null check (activity_type in ('walk','swim','steps','sauna','steam','other')), duration_minutes numeric, distance_km numeric, steps integer, speed numeric, incline numeric, laps integer, intensity text, source_type text not null default 'manual', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null, weight_kg numeric, waist_cm numeric, navel_cm numeric, lower_abdomen_cm numeric, chest_cm numeric, shoulders_cm numeric, arms_cm numeric, thighs_cm numeric, hips_cm numeric, body_fat_percentage numeric, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  sleep_date date not null, duration_minutes integer, bedtime timestamptz, wake_time timestamptz, quality smallint check (quality between 1 and 5), energy smallint check (energy between 1 and 5), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.recovery_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null, soreness smallint check (soreness between 0 and 10), stress smallint check (stress between 0 and 10), energy smallint check (energy between 0 and 10), hydration_ml integer, resting_heart_rate numeric, hrv_ms numeric, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.pain_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(), score numeric not null check (score between 0 and 10), body_location text not null, exercise_id uuid references public.exercises(id) on delete set null, workout_session_id uuid references public.workout_sessions(id) on delete set null, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.supplements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, dose numeric, unit text, preferred_time time, frequency jsonb not null default '{}', notes text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.supplement_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade, scheduled_at timestamptz, taken_at timestamptz, taken boolean not null default false, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.lab_results (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  test_name text not null, category text, collection_date date not null, result numeric not null, unit text not null, reference_lower numeric, reference_upper numeric, status text, notes text, provider text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text, why text, target_date date, status text not null default 'active', target_value numeric, progress numeric not null default 0 check (progress between 0 and 100), next_action text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wishes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text, why text, priority smallint, approximate_cost numeric, target_timeframe text, notes text, status text not null default 'Idea' check (status in ('Idea','Someday','Planning','Scheduled','Completed','Archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.travel_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null, country text, start_date date, end_date date, status text not null default 'Wishlist' check (status in ('Wishlist','Researching','Planning','Booked','Traveling','Completed')), budget numeric, actual_spend numeric, booking_references text, itinerary_notes text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.travel_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  travel_plan_id uuid not null references public.travel_plans(id) on delete cascade, item_type text not null check (item_type in ('checklist','place','document','task','itinerary')), title text not null, details text, completed boolean not null default false, due_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text, outcome text, status text not null default 'active', deadline date, progress numeric not null default 0 check (progress between 0 and 100), next_action text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null, title text, content text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, due_at timestamptz, recurrence jsonb, category text, linked_entity_type text, linked_entity_id uuid, completed boolean not null default false, completed_at timestamptz, snoozed_until timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Public reusable templates contain no user history or private owner data.
create table public.program_templates (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description text, schedule jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Fast owner/date lookups.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'workout_programs','workout_program_days','program_exercises','exercise_substitutions','workout_sessions','exercise_logs','set_logs',
    'foods','recipes','recipe_ingredients','meal_entries','activity_logs','body_measurements','sleep_logs','recovery_logs','pain_logs',
    'supplements','supplement_logs','lab_results','goals','wishes','travel_plans','travel_items','projects','notes','reminders'
  ] loop
    execute format('create index %I on public.%I (user_id)', table_name || '_user_id_idx', table_name);
  end loop;
end $$;
create index meal_entries_user_date_idx on public.meal_entries (user_id, entry_date);
create index activity_logs_user_date_idx on public.activity_logs (user_id, activity_date);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date);
create index lab_results_user_test_date_idx on public.lab_results (user_id, test_name, collection_date);
create index reminders_user_due_idx on public.reminders (user_id, due_at) where not completed;

-- Updated timestamps for mutable tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','user_preferences','workout_programs','workout_program_days','exercises','program_exercises','exercise_substitutions','workout_sessions','exercise_logs','set_logs',
    'foods','recipes','recipe_ingredients','meal_entries','activity_logs','body_measurements','sleep_logs','recovery_logs','pain_logs','supplements','supplement_logs',
    'lab_results','goals','wishes','travel_plans','travel_items','projects','notes','reminders','program_templates'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

-- Profiles are created as empty private shells; onboarding fills them in.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, user_id, display_name)
  values (new.id, new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS: every owner table gets explicit SELECT / INSERT / UPDATE / DELETE policies.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','user_preferences','workout_programs','workout_program_days','program_exercises','exercise_substitutions','workout_sessions','exercise_logs','set_logs',
    'foods','recipes','recipe_ingredients','meal_entries','activity_logs','body_measurements','sleep_logs','recovery_logs','pain_logs','supplements','supplement_logs',
    'lab_results','goals','wishes','travel_plans','travel_items','projects','notes','reminders'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_owner', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_owner', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_owner', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete_owner', table_name);
  end loop;
end $$;

alter table public.exercises enable row level security;
create policy exercises_select_system_or_owner on public.exercises for select to authenticated using (is_system or (select auth.uid()) = user_id);
create policy exercises_insert_owner on public.exercises for insert to authenticated with check (not is_system and (select auth.uid()) = user_id);
create policy exercises_update_owner on public.exercises for update to authenticated using (not is_system and (select auth.uid()) = user_id) with check (not is_system and (select auth.uid()) = user_id);
create policy exercises_delete_owner on public.exercises for delete to authenticated using (not is_system and (select auth.uid()) = user_id);

alter table public.program_templates enable row level security;
create policy program_templates_read_authenticated on public.program_templates for select to authenticated using (true);

-- Non-private exercise reference seed.
insert into public.exercises (name, category, is_system) values
  ('Pull-Ups','Back',true), ('Lat Pulldown','Back',true), ('Chest-Supported Machine Row','Back',true),
  ('Incline Dumbbell Press','Chest',true), ('Incline Dumbbell Bench Press','Chest',true), ('Reverse Pec Deck','Shoulders',true),
  ('EZ-Bar Biceps Curl','Arms',true), ('Hammer Curl','Arms',true), ('Cable Crunch','Core',true),
  ('Leg Press','Legs',true), ('Leg Extension','Legs',true), ('Seated Leg Curl','Legs',true), ('Lying Leg Curl','Legs',true),
  ('Hip Thrust','Glutes',true), ('Machine Hip Thrust','Glutes',true), ('Glute Bridge','Glutes',true), ('Calf Raise','Legs',true),
  ('Pallof Press','Core',true), ('Dumbbell Chest Press','Chest',true), ('Machine Chest Press','Chest',true),
  ('Machine Shoulder Press','Shoulders',true), ('Lean-In Dumbbell Lateral Raise','Shoulders',true), ('Cable Y-Raise','Shoulders',true),
  ('Neutral-Grip Cable Row','Back',true), ('Neutral-Grip Machine Row','Back',true), ('Face Pull','Shoulders',true),
  ('Overhead Cable Triceps Extension','Arms',true), ('Triceps Pushdown','Arms',true), ('Dead Bug','Core',true),
  ('Barbell Row','Back',true), ('Romanian Deadlift','Legs',true), ('Walking Lunge','Legs',true),
  ('Hanging Leg Raise','Core',true), ('Bicycle Crunch','Core',true)
on conflict do nothing;

insert into public.program_templates (slug, name, description, schedule) values (
  '4-day-recomp-upper-lower',
  '4-Day Recomp — Upper/Lower',
  'A reusable four-day resistance-training template. Copying is always an explicit user action.',
  $schedule$[
    {"weekday":2,"name":"Upper A / Back emphasis","exercises":[["Pull-Ups",3,4,6],["Lat Pulldown",3,8,10],["Chest-Supported Machine Row",3,8,10],["Incline Dumbbell Press",3,8,10],["Reverse Pec Deck",3,12,15],["EZ-Bar Biceps Curl",3,8,12],["Hammer Curl",2,10,12],["Cable Crunch",3,10,15]]},
    {"weekday":4,"name":"Lower A / Quad emphasis","exercises":[["Leg Press",3,8,12],["Leg Extension",3,10,15],["Seated Leg Curl",3,10,15],["Hip Thrust",3,8,12],["Calf Raise",4,10,15],["Pallof Press",3,10,12]]},
    {"weekday":6,"name":"Upper B / Push emphasis","exercises":[["Incline Dumbbell Bench Press",3,8,10],["Machine Chest Press",3,8,10],["Machine Shoulder Press",3,8,12],["Lean-In Dumbbell Lateral Raise",3,12,20],["Cable Y-Raise",2,12,15],["Neutral-Grip Cable Row",3,10,12],["Face Pull",2,12,15],["Overhead Cable Triceps Extension",3,10,15],["Triceps Pushdown",2,10,15]]},
    {"weekday":0,"name":"Lower B + Core","exercises":[["Seated Leg Curl",4,8,12],["Hip Thrust",3,10,12],["Leg Press",3,10,12],["Leg Extension",2,12,15],["Calf Raise",3,12,15],["Dead Bug",3,8,10],["Cable Crunch",3,12,15]]}
  ]$schedule$::jsonb
)
on conflict (slug) do update set schedule = excluded.schedule, updated_at = now();
