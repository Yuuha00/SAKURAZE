-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  coins integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  is_admin boolean DEFAULT false NOT NULL
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create novels table
CREATE TABLE IF NOT EXISTS novels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  cover_image text,
  status text NOT NULL CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  views integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create novel_genres junction table
CREATE TABLE IF NOT EXISTS novel_genres (
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  genre_id uuid REFERENCES genres(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (novel_id, genre_id)
);

-- Create novel_tags junction table
CREATE TABLE IF NOT EXISTS novel_tags (
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (novel_id, tag_id)
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  chapter_number integer NOT NULL,
  content text NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  coin_cost integer DEFAULT 0 NOT NULL,
  views integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (novel_id, chapter_number)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, novel_id)
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, novel_id)
);

-- Create reading_history table
CREATE TABLE IF NOT EXISTS reading_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  last_read timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, novel_id, chapter_id)
);

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund')),
  description text,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert initial genres
INSERT INTO genres (name) VALUES
  ('Action'),
  ('Adventure'),
  ('Comedy'),
  ('Drama'),
  ('Fantasy'),
  ('Horror'),
  ('Mystery'),
  ('Romance'),
  ('Sci-Fi'),
  ('Slice of Life'),
  ('Supernatural'),
  ('Thriller')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_novels_updated_at
  BEFORE UPDATE ON novels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();