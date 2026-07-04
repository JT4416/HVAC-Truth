export type PacketScoreStatus = 'complete' | 'good' | 'needs_attention' | 'thin_packet';
export type PacketScoreItemStatus = 'complete' | 'missing' | 'warning' | 'not_applicable';

export type PacketScoreItem = {
  id: string;
  label: string;
  status: PacketScoreItemStatus;
  points: number;
  maxPoints: number;
  message: string;
  contractorImpact: string;
};

export type ContractorPacketScore = {
  score: number;
  maxScore: number;
  percent: number;
  status: PacketScoreStatus;
  label: string;
  summary: string;
  items: PacketScoreItem[];
  missingHighValueFields: string[];
  warnings: string[];
  contractorBadge: string;
};

type PacketScoreItemInput = Omit<PacketScoreItem, 'points' | 'status'> & {
  complete: boolean;
  warning?: boolean;
  notApplicable?: boolean;
};

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== '' && String(value).trim() !== 'Not provided';
}

function item(params: PacketScoreItemInput): PacketScoreItem {
  const status: PacketScoreItemStatus = params.notApplicable
    ? 'not_applicable'
    : params.complete
      ? 'complete'
      : params.warning
        ? 'warning'
        : 'missing';

  return {
    id: params.id,
    label: params.label,
    status,
    points: status === 'complete' || status === 'not_applicable' ? params.maxPoints : status === 'warning' ? Math.round(params.maxPoints / 2) : 0,
    maxPoints: params.maxPoints,
    message: params.message,
    contractorImpact: params.contractorImpact
  };
}

function statusFromPercent(percent: number): { status: PacketScoreStatus; label: string; contractorBadge: string } {
  if (percent >= 90) return { status: 'complete', label: 'Complete packet', contractorBadge: 'Complete' };
  if (percent >= 75) return { status: 'good', label: 'Strong packet', contractorBadge: 'Strong' };
  if (percent >= 50) return { status: 'needs_attention', label: 'Needs a few details', contractorBadge: 'Needs details' };
  return { status: 'thin_packet', label: 'Thin packet', contractorBadge: 'Thin' };
}

