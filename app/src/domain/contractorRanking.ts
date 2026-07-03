export type ContractorCandidate = {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  distanceMiles?: number;
  licenseVerified?: boolean;
  emergencyService?: boolean;
  appComplaintCount?: number;
  appPositiveFeedbackCount?: number;
  paidSponsor?: boolean;
};

export function scoreContractor(contractor: ContractorCandidate): number {
  const ratingScore = ((contractor.rating ?? 0) / 5) * 35;
  const reviewScore = Math.min((contractor.reviewCount ?? 0) / 250, 1) * 15;
  const distanceScore = contractor.distanceMiles === undefined ? 5 : Math.max(0, 15 - contractor.distanceMiles);
  const licenseScore = contractor.licenseVerified ? 20 : 0;
  const emergencyScore = contractor.emergencyService ? 5 : 0;
  const feedbackScore = Math.min((contractor.appPositiveFeedbackCount ?? 0), 20) * 0.5;
  const complaintPenalty = Math.min((contractor.appComplaintCount ?? 0) * 8, 30);
  const sponsorBoost = contractor.paidSponsor ? 3 : 0;
  return Math.round(ratingScore + reviewScore + distanceScore + licenseScore + emergencyScore + feedbackScore + sponsorBoost - complaintPenalty);
}
