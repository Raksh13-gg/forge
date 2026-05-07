import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function inferSheetSchema(headers, sampleRows) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const prompt = `
You are an expert data pipeline assistant analyzing a spreadsheet for a student attendance application.
Below are the headers and a sample of rows from a spreadsheet:

HEADERS:
${JSON.stringify(headers)}

SAMPLE ROWS:
${JSON.stringify(sampleRows, null, 2)}

Your task is to identify:
1. Which column uniquely identifies the student (prefer USN/Roll Number over Email or Name).
2. Which columns represent an attendance session (a day or session where attendance was marked). 
   - Some attendance columns might have clear dates (e.g., "7 May"). If so, extract the date as YYYY-MM-DD (assume current year if missing).
   - Some attendance columns might just say "Attendance", "Day 1", etc. For these, set "needsInference" to true and "date" to null.

Respond ONLY with a raw JSON object matching this schema (do not wrap in markdown blocks like \`\`\`json):
{
  "usnColumn": "string | null",
  "dateColumns": [
    {
      "header": "string",
      "date": "YYYY-MM-DD | null",
      "needsInference": boolean
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error inferring sheet schema:', error);
    const msg = error?.message || JSON.stringify(error);
    throw new Error('AI Error: ' + msg);
  }
}

export async function inferMissingDates(currentSchema, userContext) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const prompt = `
You are an AI assistant helping to map missing dates for an attendance spreadsheet.
The current schema has some columns missing explicit dates.
The user has provided the following context about when the classes take place:
"${userContext}"

Here is the current schema:
${JSON.stringify(currentSchema, null, 2)}

Based on the user's context, try to logically deduce the exact 'YYYY-MM-DD' dates for the columns where 'needsInference' is true. 
Usually, columns are sequential. For example, if Day 1 is missing, and the user says "Classes started May 1st and happen every Tuesday and Thursday", you must map Day 1 to the first matching date, Day 2 to the next, etc. Assume the year is the current year unless specified.

Respond ONLY with a raw JSON object containing the updated "dateColumns" array (do not wrap in markdown blocks like \`\`\`json):
{
  "dateColumns": [
    {
      "header": "string",
      "date": "YYYY-MM-DD",
      "needsInference": false
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const updated = JSON.parse(cleanedText);
    
    return {
      usnColumn: currentSchema.usnColumn,
      dateColumns: updated.dateColumns || currentSchema.dateColumns
    };
  } catch (error) {
    console.error('Error inferring missing dates:', error);
    const msg = error?.message || JSON.stringify(error);
    throw new Error('AI Error: ' + msg);
  }
}
