begin;
select plan(8);

select ok((select relrowsecurity from pg_class where oid = 'public.trainers'::regclass),
  'RLS is enabled on trainers');

insert into public.trainers (id, name, position, photo_path)
values ('t-defaults', 'Jane Doe', 'Head Coach', 'trainers/t-defaults/original.jpg');
select is((select active from public.trainers where id = 't-defaults'), true, 'active defaults to true');
select is((select bio from public.trainers where id = 't-defaults'), '', 'bio defaults to empty');
select isnt((select created_at from public.trainers where id = 't-defaults'), null, 'created_at is set');

select lives_ok($$insert into public.trainers (name, position, photo_path)
  values ('Gavin', 'Co-Founder', 'trainers/x/original.png')$$, 'Co-Founder allowed');
select throws_ok($$insert into public.trainers (name, position, photo_path)
  values ('Jane', 'Co Founder', 'trainers/x/original.jpg')$$,
  '23514', null, 'unknown position rejected');
select throws_ok($$insert into public.trainers (name, position, photo_path)
  values (repeat('a', 61), 'Head Coach', 'trainers/x/original.jpg')$$,
  '23514', null, '61-character name rejected');
select throws_ok($$insert into public.trainers (name, position, bio, photo_path)
  values ('Jane', 'Head Coach', repeat('a', 401), 'trainers/x/original.jpg')$$,
  '23514', null, '401-character bio rejected');

select * from finish();
rollback;
