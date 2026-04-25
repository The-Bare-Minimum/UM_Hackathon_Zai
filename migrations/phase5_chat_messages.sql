-- Phase 5: Chat Messages Table for AI Chatbot
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  context_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages"
ON chat_messages FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE INDEX IF NOT EXISTS idx_chat_messages_business_created 
ON chat_messages(business_id, created_at DESC);
