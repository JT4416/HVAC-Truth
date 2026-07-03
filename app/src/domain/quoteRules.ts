export type QuoteInput = {
  repairType: string;
  quotedTotal: number;
  systemAgeYears?: number;
  afterHours?: boolean;
  includesWarranty?: boolean;
  zipCode?: string;
};

export type QuoteAssessment = {
  band: 'low' | 'fair' | 'high' | 'needs-review';
  title: string;
  explanation: string;
  questionsToAsk: string[];
  redFlags: string[];
};

const baselineRanges: Record<string, { low: number; high: number; label: string }> = {
  capacitor: { low: 150, high: 450, label: 'Capacitor replacement' },
  contactor: { low: 175, high: 500, label: 'Contactor replacement' },
  thermostat: { low: 150, high: 650, label: 'Thermostat replacement' },
  drain: { low: 125, high: 425, label: 'Condensate drain clearing' },
  blowerMotor: { low: 450, high: 1400, label: 'Blower motor repair/replacement' },
  condenserFanMotor: { low: 400, high: 1200, label: 'Outdoor fan motor repair/replacement' },
  refrigerantLeak: { low: 600, high: 2500, label: 'Leak search and refrigerant-related repair' },
  compressor: { low: 1800, high: 4500, label: 'Compressor replacement' },
  replacement: { low: 6500, high: 18000, label: 'System replacement' }
};

export const quoteRepairTypes = Object.entries(baselineRanges).map(([value, range]) => ({ value, label: range.label }));

export function assessQuote(input: QuoteInput): QuoteAssessment {
  const range = baselineRanges[input.repairType];
  if (!range || !Number.isFinite(input.quotedTotal) || input.quotedTotal <= 0) {
    return {
      band: 'needs-review',
      title: 'More detail needed',
      explanation: 'The app needs a repair type and total price before it can provide a useful first-pass quote check.',
      questionsToAsk: ['What exact part is being replaced?', 'Is labor included?', 'Is diagnostic time included?', 'Is there a parts and labor warranty?'],
      redFlags: ['No written quote', 'No diagnosis notes', 'No part name or model number']
    };
  }

  const adjustedHigh = range.high * (input.afterHours ? 1.25 : 1);
  const adjustedLow = range.low;
  const questionsToAsk = [
    'What test readings confirmed this diagnosis?',
    'Can you show photos of the failed part or issue?',
    'What brand or part number is included?',
    'How long is the parts and labor warranty?',
    'Does this include diagnostic fees, trip charge, labor, and taxes?'
  ];

  const redFlags = [
    'Pressure to approve immediately without explanation',
    'Replacement recommendation without test readings',
    'No written scope of work',
    'Refusal to explain what failed'
  ];

  if (input.quotedTotal < adjustedLow) {
    return {
      band: 'low',
      title: 'This quote appears unusually low',
      explanation: `For ${range.label.toLowerCase()}, the entered quote is below the first-pass expected range. That can be legitimate, but confirm what is included so you are not surprised by add-ons.`,
      questionsToAsk,
      redFlags
    };
  }

  if (input.quotedTotal <= adjustedHigh) {
    return {
      band: 'fair',
      title: 'This quote appears generally reasonable',
      explanation: `For ${range.label.toLowerCase()}, the entered quote falls inside the app's starter expected range. Final fairness still depends on market, access difficulty, urgency, warranty, and diagnosis quality.`,
      questionsToAsk,
      redFlags
    };
  }

  return {
    band: 'high',
    title: 'This quote appears high enough to review carefully',
    explanation: `For ${range.label.toLowerCase()}, the entered quote is above the app's starter expected range. That does not prove the contractor is wrong, but it does justify asking for details or getting a second opinion.`,
    questionsToAsk,
    redFlags
  };
}
