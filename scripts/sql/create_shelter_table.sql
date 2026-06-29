CREATE TABLE IF NOT EXISTS shelter (
    id BIGINT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    street TEXT NOT NULL DEFAULT '',
    address_city TEXT NOT NULL DEFAULT '',
    state_code CHAR(2) NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    state_slug TEXT NOT NULL,
    state_name TEXT NOT NULL,
    city_slug TEXT NOT NULL,
    city_name TEXT NOT NULL,
    city_label TEXT NOT NULL DEFAULT '',
    source_city_url TEXT NOT NULL DEFAULT '',
    fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelter_state_slug ON shelter (state_slug);
CREATE INDEX IF NOT EXISTS idx_shelter_city_slug ON shelter (state_slug, city_slug);
CREATE INDEX IF NOT EXISTS idx_shelter_state_code ON shelter (state_code);
CREATE INDEX IF NOT EXISTS idx_shelter_name ON shelter (name);
