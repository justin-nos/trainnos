begin;
select plan(5);

select is(public.hook_restrict_signup_domain('{"user":{"email":"coach@trainnos.com"}}'), '{}', 'trainnos.com allowed');
select is(public.hook_restrict_signup_domain('{"user":{"email":"Coach@TrainNOS.com"}}'), '{}', 'case-insensitive');
select is(public.hook_restrict_signup_domain('{"user":{"email":"someone@gmail.com"}}') #>> '{error,http_code}', '403', 'gmail rejected');
select is(public.hook_restrict_signup_domain('{"user":{"email":"x@trainnos.com.evil.io"}}') #>> '{error,http_code}', '403', 'lookalike domain rejected');
select ok(has_function_privilege('supabase_auth_admin', 'public.hook_restrict_signup_domain(jsonb)', 'execute'),
  'auth admin can call the hook');

select * from finish();
rollback;
