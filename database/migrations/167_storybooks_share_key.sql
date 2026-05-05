-- migration 167: storybooks.share_key — 공개 공유 링크용 단축 키
ALTER TABLE storybooks ADD COLUMN IF NOT EXISTS share_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_storybooks_share_key ON storybooks (share_key) WHERE share_key IS NOT NULL;
