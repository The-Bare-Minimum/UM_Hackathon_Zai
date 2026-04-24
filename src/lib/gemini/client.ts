import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMMA_MODEL = 'gemma-4-26b-a4b-it' // Using Gemma 4 26B with unlimited TPM

export interface GeminiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GeminiOptions {
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

/**
 * Extract system instructions from messages array
 */
function extractSystemInstruction(messages: GeminiMessage[]): string {
  const systemMessages = messages.filter((msg) => msg.role === 'system')
  return systemMessages.map((msg) => msg.content).join('\n')
}

/**
 * Convert messages to Gemini Content format
 */
function convertToGeminiFormat(messages: GeminiMessage[]) {
  // Filter out system messages (handled separately)
  const nonSystemMessages = messages.filter((msg) => msg.role !== 'system')

  return nonSystemMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))
}

/**
 * Generate text completions using Gemma API
 */
export async function callGemini(
  messages: GeminiMessage[],
  options: GeminiOptions = {}
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  // Extract system instruction
  const systemInstruction = extractSystemInstruction(messages)

  // Convert messages to Gemini format
  const contents = convertToGeminiFormat(messages)

  // Handle empty messages array
  if (contents.length === 0) {
    throw new Error('No user or assistant messages provided')
  }

  // Apply default values and map max_tokens to maxOutputTokens
  const generationConfig = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.max_tokens ?? 1000,
  }

  try {
    const config: any = {
      generationConfig,
    }

    // Add system instruction if present
    if (systemInstruction) {
      config.systemInstruction = systemInstruction
    }

    const response = await ai.models.generateContent({
      model: GEMMA_MODEL,
      contents,
      config,
    })

    // Check if response has text
    if (!response.text) {
      throw new Error('Gemma API returned empty text content')
    }

    return response.text
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemma API error: ${error.message}`)
    }
    throw new Error('Gemma API error: Unknown error occurred')
  }
}

/**
 * Generate text responses based on image and text input (vision task)
 */
export async function callGeminiWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  // Validate MIME type
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(mimeType)) {
    throw new Error(
      `Unsupported image format: ${mimeType}. Supported: ${supportedTypes.join(', ')}`
    )
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  try {
    // Create multimodal content with text and image
    const response = await ai.models.generateContent({
      model: GEMMA_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    })

    // Check if response has text
    if (!response.text) {
      throw new Error('Gemma API returned empty text content')
    }

    return response.text
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemma API error: ${error.message}`)
    }
    throw new Error('Gemma API error: Unknown error occurred')
  }
}
