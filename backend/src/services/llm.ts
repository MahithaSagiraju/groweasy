import OpenAI from 'openai';
import { config } from '../utils/config';
import { logger } from '../utils/helpers';
import { ImportResult } from '../types';

let openai: OpenAI | null = null;

function getClient() {
  if (openai) return openai;
  if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY not set');
  openai = new OpenAI({ apiKey: config.openaiApiKey });
  logger.info('OpenAI client ready');
  return openai;
}

const prompt = `You convert CSV rows to CRM records. Given rows of data, map them to this schema:

created_at (ISO date), name, email (first only, rest to crm_note), country_code, mobile_without_country_code (first only, rest to crm_note), company, city, state, country, lead_owner, crm_status (GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE or blank), crm_note, data_source (leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank), possession_time, budget, description

Rules: use only those enum values. First email goes to email field, rest to crm_note. Same for mobile. Skip rows with no email or mobile. Infer from column synonyms (Full Name->name, Phone->mobile, etc). Never make up data. Return JSON: { "imported": [...], "skipped": [{ "row": N, "reason": "...", "data": {...} }] }`;

export async function mapBatchToCrm(
  batch: Record<string, string>[],
  batchIndex: number
): Promise<ImportResult> {
  const client = getClient();
  const body = JSON.stringify(batch, null, 2);

  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Batch ${batchIndex + 1}:\n${body}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const text = resp.choices[0]?.message?.content || '';
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.imported)) throw new Error('Missing imported array');
      if (!Array.isArray(parsed.skipped)) parsed.skipped = [];

      const base = batchIndex * config.batchSize;
      for (const s of parsed.skipped) {
        if (typeof s.row === 'number') s.row += base;
      }

      return parsed as ImportResult;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      logger.warn({ attempt, err: lastErr.message }, 'LLM call failed, retrying');
      if (attempt < config.maxRetries) {
        await new Promise((r) => setTimeout(r, config.retryDelayMs * attempt));
      }
    }
  }
  throw lastErr || new Error('LLM failed after retries');
}
