CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document ON public.document_chunks(document_id, chunk_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own document chunks"
ON public.document_chunks FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE public.documents ALTER COLUMN content SET DEFAULT '';