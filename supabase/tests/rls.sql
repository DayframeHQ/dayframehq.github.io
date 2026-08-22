-- Run against a local Supabase stack: supabase test db
begin;

select plan(9);

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

select * from finish();
rollback;
