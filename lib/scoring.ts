import { failsRevenueThreshold, meetsRevenueThreshold } from '@/lib/questions';

export type AssessmentAxisResult = {
  score: number;
  category: string;
  recommendation: string;
};

export type PhaseRecommendation = {
  phase: 'in_scope' | 'out_of_scope' | 'other';
  label: string;
  description: string;
};

export type AssessmentResult = {
  eligible: boolean;
  ineligibleReason?: string;
  phaseRecommendation: PhaseRecommendation;
  urgency: AssessmentAxisResult;
  complexity: AssessmentAxisResult;
  totalScore: number;
  maxUrgencyScore: number;
  maxComplexityScore: number;
  outcomeTitle: string;
  outcomeMessage: string;
  meetingBullets: string[];
  meetingPrompt: string;
};

export const DMTT_IN_SCOPE_OUTCOME =
  'Based on our initial scoping analysis, your entity is part of an MNE Group that will be subject to the UAE Domestic Minimum Top-up Tax (DMTT) / Pillar Two Rules for financial years beginning on or after 1 January 2025. As per UAE Cabinet Decision no. 142 of 2024, the entity will be required to register for Pillar Two purposes in the UAE. We advise scheduling a 45-minute alignment meeting with the RSM Pillar Two team to review the full findings of this assessment and outline your compliance roadmap.';

export const DMTT_OUT_OF_SCOPE_OUTCOME =
  'The MNE group does not meet the revenue threshold to be subject to the Pillar Two Rules for the tested fiscal year.';

export const DMTT_MEETING_BULLETS = [
  'Walk through your detailed scoping results and identify key risk areas (e.g., accounting period alignments, entity classification, data readiness etc.).',
  'Present a customized compliance roadmap outlining critical milestones for 2025.',
];

export const DMTT_MEETING_PROMPT = '';

export const DMTT_SCHEDULING_URL =
  'https://www.rsm.global/uae/service/tax-compliance-advisory-services';

const emptyAxis = (category: string, recommendation: string): AssessmentAxisResult => ({
  score: 0,
  category,
  recommendation,
});

export function computeAssessment(answers: Record<string, string>): AssessmentResult {
  if (failsRevenueThreshold(answers)) {
    return {
      eligible: false,
      ineligibleReason: DMTT_OUT_OF_SCOPE_OUTCOME,
      phaseRecommendation: {
        phase: 'out_of_scope',
        label: 'Out of Scope',
        description: DMTT_OUT_OF_SCOPE_OUTCOME,
      },
      urgency: emptyAxis('Out of scope', 'No Pillar Two registration required based on revenue threshold responses.'),
      complexity: emptyAxis('N/A', 'Further scoping not required.'),
      totalScore: 0,
      maxUrgencyScore: 0,
      maxComplexityScore: 0,
      outcomeTitle: 'Out of Scope',
      outcomeMessage: DMTT_OUT_OF_SCOPE_OUTCOME,
      meetingBullets: [],
      meetingPrompt: '',
    };
  }

  if (!meetsRevenueThreshold(answers)) {
    return {
      eligible: false,
      ineligibleReason: 'Revenue threshold assessment is incomplete.',
      phaseRecommendation: {
        phase: 'other',
        label: 'Incomplete',
        description: 'Please complete the Group Revenue Threshold questions.',
      },
      urgency: emptyAxis('Incomplete', 'Complete Section 1 to determine applicability.'),
      complexity: emptyAxis('N/A', 'Awaiting responses.'),
      totalScore: 0,
      maxUrgencyScore: 0,
      maxComplexityScore: 0,
      outcomeTitle: 'Assessment Incomplete',
      outcomeMessage: 'Please complete the Group Revenue Threshold questions.',
      meetingBullets: [],
      meetingPrompt: '',
    };
  }

  return {
    eligible: true,
    phaseRecommendation: {
      phase: 'in_scope',
      label: 'Subject to DMTT / Pillar Two',
      description: DMTT_IN_SCOPE_OUTCOME,
    },
    urgency: emptyAxis(
      'In scope',
      'Entity is part of an MNE Group subject to UAE DMTT / Pillar Two Rules.',
    ),
    complexity: emptyAxis(
      'Scoping complete',
      'Schedule an alignment meeting to review findings and compliance roadmap.',
    ),
    totalScore: 100,
    maxUrgencyScore: 100,
    maxComplexityScore: 100,
    outcomeTitle: 'Subject to UAE DMTT / Pillar Two',
    outcomeMessage: DMTT_IN_SCOPE_OUTCOME,
    meetingBullets: DMTT_MEETING_BULLETS,
    meetingPrompt: DMTT_MEETING_PROMPT,
  };
}
