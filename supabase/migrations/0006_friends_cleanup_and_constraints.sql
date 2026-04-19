-- Cleanup existing invalid friend rows and enforce constraints.

-- 1) Remove self-friend rows.
delete from public.friends
where user_id = friend_user_id;

-- 2) Deduplicate: keep the earliest created row per (user_id, friend_user_id)
with ranked as (
  select
    friend_id,
    row_number() over (
      partition by user_id, friend_user_id
      order by created_at asc, friend_id asc
    ) as rn
  from public.friends
)
delete from public.friends f
using ranked r
where f.friend_id = r.friend_id
  and r.rn > 1;

-- 3) Enforce constraints going forward.
do $$
begin
  begin
    alter table public.friends
      add constraint friends_no_self check (user_id <> friend_user_id);
  exception
    when duplicate_object then
      null;
    when duplicate_table then
      null;
  end;

  begin
    alter table public.friends
      add constraint friends_user_friend_unique unique (user_id, friend_user_id);
  exception
    when duplicate_object then
      null;
    when duplicate_table then
      null;
  end;
end $$;
