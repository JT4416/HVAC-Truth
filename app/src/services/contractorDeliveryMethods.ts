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

export const CONTRACTOR_DELIVERY_METHOD_LABELS: Record<string, string> = {
  dashboard: 'HVAC Truth dashboard',
  verified_dashboard: 'HVAC Truth dashboard',
  email: 'Email',
  phone: 'Phone call',
  sms: 'Text / SMS',
  website_form: 'Website contact form'
};

function mapDeliveryMethod(row: any): ContractorDeliveryMethodRecord {
  const method = row.delivery_method || row.preferred_method;
  return {
    ...row,
    delivery_method: method,
    preferred_method: method
  };
}

async function getLegacyContractorDeliveryMethods(contractorId: string) {
  const { data, error } = await supabase
    .from('contractor_lead_preferences')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  return { data: (data || []).map(mapDeliveryMethod), error };
}

export async function getContractorDeliveryMethods(contractorId: string) {
  const { data, error } = await supabase
    .from('contractor_delivery_methods')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return getLegacyContractorDeliveryMethods(contractorId);
  }

  return { data: (data || []).map(mapDeliveryMethod), error };
}

export function formatContractorDeliveryMethod(value?: string | null) {
  return value ? CONTRACTOR_DELIVERY_METHOD_LABELS[value] ?? value : 'Unknown delivery method';
}

export function buildDeliveryMethodSummary(methods: ContractorDeliveryMethodRecord[]) {
  if (methods.length === 0) {
    return 'No contractor delivery methods have been saved yet.';
  }

  return methods
    .map((method) => formatContractorDeliveryMethod(method.delivery_method || method.preferred_method))
    .join(', ');
}
