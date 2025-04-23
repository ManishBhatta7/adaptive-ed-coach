
-- Create a bucket for student documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for student documents
CREATE POLICY IF NOT EXISTS "Allow users to read their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'student-documents' AND (auth.uid() = SPLIT_PART(name, '_', 1)::uuid OR auth.uid() IS NULL OR storage.is_admin()));

CREATE POLICY IF NOT EXISTS "Allow users to upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'student-documents' AND auth.uid()::text = SPLIT_PART(name, '_', 1));

CREATE POLICY IF NOT EXISTS "Allow users to delete their own documents" 
ON storage.objects FOR DELETE
USING (bucket_id = 'student-documents' AND auth.uid()::text = SPLIT_PART(name, '_', 1));

CREATE POLICY IF NOT EXISTS "Allow anon users to see student documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'student-documents');
