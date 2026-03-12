-- DreamTown P0 Migration
-- Tables: users, wishes, star_seeds, stars, galaxies
-- + Seed data: galaxies 4개
-- Created: 2026-03-11

-- ENUM types
CREATE TYPE dt_gem_type AS ENUM ('ruby', 'sapphire', 'emerald', 'diamond', 'citrine');
CREATE TYPE dt_wish_status AS ENUM ('drafted', 'submitted', 'converted_to_star', 'archived');
CREATE TYPE dt_seed_state AS ENUM ('born', 'waiting_starlink', 'promoted');
CREATE TYPE dt_star_stage AS ENUM ('day1', 'day7', 'day30', 'day100', 'day365');

-- ① users
CREATE TABLE IF NOT EXISTS dt_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    TEXT,
  email       TEXT,
  provider    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ② wishes
CREATE TABLE IF NOT EXISTS dt_wishes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES dt_users(id),
  wish_text    TEXT NOT NULL,
  gem_type     dt_gem_type NOT NULL,
  yeosu_theme  TEXT,
  status       dt_wish_status NOT NULL DEFAULT 'submitted',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ③ galaxies (wishes보다 먼저 — star_seeds/stars가 FK로 참조)
CREATE TABLE IF NOT EXISTS dt_galaxies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  name_ko     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  direction   TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ④ star_seeds
CREATE TABLE IF NOT EXISTS dt_star_seeds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID NOT NULL REFERENCES dt_wishes(id),
  seed_name   TEXT,
  seed_state  dt_seed_state NOT NULL DEFAULT 'born',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑤ stars
CREATE TABLE IF NOT EXISTS dt_stars (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES dt_users(id),
  wish_id              UUID NOT NULL REFERENCES dt_wishes(id),
  star_seed_id         UUID NOT NULL REFERENCES dt_star_seeds(id),
  star_name            TEXT NOT NULL,
  star_slug            TEXT UNIQUE,
  galaxy_id            UUID NOT NULL REFERENCES dt_galaxies(id),
  constellation_id     UUID,  -- nullable, FK added in P1 (constellations table)
  birth_scene_version  TEXT NOT NULL DEFAULT 'v1',
  star_stage           dt_star_stage NOT NULL DEFAULT 'day1',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dt_wishes_user_id    ON dt_wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_stars_user_id     ON dt_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_stars_galaxy_id   ON dt_stars(galaxy_id);
CREATE INDEX IF NOT EXISTS idx_dt_star_seeds_wish_id ON dt_star_seeds(wish_id);

-- Seed: galaxies 4개
INSERT INTO dt_galaxies (code, name_ko, name_en, direction, sort_order) VALUES
  ('challenge',    '도전 은하',  'Challenge Galaxy',     'north', 1),
  ('growth',       '성장 은하',  'Growth Galaxy',        'east',  2),
  ('relationship', '관계 은하',  'Relationship Galaxy',  'west',  3),
  ('healing',      '치유 은하',  'Healing Galaxy',       'south', 4)
ON CONFLICT (code) DO NOTHING;
