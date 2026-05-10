import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiResponseSchema, type GeminiAnalysis } from './schemas'

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  return new GoogleGenerativeAI(key)
}

const ANALYSIS_PROMPT = `You are a personal note analyzer for a smart note-taking app. Analyze the user's note and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Return exactly this shape:
{
  "category": "personal|work|research|health|finance|learning",
  "note_type": "task|research|coding|debugging|journal|idea|meeting|learning|finance|reminder|planning",
  "project": "inferred project name as a short proper noun, or null if genuinely unclear",
  "summary": "1-2 sentence plain-english summary of the note",
  "keywords": ["3 to 7 most distinctive keywords or phrases"],
  "tasks": [{"text": "actionable task text", "due_date": "natural language date string or null"}],
  "importance_score": 0.0,
  "urgency_score": 0.0,
  "confidence": 0.0
}

Scoring guidance:
- importance_score: how significant is this note long-term? (0=trivial, 1=critical)
- urgency_score: how time-sensitive? (0=no deadline, 1=needs action today)
- confidence: how confident are you in this classification? (0=guessing, 1=certain)

Extract tasks ONLY if the note explicitly contains actionable items (verbs like "need to", "should", "email", "fix", "buy", "finish", etc.). Do not hallucinate tasks.`

export async function analyzeNote(content: string): Promise<GeminiAnalysis | null> {
  const client = getClient()
  if (!client) return null

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(`${ANALYSIS_PROMPT}\n\nNote: "${content}"`)
    const text = result.response.text().trim()

    // Strip markdown code fences if model adds them despite instructions
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)
    const validated = GeminiResponseSchema.safeParse(parsed)
    if (!validated.success) return null
    return validated.data
  } catch {
    return null
  }
}

export async function generateEmbedding(content: string): Promise<number[] | null> {
  const client = getClient()
  if (!client) return null

  try {
    const model = client.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(content)
    return result.embedding.values
  } catch {
    return null
  }
}
