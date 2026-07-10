import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const crmStatusValues = [
  'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE', '',
] as const;

const dataSourceValues = [
  'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', '',
] as const;

const CrmRecordSchema = z.object({
  created_at: z.string(),
  name: z.string(),
  email: z.string(),
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: z.enum(crmStatusValues),
  crm_note: z.string(),
  data_source: z.enum(dataSourceValues),
  possession_time: z.string(),
  description: z.string(),
});

describe('CrmRecordSchema', () => {
  it('should validate a correct CRM record', () => {
    const record = {
      created_at: '2024-01-15T10:00:00.000Z',
      name: 'John Doe',
      email: 'john@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: 'Acme Corp',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lead_owner: '',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: '',
      data_source: 'leads_on_demand',
      possession_time: '',
      description: '',
    };
    const result = CrmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it('should reject invalid crm_status', () => {
    const record = {
      created_at: '2024-01-15T10:00:00.000Z',
      name: 'John Doe',
      email: 'john@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: 'Acme Corp',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lead_owner: '',
      crm_status: 'INVALID_STATUS',
      crm_note: '',
      data_source: '',
      possession_time: '',
      description: '',
    };
    const result = CrmRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject invalid data_source', () => {
    const record = {
      created_at: '2024-01-15T10:00:00.000Z',
      name: 'John Doe',
      email: 'john@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: 'Acme Corp',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lead_owner: '',
      crm_status: '',
      crm_note: '',
      data_source: 'invalid_source',
      possession_time: '',
      description: '',
    };
    const result = CrmRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should allow empty strings for all fields', () => {
    const record = {
      created_at: '',
      name: '',
      email: '',
      country_code: '',
      mobile_without_country_code: '',
      company: '',
      city: '',
      state: '',
      country: '',
      lead_owner: '',
      crm_status: '',
      crm_note: '',
      data_source: '',
      possession_time: '',
      description: '',
    };
    const result = CrmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });
});
