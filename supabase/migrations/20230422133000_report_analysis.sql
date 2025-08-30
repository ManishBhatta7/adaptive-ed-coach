
-- Create a bucket for student documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for student documents
CREATE POLICY "Allow users to read their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'student-documents' AND (auth.uid() = SPLIT_PART(name, '_', 1)::uuid OR auth.uid() IS NULL));

CREATE POLICY "Allow users to upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'student-documents' AND auth.uid()::text = SPLIT_PART(name, '_', 1));

-- Create a table for storing report card analysis results
CREATE TABLE IF NOT EXISTS report_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_url TEXT NOT NULL,
  analysis_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for report_analyses
ALTER TABLE report_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report analyses" 
ON report_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report analyses" 
ON report_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Set up student_performance table for saving analyses to student profiles
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for student_performance
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance data" 
ON student_performance FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance data" 
ON student_performance FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX report_analyses_user_id_idx ON report_analyses(user_id);
CREATE INDEX student_performance_user_id_idx ON student_performance(user_id);
CREATE INDEX student_performance_type_idx ON student_performance(type);
