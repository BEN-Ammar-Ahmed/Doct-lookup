create schema if not exists provider_data;
create table if not exists provider_data.providers (
  npi text primary key check (npi ~ '^[0-9]{10}$'),
  name text not null,
  zip text not null,
  state text not null,
  specialty text not null,
  payload jsonb not null,
  source_date date not null,
  imported_at timestamptz not null default now()
);
create index if not exists providers_zip_npi on provider_data.providers (zip, npi);
create index if not exists providers_name_prefix on provider_data.providers (lower(name) text_pattern_ops);
create index if not exists providers_name_search on provider_data.providers using gin (to_tsvector('simple', name));
create index if not exists providers_state on provider_data.providers (state);
create table if not exists provider_data.medicare (
  npi text primary key check (npi ~ '^[0-9]{10}$'),
  assignment text not null check (assignment in ('Y', 'M', '')),
  source_date date not null,
  imported_at timestamptz not null default now()
);
create table if not exists provider_data.locations (
  address_key text primary key,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  source_date date not null,
  quality text not null default 'census-address-match' check (quality = 'census-address-match')
);
create table if not exists provider_data.zcta (
  zip text primary key check (zip ~ '^[0-9]{5}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  source_date date not null
);
revoke all on schema provider_data from public;
revoke all on all tables in schema provider_data from public;
-- Grant USAGE on this schema and SELECT on these tables to a dedicated runtime
-- role. Use a separate ingestion role with INSERT/UPDATE, never a public API key.
