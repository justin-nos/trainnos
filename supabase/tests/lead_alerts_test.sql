begin;
select plan(4);

insert into public.leads (id, first_name, phone, consent, answers, recommendation, source)
values ('alert-test', 'Sam', '+15555550100', true, '{}', '{}', 'fit-quiz');
select is((select alert_scheduled from public.leads where id = 'alert-test'), '{}'::text[],
  'alert_scheduled defaults to empty');
select is((select alert_failed from public.leads where id = 'alert-test'), 0, 'alert_failed defaults to 0');
select is((select alert_code from public.leads where id = 'alert-test'), null, 'no alert code until alerts go out');
select has_index('public', 'leads', 'leads_alert_code_idx', 'alert_code is indexed');

select * from finish();
rollback;
