import { genAI } from './gemini';

const TARGET_FIELDS = [
  { key: 'name', label: 'Student Name', required: true },
  { key: 'usn', label: 'USN / ID', required: true },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'branch_code', label: 'Branch Code', required: true },
  { key: 'batch', label: 'Batch/Year', required: false },
  { key: 'admission_number', label: 'Admission No.', required: false }
];

/**
 * Uses Gemini to suggest a mapping between CSV headers and target database fields.
 * @param {string[]} csvHeaders 
 * @returns {Promise<Object>} Mapping object { csvHeader: targetKey }
 */
export async function suggestMapping(csvHeaders) {
  if (!genAI) {
    console.error("Gemini AI not initialized");
    return {};
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `
      You are a data engineering assistant. I have a CSV file with the following headers:
      [${csvHeaders.join(', ')}]

      I need to map these headers to the following database fields:
      ${TARGET_FIELDS.map(f => `- ${f.key} (${f.label})${f.required ? ' [REQUIRED]' : ''}`).join('\n')}

      Please provide a JSON mapping where the key is the database field key and the value is the most likely CSV header match. 
      Only include fields you are confident about. Return ONLY the JSON object.
      
      Example:
      {"name": "Full Name", "usn": "University Serial Number"}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (err) {
    console.error("AI Mapping failed:", err);
    return {};
  }
}

export { TARGET_FIELDS };