export function buildContractorPacketScore(input: {
  zipCode?: string;
  contactPreference?: string;
  homeownerPhone?: string;
  homeownerEmail?: string;
  symptomSummary?: string;
  desiredOutcome?: string;
  reportSnapshot?: Record<string, any>;
  selectedContractorCount?: number;
}): ContractorPacketScore {
  const report = input.reportSnapshot ?? {};
  const troubleshooting = report.troubleshooting;
  const packet = troubleshooting?.contractorPacket;
  const photoSummary = packet?.photoAttachmentSummary;
  const photoAttachments = (packet?.photoAttachments ?? []) as any[];
  const blockedPhotos = photoAttachments.filter((photo) => photo.status === 'blocked_by_safety');

  const items: PacketScoreItem[] = [
    item({ id: 'zip-code', label: 'Service ZIP', complete: hasValue(input.zipCode), maxPoints: 10, message: hasValue(input.zipCode) ? 'ZIP code is included.' : 'ZIP code is missing.', contractorImpact: 'Contractor needs the ZIP to confirm service area, travel time, and dispatch priority.' }),
    item({ id: 'contact-path', label: 'Contact path', complete: hasValue(input.contactPreference) && (hasValue(input.homeownerPhone) || hasValue(input.homeownerEmail)), warning: hasValue(input.contactPreference), maxPoints: 10, message: hasValue(input.homeownerPhone) || hasValue(input.homeownerEmail) ? 'Contact method and contact detail are included.' : 'Contact preference is present but phone/email may be missing.', contractorImpact: 'Contractor needs a reliable way to reach the homeowner before rolling a truck.' }),
    item({ id: 'issue-summary', label: 'Issue summary', complete: hasValue(input.symptomSummary), maxPoints: 10, message: hasValue(input.symptomSummary) ? 'Issue summary is included.' : 'Issue summary is missing.', contractorImpact: 'Issue summary helps the contractor decide urgency and likely diagnostic path.' }),
    item({ id: 'desired-outcome', label: 'Desired outcome', complete: hasValue(input.desiredOutcome), maxPoints: 5, message: hasValue(input.desiredOutcome) ? 'Desired outcome is included.' : 'Desired outcome is missing.', contractorImpact: 'This tells the contractor whether the homeowner wants repair, estimate, second opinion, or scheduling.' }),
    item({ id: 'air-handler-location', label: 'Air handler location', complete: hasValue(report.airHandlerLocation), maxPoints: 10, message: hasValue(report.airHandlerLocation) ? 'Air handler location is included.' : 'Air handler location is missing.', contractorImpact: 'Location changes labor assumptions, access time, ladder needs, attic/crawl/roof difficulty, and ballpark pricing.' }),
    item({ id: 'access-notes', label: 'Access notes', complete: hasValue(report.accessNotes) || hasValue(report.airHandlerLocationNotes), warning: hasValue(report.airHandlerLocation), maxPoints: 10, message: hasValue(report.accessNotes) || hasValue(report.airHandlerLocationNotes) ? 'Access notes are included.' : 'Access notes are missing.', contractorImpact: 'Access notes reduce surprise trip charges, reschedules, and unprepared dispatches.' }),
    item({ id: 'model-serial', label: 'Model/serial numbers', complete: hasValue(report.indoorModelNumber) || hasValue(report.outdoorModelNumber) || hasValue(report.indoorSerialNumber) || hasValue(report.outdoorSerialNumber), maxPoints: 10, message: hasValue(report.indoorModelNumber) || hasValue(report.outdoorModelNumber) || hasValue(report.indoorSerialNumber) || hasValue(report.outdoorSerialNumber) ? 'At least one model/serial value is included.' : 'Model/serial values are missing.', contractorImpact: 'Model/serial numbers help identify age, size, refrigerant, parts, warranty, and quote fairness.' }),
    item({ id: 'troubleshooting', label: 'Troubleshooting attached', complete: Boolean(troubleshooting), maxPoints: 10, message: troubleshooting ? 'Troubleshooting session is attached.' : 'No troubleshooting session is attached.', contractorImpact: 'Troubleshooting context gives the contractor a structured homeowner observation history.' }),
    item({ id: 'photo-status', label: 'Safe photo status', complete: Boolean(photoSummary && (photoSummary.attached > 0 || photoSummary.blocked > 0 || photoSummary.skipped > 0 || photoSummary.notApplicable > 0)), warning: Boolean(photoSummary), maxPoints: 10, message: photoSummary ? `Photo status included: ${photoSummary.attached} attached, ${photoSummary.blocked} unsafe access.` : 'No safe photo status is included.', contractorImpact: 'Photo status helps the contractor know what can be reviewed remotely and what must be verified on site.' }),
    item({ id: 'contractor-selected', label: 'Contractor selected', complete: (input.selectedContractorCount ?? 0) > 0, maxPoints: 5, message: (input.selectedContractorCount ?? 0) > 0 ? `${input.selectedContractorCount} contractor(s) selected.` : 'No contractor selected.', contractorImpact: 'A selected contractor confirms where the packet is being routed.' }),
    item({ id: 'safety-boundary', label: 'Safety boundary visible', complete: Boolean(packet?.homeownerSafetyBoundary?.length || blockedPhotos.length), warning: Boolean(packet), maxPoints: 10, message: packet?.homeownerSafetyBoundary?.length || blockedPhotos.length ? 'Safety boundary is visible in the packet.' : 'No safety boundary context is visible.', contractorImpact: 'Contractor can see what the homeowner was explicitly told not to do and where access was unsafe.' })
  ];

  const score = items.reduce((sum, scoreItem) => sum + scoreItem.points, 0);
  const maxScore = items.reduce((sum, scoreItem) => sum + scoreItem.maxPoints, 0);
  const percent = Math.round((score / maxScore) * 100);
  const status = statusFromPercent(percent);
  const missingHighValueFields = items.filter((scoreItem) => scoreItem.status === 'missing' && scoreItem.maxPoints >= 10).map((scoreItem) => scoreItem.label);
  const warnings = [
    ...items.filter((scoreItem) => scoreItem.status === 'warning').map((scoreItem) => scoreItem.message),
    ...blockedPhotos.map((photo) => `Unsafe access noted for ${photo.promptLabel}. Contractor should verify on site.`)
  ];

  return {
    score,
    maxScore,
    percent,
    status: status.status,
    label: status.label,
    summary: `${status.label}: ${percent}% complete. ${missingHighValueFields.length ? `Missing high-value fields: ${missingHighValueFields.join(', ')}.` : 'High-value fields are mostly covered.'}`,
    items,
    missingHighValueFields,
    warnings,
    contractorBadge: status.contractorBadge
  };
}

export function buildPacketScoreText(score?: ContractorPacketScore | null) {
  if (!score) return 'No packet score available.';
  return [
    `Packet score: ${score.percent}% (${score.label})`,
    `Contractor badge: ${score.contractorBadge}`,
    score.summary,
    '',
    'Score details:',
    ...score.items.map((item) => `- ${item.label}: ${item.status} (${item.points}/${item.maxPoints}) — ${item.message}`),
    '',
    'Warnings:',
    ...(score.warnings.length ? score.warnings.map((warning) => `- ${warning}`) : ['- None'])
  ].join('\n');
}
