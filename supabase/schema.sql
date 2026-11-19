-- Run in Supabase SQL Editor. Incoming likes stay in a private table and are never queried by public clients.
create table if not exists public.profiles (
  id text primary key, name text not null, age int not null check (age >= 18), photo text not null,
  bio text not null, location text not null, interests text[] not null default '{}'
);
create table if not exists public.swipes (
  user_id text not null, profile_id text not null references public.profiles(id),
  action text not null check (action in ('like', 'pass')), created_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);
create table if not exists public.incoming_likes (
  user_id text not null, profile_id text not null references public.profiles(id),
  created_at timestamptz not null default now(), primary key (user_id, profile_id)
);
create table if not exists public.matches (
  user_id text not null, profile_id text not null references public.profiles(id),
  created_at timestamptz not null default now(), primary key (user_id, profile_id)
);
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.incoming_likes enable row level security;
alter table public.matches enable row level security;
-- No anon/authenticated policies: all operations are server-side with SUPABASE_SERVICE_ROLE_KEY.

-- Fictional profile seed. Matches src/lib/profiles.ts.
insert into public.profiles (id, name, age, photo, bio, location, interests) values
('profile-01','Maya',25,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85','A good playlist, a long walk, and finding the best chai in town.','Pune',array['Live music','Coffee','Hiking']),
('profile-02','Riya',24,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85','Collecting little moments and big book recommendations.','Mumbai',array['Books','Art','Travel']),
('profile-03','Ananya',26,'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85','Weekend baker, weekday designer. Always up for a museum date.','Bengaluru',array['Baking','Design','Museums']),
('profile-04','Zara',23,'https://images.unsplash.com/photo-1529139574466-a303027c1d8?auto=format&fit=crop&w=900&q=85','Here for good food, better conversations, and dogs everywhere.','Delhi',array['Food','Dogs','Cinema']),
('profile-05','Isha',25,'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85','Sunrise runs, sunset films, and everything in between.','Hyderabad',array['Running','Films','Travel']),
('profile-06','Naina',27,'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85','I make ceramics and a very convincing case for dessert.','Jaipur',array['Pottery','Cooking','Art']),
('profile-07','Aarav',26,'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85','Photographer chasing soft light and spicy street food.','Mumbai',array['Photography','Food','Cycling']),
('profile-08','Kabir',24,'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85','Guitar player, terrible dancer, excellent brunch companion.','Pune',array['Music','Brunch','Tennis']),
('profile-09','Dev',28,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85','Building things by day, looking for the next trail by weekend.','Bengaluru',array['Startups','Hiking','Coffee']),
('profile-10','Arjun',25,'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=900&q=85','Film nerd with a soft spot for old bookstores.','Delhi',array['Cinema','Books','Cricket']),
('profile-11','Meera',24,'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=85','Learning to surf. Happy to teach you absolutely nothing about it.','Chennai',array['Surfing','Travel','Music']),
('profile-12','Sana',26,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85','Home cook who believes every problem needs more pasta.','Kolkata',array['Cooking','Food','Reading']),
('profile-13','Tara',23,'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85','Slow mornings, good design, and spontaneous train tickets.','Mumbai',array['Design','Travel','Yoga']),
('profile-14','Aditi',27,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85','Equal parts quiet café and loud concert energy.','Pune',array['Concerts','Coffee','Yoga']),
('profile-15','Neha',25,'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85','Plant parent, amateur runner, professional snack finder.','Bengaluru',array['Plants','Running','Food']),
('profile-16','Vihaan',27,'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85','Exploring new cities one local breakfast at a time.','Hyderabad',array['Travel','Food','Photography']),
('profile-17','Rohan',25,'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85','I know a great spot for momos. This is my best opening line.','Delhi',array['Food','Comedy','Football']),
('profile-18','Ishaan',26,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85','Weekend cyclist and aspiring home barista.','Chennai',array['Cycling','Coffee','Music']),
('profile-19','Sameer',24,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85','Making playlists for people who have not asked yet.','Kolkata',array['Music','Books','Football']),
('profile-20','Kunal',28,'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=900&q=85','Architect by trade, mountain person by choice.','Jaipur',array['Architecture','Hiking','Travel']),
('profile-21','Leah',25,'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85','Trying every bakery in the city. Research, obviously.','Mumbai',array['Baking','Art','Dogs']),
('profile-22','Priya',26,'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85','Museum dates and unreasonably competitive board games.','Delhi',array['Museums','Games','Books']),
('profile-23','Diya',24,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85','A little bit of yoga, a lot of very good food.','Bengaluru',array['Yoga','Food','Travel']),
('profile-24','Simran',27,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85','When I am not at work, I am probably at a gig.','Pune',array['Live music','Dance','Cinema']),
('profile-25','Noor',23,'https://images.unsplash.com/photo-1529139574466-a303027c1d8?auto=format&fit=crop&w=900&q=85','Sketchbook in my bag, always looking for a new view.','Hyderabad',array['Art','Photography','Hiking']),
('profile-26','Anika',25,'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85','Ocean air and a book I will finish in one sitting.','Chennai',array['Beach','Reading','Cooking']),
('profile-27','Rhea',28,'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85','Finding joy in the everyday and the occasional fancy dinner.','Kolkata',array['Food','Theatre','Travel']),
('profile-28','Sanya',24,'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85','A terrible singer with excellent concert ticket taste.','Jaipur',array['Concerts','Films','Coffee']),
('profile-29','Nikhil',26,'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85','Trying to cook my way through my grandmother''s recipes.','Pune',array['Cooking','Cycling','Books']),
('profile-30','Aditya',27,'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85','Runner, reader, and the friend who plans the group trip.','Mumbai',array['Running','Travel','Cricket'])
on conflict (id) do nothing;

-- Fictional demo incoming likes apply to every test account. This private wildcard is queried only by the server RPC.
insert into public.incoming_likes (user_id, profile_id) values
('*','profile-02'), ('*','profile-05'), ('*','profile-09'),
('*','profile-14'), ('*','profile-21'), ('*','profile-27')
on conflict do nothing;

-- Atomic write: a mutual match is recorded in the same transaction as the outgoing swipe.
create or replace function public.record_demo_swipe(p_user_id text, p_profile_id text, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_profile_id text;
  is_mutual boolean := false;
begin
  if p_action not in ('like', 'pass') then
    raise exception 'Invalid swipe action';
  end if;

  insert into public.swipes (user_id, profile_id, action)
  values (p_user_id, p_profile_id, p_action)
  on conflict (user_id, profile_id) do nothing
  returning profile_id into inserted_profile_id;

  if inserted_profile_id is null then
    return jsonb_build_object('duplicate', true, 'matched', false);
  end if;

  if p_action = 'like' and exists (
    select 1 from public.incoming_likes
    where user_id in (p_user_id, '*') and profile_id = p_profile_id
  ) then
    insert into public.matches (user_id, profile_id)
    values (p_user_id, p_profile_id)
    on conflict (user_id, profile_id) do nothing;
    is_mutual := true;
  end if;

  return jsonb_build_object('duplicate', false, 'matched', is_mutual);
end;
$$;

revoke all on function public.record_demo_swipe(text, text, text) from public, anon, authenticated;
grant execute on function public.record_demo_swipe(text, text, text) to service_role;
