import { GoogleGenerativeAI } from '@google/generative-ai'

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY

let genAI = null
if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey)
} else {
  console.warn("Gemini API Key is missing from environment variables.")
}

export { genAI }
