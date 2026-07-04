import {
  buildContractorDeliveryMethodReadResult,
  buildDeliveryMethodSummary,
  ContractorDeliveryMethodRecord
} from './contractorDeliveryMethods';

function assertFixture(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runContractorDeliveryMethodReadPreferenceFixture() {
  const newTableRows = [
    {
      id: 'new-dashboard-route',
      contractor_id: 'contractor-1',
      claim_id: 'claim-1',
      delivery_method: 'dashboard',
      destination: null,
      active: true
    },
    {
      id: 'new-email-route',
      contractor_id: 'contractor-1',
      claim_id: 'claim-1',
      delivery_method: 'email',
      destination: 'dispatch@example.com',
      active: true
    }
  ];

  const legacyRows = [
    {
      id: 'legacy-email-route',
      contractor_id: 'contractor-1',
      claim_id: 'claim-1',
      preferred_method: 'email',
      destination: 'legacy@example.com',
      active: true
    }
  ];

  const preferredResult = buildContractorDeliveryMethodReadResult(
    newTableRows,
    null,
    'contractor_delivery_methods'
  );

  assertFixture(
    preferredResult.source === 'contractor_delivery_methods',
    'Expected app read result to prefer contractor_delivery_methods.'
  );

  assertFixture(
    preferredResult.data.length === 2,
    `Expected 2 preferred delivery rows, found ${preferredResult.data.length}.`
  );

  assertFixture(
    preferredResult.data.every((row: ContractorDeliveryMethodRecord) => row.delivery_method === row.preferred_method),
    'Expected normalized delivery_method and preferred_method aliases to match for preferred rows.'
  );

  const legacyFallbackResult = buildContractorDeliveryMethodReadResult(
    legacyRows,
    null,
    'contractor_lead_preferences'
  );

  assertFixture(
    legacyFallbackResult.source === 'contractor_lead_preferences',
    'Expected fallback read result to identify contractor_lead_preferences as the source.'
  );

  assertFixture(
    legacyFallbackResult.data[0].delivery_method === 'email',
    'Expected fallback legacy preferred_method to normalize into delivery_method.'
  );

  const summary = buildDeliveryMethodSummary(preferredResult.data);
  assertFixture(
    summary === 'HVAC Truth dashboard, Email',
    `Unexpected delivery method summary: ${summary}`
  );

  return {
    preferredSource: preferredResult.source,
    fallbackSource: legacyFallbackResult.source,
    preferredCount: preferredResult.data.length,
    fallbackCount: legacyFallbackResult.data.length,
    summary
  };
}

export const contractorDeliveryMethodReadPreferenceFixtureResult = runContractorDeliveryMethodReadPreferenceFixture();
