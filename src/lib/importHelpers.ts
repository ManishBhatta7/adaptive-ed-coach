import { supabase } from '@/integrations/supabase/client';

export const checkImportStatus = async (importId: string) => {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) {
      throw error;
    }

    return {
      status: data.status,
      progress: data.progress || 0,
      error: data.error_details
    };
  } catch (error) {
    console.error('Error checking import status:', error);
    return {
      status: 'failed',
      progress: 0,
      error: error.message
    };
  }
};

export const processVideoImport = async (videoData: any) => {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: videoData
      })
      .eq('id', videoData.id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error processing video import:', error);
    throw error;
  }
};