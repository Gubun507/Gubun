-- Supabase Schema for Gubun
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT '🔧',
    link TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    engine TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT '📜',
    code TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads tracking table (enhanced with metadata)
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views tracking table (with deduplication)
CREATE TABLE IF NOT EXISTS views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_created ON tools(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scripts_engine ON scripts(engine);
CREATE INDEX IF NOT EXISTS idx_scripts_language ON scripts(language);
CREATE INDEX IF NOT EXISTS idx_scripts_featured ON scripts(featured);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_downloads_item ON downloads(item_id, type);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at);

CREATE INDEX IF NOT EXISTS idx_views_item_ip ON views(item_id, type, ip_hash);
CREATE INDEX IF NOT EXISTS idx_views_created ON views(created_at);

CREATE INDEX IF NOT EXISTS idx_likes_item ON likes(item_id, type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tools: Anyone can read, only authenticated can create/update (admin later)
CREATE POLICY "Tools are viewable by everyone" ON tools
    FOR SELECT USING (true);

CREATE POLICY "Tools can be created by authenticated users" ON tools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Scripts: Anyone can read
CREATE POLICY "Scripts are viewable by everyone" ON scripts
    FOR SELECT USING (true);

CREATE POLICY "Scripts can be created by authenticated users" ON scripts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Downloads: Users can view own, insert own
CREATE POLICY "Downloads are viewable by everyone" ON downloads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert downloads" ON downloads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR ip_hash IS NOT NULL);

-- Views: Insert only (with minimal validation)
CREATE POLICY "Views are viewable by everyone" ON views
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert views with valid ip" ON views
    FOR INSERT WITH CHECK (ip_hash IS NOT NULL AND length(ip_hash) > 0);

-- Likes: Users manage own likes
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for counts
CREATE OR REPLACE FUNCTION get_tool_stats(tool_uuid UUID)
RETURNS TABLE(downloads BIGINT, views BIGINT, likes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM downloads WHERE item_id = tool_uuid AND type = 'tool'),
        (SELECT COUNT(*) FROM views WHERE item_id = tool_uuid AND type = 'tool'),
        (SELECT COUNT(*) FROM likes WHERE item_id = tool_uuid AND type = 'tool');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_script_stats(script_uuid UUID)
RETURNS TABLE(downloads BIGINT, views BIGINT, likes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM downloads WHERE item_id = script_uuid AND type = 'script'),
        (SELECT COUNT(*) FROM views WHERE item_id = script_uuid AND type = 'script'),
        (SELECT COUNT(*) FROM likes WHERE item_id = script_uuid AND type = 'script');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Page views table (for analytics)
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    page_title TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    screen_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON page_views(created_at);

-- Enable RLS on page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Page views policies
CREATE POLICY "Page views are viewable by authenticated users only" ON page_views
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert page views with valid data" ON page_views
    FOR INSERT WITH CHECK (page_path IS NOT NULL AND length(page_path) > 0);

-- Post ratings table (stars for blog posts)
CREATE TABLE IF NOT EXISTS post_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_ratings_post ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user ON post_ratings(user_id);

ALTER TABLE post_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post ratings are viewable by everyone" ON post_ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate posts" ON post_ratings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON post_ratings
    FOR UPDATE USING (user_id = auth.uid());

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at DESC);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post comments are viewable by everyone" ON post_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON post_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (user_id = auth.uid());

-- Function to get post stats (avg rating and comment count)
CREATE OR REPLACE FUNCTION get_post_stats(post_id_param TEXT)
RETURNS TABLE(avg_rating NUMERIC, rating_count BIGINT, comment_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT ROUND(AVG(rating), 1) FROM post_ratings WHERE post_id = post_id_param), 0),
        (SELECT COUNT(*) FROM post_ratings WHERE post_id = post_id_param),
        (SELECT COUNT(*) FROM post_comments WHERE post_id = post_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
