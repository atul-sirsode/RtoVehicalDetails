export interface RCApiResponse {
  reference_id: number;
  statuscode: number;
  message: string;
  status: boolean;
  data: RCData;
}

export interface RCData {
  rc_number: string;
  fit_up_to: string;
  registration_date: string;
  owner_name: string;
  father_name: string;
  present_address: string;
  permanent_address: string;
  mobile_number: string;
  vehicle_category: string;
  vehicle_chasi_number: string;
  vehicle_engine_number: string;
  maker_description: string;
  maker_model: string;
  body_type: string;
  fuel_type: string;
  color: string;
  norms_type: string;
  financer: string;
  financed: string;
  insurance_company: string;
  insurance_policy_number: string;
  insurance_upto: string;
  manufacturing_date: string;
  manufacturing_date_formatted: string;
  registered_at: string;
  latest_by: string;
  less_info: boolean;
  tax_upto: string;
  tax_paid_upto: string;
  cubic_capacity: string;
  vehicle_gross_weight: string;
  no_cylinders: string;
  seat_capacity: string;
  sleeper_capacity: string;
  standing_capacity: string;
  wheelbase: string;
  unladen_weight: string;
  vehicle_category_description: string;
  pucc_number: string;
  pucc_upto: string;
  permit_number: string;
  permit_issue_date: string;
  permit_valid_from: string;
  permit_valid_upto: string;
  permit_type: string;
  national_permit_number: string;
  national_permit_issue_date: string;
  national_permit_upto: string;
  national_permit_issued_by: string;
  non_use_status: string;
  non_use_from: string;
  non_use_to: string;
  blacklist_status: string;
  noc_details: string;
  owner_number: string;
  rc_status: string;
  masked_name: boolean;
  challan_details: null | unknown;
  variant: string;
}

export interface RCTableRow {
  id: string;
  rc_number: string;
  owner_name: string;
  address: string;
  vehicle_category: string;
  vehicle_chasi_number: string;
  vehicle_engine_number: string;
  maker_description: string;
  maker_model: string;
  body_type: string;
  fuel_type: string;
  norms_type: string;
  financed: boolean;
  insurance_company: string;
  insurance_policy_number: string;
  insurance_upto: string;
  manufacturing_date_formatted: string;
  registered_at: string;
  latest_by: string;
  tax_upto: string;
  cubic_capacity: string;
  vehicle_gross_weight: string;
  no_cylinders: string;
  seat_capacity: string;
  unladen_weight: string;
  vehicle_category_description: string;
  pucc_number: string;
  pucc_upto: string;
  permit_number: string;
  permit_valid_upto: string;
  permit_type: string;
  owner_number: string;
  rc_status: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export interface ImportedRecord {
  rc_number: string;
  [key: string]: unknown;
}

export const TABLE_COLUMNS = [
  { key: 'rc_number', label: 'RC Number' },
  { key: 'owner_name', label: 'Owner Name' },
  { key: 'address', label: 'Address' },
  { key: 'vehicle_category', label: 'Vehicle Category' },
  { key: 'vehicle_chasi_number', label: 'Chassis Number' },
  { key: 'vehicle_engine_number', label: 'Engine Number' },
  { key: 'maker_description', label: 'Maker' },
  { key: 'maker_model', label: 'Model' },
  { key: 'body_type', label: 'Body Type' },
  { key: 'fuel_type', label: 'Fuel Type' },
  { key: 'norms_type', label: 'Emission Norms' },
  { key: 'financed', label: 'Financed' },
  { key: 'insurance_company', label: 'Insurance Company' },
  { key: 'insurance_policy_number', label: 'Policy Number' },
  { key: 'insurance_upto', label: 'Insurance Valid Till' },
  { key: 'manufacturing_date_formatted', label: 'Manufacturing Date' },
  { key: 'registered_at', label: 'Registered At' },
  { key: 'latest_by', label: 'Latest By' },
  { key: 'tax_upto', label: 'Tax Valid Till' },
  { key: 'cubic_capacity', label: 'CC' },
  { key: 'vehicle_gross_weight', label: 'Gross Weight' },
  { key: 'no_cylinders', label: 'Cylinders' },
  { key: 'seat_capacity', label: 'Seats' },
  { key: 'unladen_weight', label: 'Unladen Weight' },
  { key: 'vehicle_category_description', label: 'Category Description' },
  { key: 'pucc_number', label: 'PUCC Number' },
  { key: 'pucc_upto', label: 'PUCC Valid Till' },
  { key: 'permit_number', label: 'Permit Number' },
  { key: 'permit_valid_upto', label: 'Permit Valid Till' },
  { key: 'permit_type', label: 'Permit Type' },
  { key: 'owner_number', label: 'Owner Number' },
  { key: 'rc_status', label: 'RC Status' },
  { key: 'status', label: 'Verification Status' },
] as const;

export type TableColumnKey = typeof TABLE_COLUMNS[number]['key'];
