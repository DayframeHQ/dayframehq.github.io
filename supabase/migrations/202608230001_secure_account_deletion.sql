begin;

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  delete from auth.users where id = caller_id;

  if not found then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_current_user() from public;
revoke all on function public.delete_current_user() from anon;
grant execute on function public.delete_current_user() to authenticated;

comment on function public.delete_current_user() is
  'Permanently deletes only the authenticated caller. User-owned rows are removed by foreign-key cascades.';

commit;
