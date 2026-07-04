import { supabase } from './supabase';

export type ContractorDeliveryMethodValue = 'dashboard' | 'email' | 'phone' | 'sms' | 'website_form';

export type ContractorDeliveryMethodRecord = {
  id: string;
  contractor_id: string;
  claim_id?: string | null;
  delivery_method: ContractorDeliveryMethodValue | string;
  preferred_method?: ContractorDeliveryMethodValue | string;
  destination?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ContractorDeliveryMethodReadSource = 'contractor_delivery_methods' | 'contractor_lead_preferences';

export type ContractorDeliveryMethodReadResult = {
  data: ContractorDeliveryMethodRecord[];
  error: unknown;
  source: ContractorDeliveryMethodReadSource;
};

export const CONTRACTOR_DELIVERY_METHOD_LABELS: Record<string, string> = {
  dashboard: 'HVAC Truth dashboard',
  verified_dashboard: 'HVAC Truth dashboard',
  email: 'Email',
  phone: 'Phone call',
  sms: 'Text / SMS',
  website_form: 'Website contact form'
};

export const CONTRACTOR_DELIVERY_METHOD_SOURCE_LABELS: Record<ContractorDeliveryMethodReadSource, string> = {
  contractor_delivery_methods: 'Current delivery-method table',
  contractor_lead_preferences: 'Legacy compatibility table'
};

export function mapContractorDeliveryMethod(row: any): ContractorDeliveryMethodRecord {
  const method = row.delivery_method || row.preferred_method;
  return {
    ...row,
    delivery_method: method,
    preferred_method: method
  };
}

export function buildContractorDeliveryMethodReadResult(
  rows: any[] | null | undefined,
  error: unknown,
  source: ContractorDeliveryMethodReadSource
): ContractorDeliveryMethodReadResult {
  return {
    data: (rows || []).map(mapContractorDeliveryMethod),
    error,
    source
  };
}

async function getLegacyContractorDeliveryMethods(contractorId: string): Promise<ContractorDeliveryMethodReadResult> {
  const { data, error } = await supabase
    .from('contractor_lead_preferences')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  return buildContractorDeliveryMethodReadResult(data, error, 'contractor_lead_preferences');
}

export async function getContractorDeliveryMethods(contractorId: string): Promise<ContractorDeliveryMethodReadResult> {
  const { data, error } = await supabase
    .from('contractor_delivery_methods')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return getLegacyContractorDeliveryMethods(contractorId);
  }

  return buildContractorDeliveryMethodReadResult(data, error, 'contractor_delivery_methods');
}

export function formatContractorDeliveryMethod(value?: string | null) {
  return value ? CONTRACTOR_DELIVERY_METHOD_LABELS[value] ?? value : 'Unknown delivery method';
}

export function formatContractorDeliveryMethodSource(source?: ContractorDeliveryMethodReadSource | null) {
  return source ? CONTRACTOR_DELIVERY_METHOD_SOURCE_LABELS[source] ?? source : 'Unknown delivery-method source';
}

export function buildDeliveryMethodSourceSummary(
  source: ContractorDeliveryMethodReadSource | null | undefined,
  count: number,
  hasErrorFallback = false
) {
  if (!source) {
    return 'Delivery-method source has not been checked yet.';
  }

  if (source === 'contractor_delivery_methods') {
    return count > 0
      ? `Reading ${count} active delivery method${count === 1 ? '' : 's'} from the current delivery-method table.`
      : 'Current delivery-method table is available, but no active delivery methods are saved yet.';
  }

  return hasErrorFallback
    ? 'Using legacy compatibility delivery rows because the current delivery-method table could not be read.'
    : 'Using legacy compatibility delivery rows.';
}

export function buildDeliveryMethodEmptyState(source?: ContractorDeliveryMethodReadSource | null) {
  if (source === 'contractor_delivery_methods') {
    return 'No active delivery methods are saved in the current delivery-method table yet. Claim approval should create these rows for verified contractors.';
  }

  if (source === 'contractor_lead_preferences') {
    return 'No active legacy compatibility delivery rows are available. Re-run claim approval validation or check contractor delivery setup.';
  }

  return 'No delivery methods have been created yet. Dashboard delivery should be added during claim verification.';
}

export function buildDeliveryMethodSummary(methods: ContractorDeliveryMethodRecord[]) {
  if (methods.length === 0) {
    return 'No contractor delivery methods have been saved yet.';
  }

  return methods
    .map((method) => formatContractorDeliveryMethod(method.delivery_method || method.preferred_method))
    .join(', ');
}
