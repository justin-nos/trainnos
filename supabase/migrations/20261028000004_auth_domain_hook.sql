-- Rejects any new auth user whose email isn't @trainnos.com.
create or replace function public.hook_restrict_signup_domain(event jsonb)
returns jsonb language plpgsql as $$
begin
  if lower(event -> 'user' ->> 'email') like '%@trainnos.com' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403, 'message', 'Only @trainnos.com accounts can sign in.'));
end $$;
grant execute on function public.hook_restrict_signup_domain to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_domain from public, anon, authenticated;
