-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create novel_genres junction table
CREATE TABLE IF NOT EXISTS novel_genres (
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (novel_id, genre_id)
);

-- Create novel_tags junction table
CREATE TABLE IF NOT EXISTS novel_tags (
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (novel_id, tag_id)
);

-- Insert some default genres
INSERT INTO genres (name) VALUES
    ('Fantasy'),
    ('Science Fiction'),
    ('Romance'),
    ('Mystery'),
    ('Horror'),
    ('Thriller'),
    ('Adventure'),
    ('Drama'),
    ('Historical'),
    ('Comedy'),
    ('Action'),
    ('Slice of Life')
ON CONFLICT (name) DO NOTHING;

-- Insert some default tags
INSERT INTO tags (name) VALUES
    ('Magic'),
    ('School Life'),
    ('Isekai'),
    ('Time Travel'),
    ('Military'),
    ('Politics'),
    ('Martial Arts'),
    ('Supernatural'),
    ('Mystery'),
    ('Comedy'),
    ('Drama'),
    ('Action'),
    ('Romance'),
    ('Horror'),
    ('Psychological'),
    ('Sports'),
    ('Music'),
    ('Food'),
    ('Adventure'),
    ('Slice of Life')
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies for genres
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Genres are viewable by everyone" ON genres
    FOR SELECT
    USING (true);

-- Create RLS policies for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT
    USING (true);

-- Create RLS policies for novel_genres
ALTER TABLE novel_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Novel genres are viewable by everyone" ON novel_genres
    FOR SELECT
    USING (true);
CREATE POLICY "Novel genres can be inserted by novel authors" ON novel_genres
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM novels
            WHERE novels.id = novel_id
            AND novels.author_id = auth.uid()
        )
    );
CREATE POLICY "Novel genres can be deleted by novel authors" ON novel_genres
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM novels
            WHERE novels.id = novel_id
            AND novels.author_id = auth.uid()
        )
    );

-- Create RLS policies for novel_tags
ALTER TABLE novel_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Novel tags are viewable by everyone" ON novel_tags
    FOR SELECT
    USING (true);
CREATE POLICY "Novel tags can be inserted by novel authors" ON novel_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM novels
            WHERE novels.id = novel_id
            AND novels.author_id = auth.uid()
        )
    );
CREATE POLICY "Novel tags can be deleted by novel authors" ON novel_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM novels
            WHERE novels.id = novel_id
            AND novels.author_id = auth.uid()
        )
    );