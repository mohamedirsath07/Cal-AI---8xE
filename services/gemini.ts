/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CalAI — Gemini Vision Service
 *
 *  Uses the Gemini 2.5 Flash REST API to analyse food images and return
 *  structured nutrition data.
 *
 *  Setup:
 *    Add your API key to `.env`:
 *      EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
 *
 *    Get a key at: https://aistudio.google.com/apikey
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as FileSystem from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Structured nutrition data returned by Gemini. */
export interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

/** Wrapper that every public method returns. */
export interface GeminiResponse {
  success: boolean;
  data: FoodAnalysisResult | null;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ANALYSIS_PROMPT = `You are a professional nutritionist and food recognition expert.

Analyze this food image carefully.

Rules:
- Identify the food item(s) in the image as accurately as possible.
- Estimate the portion size visually.
- Return realistic, evidence-based nutritional values for the visible portion.
- confidence is a float between 0 and 1 indicating how certain you are about the identification.
- If the image does not contain food, set food_name to "Not Food" with all values as 0 and confidence as 0.

Return ONLY valid JSON — no markdown fences, no extra text, no explanation.

{
  "food_name": "",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "confidence": 0
}`;

const REQUEST_TIMEOUT_MS = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the API key from environment variables.
 * Expo exposes EXPO_PUBLIC_* vars at build time via `process.env`.
 */
function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is not set. ' +
        'Add it to your .env file and restart the dev server.'
    );
  }
  return key.trim();
}

/**
 * Read a local file URI and return its base64 representation.
 * Works with both `file://` URIs (camera captures) and content URIs (gallery picks).
 */
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (err) {
    throw new Error(
      `Failed to read image at "${uri}". ` +
        `Make sure the file exists and the app has permission to read it.`
    );
  }
}

/**
 * Infer the MIME type from a URI's extension.
 * Falls back to `image/jpeg` which Gemini handles fine for most photos.
 */
function inferMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Extract the JSON object from Gemini's text response.
 * Handles cases where the model wraps the JSON in markdown fences
 * or adds explanatory text around it.
 */
function extractJson(raw: string): Record<string, unknown> | null {
  // 1. Strip markdown code fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  // 2. Try a direct parse first (ideal case)
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  // 3. Regex: find the first { … } block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Validate and coerce the parsed object into a strict `FoodAnalysisResult`.
 * Returns `null` if the shape is unrecoverable.
 */
function validateResult(obj: Record<string, unknown>): FoodAnalysisResult | null {
  const name = typeof obj.food_name === 'string' ? obj.food_name.trim() : '';
  if (name.length === 0) return null;

  const toNum = (v: unknown, fallback = 0): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : fallback;
  };

  return {
    food_name: name,
    calories: Math.round(toNum(obj.calories)),
    protein: toNum(obj.protein),
    carbs: toNum(obj.carbs),
    fat: toNum(obj.fat),
    confidence: Math.min(Math.max(toNum(obj.confidence), 0), 1),
  };
}

/**
 * Fetch with a timeout. `AbortController` is available in RN ≥0.60.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse a food image via Gemini 2.5 Flash.
 *
 * @param imageUri  Local file URI (from camera or gallery).
 * @returns         A `GeminiResponse` with the parsed nutrition data on success.
 *
 * @example
 * ```ts
 * import { analyzeFood } from '@/services/gemini';
 *
 * const result = await analyzeFood(photo.uri);
 * if (result.success && result.data) {
 *   console.log(result.data.food_name, result.data.calories);
 * }
 * ```
 */
export async function analyzeFood(imageUri: string): Promise<GeminiResponse> {
  try {
    // ── 1. Validate input ──
    if (!imageUri || imageUri.trim().length === 0) {
      return { success: false, data: null, error: 'No image URI provided.' };
    }

    // ── 2. Get API key ──
    const apiKey = getApiKey();

    // ── 3. Convert image → base64 ──
    const base64Data = await imageUriToBase64(imageUri);
    const mimeType = inferMimeType(imageUri);

    // ── 4. Build Gemini request body ──
    const requestBody = {
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 512,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    // ── 5. Call Gemini API ──
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      REQUEST_TIMEOUT_MS
    );

    // ── 6. Handle HTTP errors ──
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const status = response.status;

      if (status === 400) {
        return { success: false, data: null, error: 'Invalid request. The image may be corrupted or too large.' };
      }
      if (status === 401 || status === 403) {
        return { success: false, data: null, error: 'Invalid API key. Check EXPO_PUBLIC_GEMINI_API_KEY in your .env file.' };
      }
      if (status === 429) {
        return { success: false, data: null, error: 'Rate limit exceeded. Please wait a moment and try again.' };
      }
      if (status >= 500) {
        return { success: false, data: null, error: 'Gemini servers are temporarily unavailable. Please try again later.' };
      }

      return {
        success: false,
        data: null,
        error: `Gemini API error (${status}): ${errorBody.slice(0, 200)}`,
      };
    }

    // ── 7. Parse API response ──
    const json = await response.json();

    const textContent: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      // Check for safety block
      const blockReason = json?.candidates?.[0]?.finishReason;
      if (blockReason === 'SAFETY') {
        return { success: false, data: null, error: 'The image was blocked by safety filters. Try a different photo.' };
      }
      return { success: false, data: null, error: 'Gemini returned an empty response. Try a clearer photo.' };
    }

    // ── 8. Extract & validate JSON ──
    const parsed = extractJson(textContent);
    if (!parsed) {
      return {
        success: false,
        data: null,
        error: 'Could not parse nutrition data from Gemini response.',
      };
    }

    const result = validateResult(parsed);
    if (!result) {
      return {
        success: false,
        data: null,
        error: 'Gemini returned incomplete nutrition data. Try a different photo.',
      };
    }

    // ── 9. Return success ──
    return { success: true, data: result, error: null };
  } catch (err: unknown) {
    // ── Error handling ──
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, data: null, error: 'Request timed out. Check your internet connection.' };
      }
      return { success: false, data: null, error: err.message };
    }
    return { success: false, data: null, error: 'An unexpected error occurred during food analysis.' };
  }
}

/**
 * Quick connectivity check — validates the API key against Gemini.
 * Useful for settings screens or onboarding flows.
 */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${apiKey}`;

    const res = await fetchWithTimeout(url, { method: 'GET' }, 10_000);

    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Invalid API key.' };
    }
    return { ok: false, error: `Unexpected status: ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Connection failed.' };
  }
}
