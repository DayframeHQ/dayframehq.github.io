-- Run against a local Supabase stack: supabase test db
begin;

select plan(20);

-- Fixed UUIDs are test-only auth identities.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.goals (user_id, title) values ('11111111-1111-1111-1111-111111111111', 'Owner one goal');
select is((select count(*)::integer from public.goals), 1, 'owner can select own goal');
select lives_ok($$insert into public.notes (user_id, note_date, content) values ('11111111-1111-1111-1111-111111111111', current_date, 'private')$$, 'owner can insert own note');
select throws_ok($$insert into public.goals (user_id, title) values ('22222222-2222-2222-2222-222222222222', 'blocked')$$, '42501', null, 'cannot insert for another user');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*)::integer from public.goals), 0, 'second user cannot select first user goal');
select is((select count(*)::integer from public.notes), 0, 'second user cannot select first user note');
select is((select count(*)::integer from public.lab_results), 0, 'second user sees no lab data');
select lives_ok($$update public.goals set title = 'stolen' where user_id = '11111111-1111-1111-1111-111111111111'$$, 'cross-user update affects no visible rows');
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select is((select title from public.goals limit 1), 'Owner one goal', 'cross-user update did not change the row');
select is((select count(*)::integer from public.exercises where is_system), 34, 'system exercise library is readable');

select cmp_ok((select count(*)::integer from public.templates where status='published'), '>=', 14, 'published V2 templates are readable');
select throws_ok($$insert into public.templates(slug,domain,name,status) values('blocked-template','study','Blocked','published')$$, '42501', null, 'authenticated users cannot mutate public templates');
select lives_ok($$select public.copy_template_version('20000000-0000-4000-8000-000000000004',current_date)$$, 'owner can transactionally copy a published template');
select is((select count(*)::integer from public.plans where domain='train'), 1, 'template copy creates one owner plan');
select is((select count(*)::integer from public.planned_sessions where domain='train'), 48, 'four-day plan creates twelve complete scheduled weeks');
select cmp_ok((select count(*)::integer from public.learning_resources), '>=', 28, 'interview resource catalog is readable');
select throws_ok($$insert into public.learning_resources(resource_key,provider,title,provider_host,path,resource_type) values('blocked','LEETCODE','Blocked','leetcode.com','/blocked/','problem')$$, '42501', null, 'authenticated users cannot mutate interview resources');
select lives_ok($$select public.copy_template_version('20000000-0000-4000-8000-000000000108','2026-09-01')$$, 'owner can copy the precise interview roadmap');
select is((select count(*)::integer from public.planned_items pi join public.planned_sessions ps on ps.id=pi.planned_session_id where ps.domain='study'), 179, 'interview roadmap creates every exact day task');
select lives_ok($$insert into public.study_notes(user_id,note_type,title,content) values('11111111-1111-1111-1111-111111111111','concept','RLS note','private study note')$$, 'owner can insert a Study note');
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*)::integer from public.plans), 0, 'second user cannot read copied V2 plan');

select * from finish();
rollback;
