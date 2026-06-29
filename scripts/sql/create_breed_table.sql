CREATE TABLE IF NOT EXISTS breed (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cat', 'dog')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    alt TEXT,
    meta_description TEXT,
    list_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    list_image TEXT,
    list_image_url TEXT,
    detail_image TEXT,
    detail_image_url TEXT,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    upkeep JSONB NOT NULL DEFAULT '{}'::jsonb,
    introduction TEXT,
    helpful_info JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT breed_type_slug_unique UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS idx_breed_type ON breed (type);
CREATE INDEX IF NOT EXISTS idx_breed_slug ON breed (slug);
CREATE INDEX IF NOT EXISTS idx_breed_name ON breed (name);
