import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { headers, sampleRows, type } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    let prompt = ""

    if (type === 'infer-schema') {
      prompt = `
You are an expert data pipeline assistant analyzing a spreadsheet for a student attendance application.
Below are the headers and a sample of rows from a spreadsheet:

HEADERS:
${JSON.stringify(headers)}

SAMPLE ROWS:
${JSON.stringify(sampleRows, null, 2)}

Your task is to identify:
1. "usnColumn": Which column uniquely identifies the student (prefer USN/Roll Number/ID over Email or Name). Look for values like "4SF24CI005", "4SH24CS001" etc.
2. "nameColumn": Which column contains the student's full name (e.g. "name", "Name", "Student Name", "Full Name"). Can be null if not present.
3. "dateColumns": Which columns represent an attendance session (a day or session where attendance was marked).
   - Values in attendance columns are typically: true/false, 1/0, P/A, Present/Absent, or similar boolean-like values.
   - If a column header is a date string like "30/04/26", "29-04-2026", parse it as YYYY-MM-DD. Assume "26" means 2026, "25" means 2025.
   - If a column header is a number between 40000 and 60000, it is an Excel serial date.
   - If the header says "Day 1", "Day 2", etc., set needsInference to true and date to null.
   - Skip columns that are clearly NOT attendance: "name", "email", "usn", "admission_number", "branch_code", "Knowledge", "Skill", "Score", "Assessment", "n8n", "link", "SL NO", "Joined", "Pre", "Post", "Total".

Respond ONLY with a raw JSON object (no markdown, no \`\`\`json):
{
  "usnColumn": "string | null",
  "nameColumn": "string | null",
  "dateColumns": [
    {
      "header": "string",
      "date": "YYYY-MM-DD | null",
      "needsInference": boolean
    }
  ]
}
`
    } else if (type === 'infer-dates') {
      const { currentSchema, userContext } = await req.json()
      prompt = `
You are an AI assistant helping to map missing dates for an attendance spreadsheet.
The current schema has some columns missing explicit dates.
The user has provided the following context about when the classes take place:
"${userContext}"

Here is the current schema:
${JSON.stringify(currentSchema, null, 2)}

Based on the user's context, try to logically deduce the exact 'YYYY-MM-DD' dates for the columns where 'needsInference' is true. 

Respond ONLY with a raw JSON object (no markdown, no \`\`\`json):
{
  "dateColumns": [
    {
      "header": "string",
      "date": "YYYY-MM-DD",
      "needsInference": false
    }
  ]
}
`
    } else {
      throw new Error('Invalid request type')
    }

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
