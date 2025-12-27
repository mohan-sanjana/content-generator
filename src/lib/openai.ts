import OpenAI from 'openai';
import { z, ZodError } from 'zod';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Call OpenAI with retry and JSON parsing
 */
export async function callOpenAIWithRetry<T>(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  schema: z.ZodSchema<T>,
  maxRetries: number = 3,
  temperature: number = 0.7
): Promise<T> {
  // Use environment variable or fall back to current stable models
  // Options: gpt-4-turbo, gpt-4o, gpt-4, gpt-3.5-turbo
  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo';
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      // Log the parsed response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('[OpenAI] Parsed response:', JSON.stringify(parsed, null, 2));
      }
      
      try {
        const validated = schema.parse(parsed);
        return validated;
      } catch (validationError) {
        // Provide more detailed error information
        if (validationError instanceof ZodError) {
          const errorDetails = validationError.errors.map(e => {
            const path = e.path.join('.');
            return `${path}: ${e.message} (expected ${e.code === 'invalid_type' ? e.expected : 'valid'} but got ${e.code === 'invalid_type' ? e.received : 'invalid'})`;
          }).join('; ');
          
          console.error(`[OpenAI] Validation failed on attempt ${attempt + 1}/${maxRetries}`);
          console.error(`[OpenAI] Error details: ${errorDetails}`);
          console.error('[OpenAI] Full validation errors:', JSON.stringify(validationError.errors, null, 2));
          console.error('[OpenAI] Received response structure:', JSON.stringify(parsed, null, 2));
          
          // If this is the last attempt, throw a more helpful error
          if (attempt === maxRetries - 1) {
            const userFriendlyError = `AI response format error: ${errorDetails}. The AI may have returned an incomplete or incorrectly formatted response.`;
            throw new Error(userFriendlyError);
          }
        }
        throw validationError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI] Retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

