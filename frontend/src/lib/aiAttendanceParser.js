import { supabase } from './supabase';

export async function inferSheetSchema(headers, sampleRows) {
  try {
    const { data, error } = await supabase.functions.invoke('parse-attendance', {
      body: { 
        type: 'infer-schema',
        headers, 
        sampleRows 
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error inferring sheet schema via Edge Function:', error);
    // Fallback to a basic error message
    const msg = error?.message || 'Failed to infer schema via AI backend';
    throw new Error('AI Backend Error: ' + msg);
  }
}

export async function inferMissingDates(currentSchema, userContext) {
  try {
    const { data, error } = await supabase.functions.invoke('parse-attendance', {
      body: { 
        type: 'infer-dates',
        currentSchema, 
        userContext 
      }
    });

    if (error) throw error;
    
    return {
      usnColumn: currentSchema.usnColumn,
      nameColumn: currentSchema.nameColumn || null,
      dateColumns: data.dateColumns || currentSchema.dateColumns
    };
  } catch (error) {
    console.error('Error inferring missing dates via Edge Function:', error);
    const msg = error?.message || 'Failed to infer dates via AI backend';
    throw new Error('AI Backend Error: ' + msg);
  }
}

