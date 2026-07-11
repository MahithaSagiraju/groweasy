import { CrmRecord, ImportResult } from '../types';

const SYNONYMS: Record<string, string> = {
  name: 'name',
  'first name': 'name',
  'last name': 'name',
  'full name': 'name',
  'customer name': 'name',
  'lead name': 'name',
  'contact name': 'name',
  'contact person': 'name',
  email: 'email',
  'email address': 'email',
  'e-mail': 'email',
  'e mail': 'email',
  'email id': 'email',
  'email_id': 'email',
  mobile: 'mobile_without_country_code',
  phone: 'mobile_without_country_code',
  'phone number': 'mobile_without_country_code',
  'mobile number': 'mobile_without_country_code',
  'contact number': 'mobile_without_country_code',
  telephone: 'mobile_without_country_code',
  'country code': 'country_code',
  'country_code': 'country_code',
  'phone code': 'country_code',
  company: 'company',
  organization: 'company',
  'company name': 'company',
  firm: 'company',
  business: 'company',
  city: 'city',
  location: 'city',
  town: 'city',
  state: 'state',
  province: 'state',
  country: 'country',
  nation: 'country',
  lead_owner: 'lead_owner',
  'lead owner': 'lead_owner',
  'assigned to': 'lead_owner',
  owner: 'lead_owner',
  'sales person': 'lead_owner',
  status: 'crm_status',
  'lead status': 'crm_status',
  note: 'crm_note',
  notes: 'crm_note',
  comment: 'crm_note',
  comments: 'crm_note',
  remark: 'crm_note',
  remarks: 'crm_note',
  'crm note': 'crm_note',
  source: 'data_source',
  'lead source': 'data_source',
  'data source': 'data_source',
  campaign: 'data_source',
  'possession time': 'possession_time',
  'possession date': 'possession_time',
  possession: 'possession_time',
  budget: 'budget',
  'budget range': 'budget',
  'budget_range': 'budget',
  price: 'budget',
  'price range': 'budget',
  amount: 'budget',
  description: 'description',
  desc: 'description',
  remarks_: 'description',
};

function normalizeCol(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function extractFirstEmail(vals: string[]): string {
  const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  for (const v of vals) {
    const m = v.match(re);
    if (m) return m[0];
  }
  return '';
}

function extractFirstMobile(vals: string[]): string {
  const re = /\+?\d[\d\s\-()]{6,14}\d/;
  for (const v of vals) {
    const m = v.match(re);
    if (m) return m[0].replace(/[\s\-()]/g, '');
  }
  return '';
}

function hasEmailOrMobile(vals: string[]): boolean {
  const emailRe = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  const mobileRe = /\+?\d{7,15}/;
  const cleaned = vals.map((v) => v.replace(/[\s\-()]/g, ''));
  return vals.some((v) => emailRe.test(v)) || cleaned.some((v) => mobileRe.test(v));
}

export function mapRows(rows: Record<string, string>[]): ImportResult {
  const imported: CrmRecord[] = [];
  const skipped: { row: number; reason: string; data: Record<string, string> }[] = [];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Build column mapping
  const colMap = new Map<string, string[]>();
  const unmappedKeys: string[] = [];
  for (const h of headers) {
    const key = SYNONYMS[normalizeCol(h)];
    if (key) {
      if (!colMap.has(key)) colMap.set(key, []);
      colMap.get(key)!.push(h);
    } else {
      unmappedKeys.push(h);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const vals = Object.values(row).filter((v) => v && v.trim());
    if (!hasEmailOrMobile(vals)) {
      skipped.push({ row: i + 1, reason: 'No email or mobile found', data: row });
      continue;
    }

    const allVals = Object.entries(row)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`);

    let emailsInRow: string[] = [];
    let mobilesInRow: string[] = [];
    for (const v of vals) {
      const re = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
      const found = v.match(re);
      if (found) emailsInRow.push(...found);
    }
    for (const v of vals) {
      const cleaned = v.replace(/[\s\-()]/g, '');
      const m = cleaned.match(/\+?\d{7,15}/g);
      if (m) mobilesInRow.push(...m);
    }

    // Build CRM record
    const record: CrmRecord = {
      created_at: new Date().toISOString(),
      name: getFirst(row, colMap.get('name') || []),
      email: emailsInRow[0] || '',
      country_code: getFirst(row, colMap.get('country_code') || []),
      mobile_without_country_code: mobilesInRow[0] || '',
      company: getFirst(row, colMap.get('company') || []),
      city: getFirst(row, colMap.get('city') || []),
      state: getFirst(row, colMap.get('state') || []),
      country: getFirst(row, colMap.get('country') || []),
      lead_owner: getFirst(row, colMap.get('lead_owner') || []),
      crm_status: getEnum(row, colMap.get('crm_status') || [], ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE']),
      crm_note: '',
      data_source: getEnum(row, colMap.get('data_source') || [], ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots']),
      possession_time: getFirst(row, colMap.get('possession_time') || []),
      budget: getFirst(row, colMap.get('budget') || []),
      description: getFirst(row, colMap.get('description') || []),
    };

    // Append extras to crm_note
    const extras: string[] = [];
    if (emailsInRow.length > 1) {
      extras.push('Extra emails: ' + emailsInRow.slice(1).join(', '));
    }
    if (mobilesInRow.length > 1) {
      extras.push('Extra mobiles: ' + mobilesInRow.slice(1).join(', '));
    }
    for (const k of unmappedKeys) {
      if (row[k] && row[k].trim()) {
        extras.push(`${k}: ${row[k]}`);
      }
    }
    record.crm_note = extras.join(' | ');

    imported.push(record);
  }

  return { imported, skipped };
}

function getFirst(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k] && row[k].trim()) return row[k].trim();
  }
  return '';
}

function getEnum(row: Record<string, string>, keys: string[], valid: readonly string[]): any {
  const v = getFirst(row, keys);
  if (valid.includes(v as any)) return v;
  return '';
}
