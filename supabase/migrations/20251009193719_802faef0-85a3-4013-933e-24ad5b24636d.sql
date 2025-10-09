-- Create profiles table for user data
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Trigger function on user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create medical_reports table for storing report data
create table public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  report_name text not null,
  extracted_text text,
  summary text,
  report_data jsonb,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on medical_reports
alter table public.medical_reports enable row level security;

-- Create policies for medical_reports
create policy "Users can view their own reports"
  on public.medical_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.medical_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.medical_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.medical_reports for delete
  using (auth.uid() = user_id);