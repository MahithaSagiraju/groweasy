export type CrmStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE'
  | '';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'
  | '';

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: { row: number; reason: string; data: Record<string, string> }[];
}

export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  batch: number;
  totalBatches: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  totalRows: number;
  columns: string[];
  preview: Record<string, string>[];
  metadata: {
    size: number;
    rows: number;
    columns: number;
    columnNames: string[];
  };
}
