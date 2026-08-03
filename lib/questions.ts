export type ResponseType =
  | 'yesno'
  | 'select'
  | 'select_other'
  | 'country'
  | 'file'
  | 'text';

export type Question = {
  id: string;
  text: string;
  subject: string;
  responseType: ResponseType;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  note?: string;
  optional?: boolean;
  validation?: {
    required?: boolean;
  };
};

export const FISCAL_YEAR_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'jan_dec', label: 'January to December' },
  { value: 'feb_jan', label: 'February to January' },
  { value: 'mar_feb', label: 'March to February' },
  { value: 'apr_mar', label: 'April to March' },
  { value: 'may_apr', label: 'May to April' },
  { value: 'jun_may', label: 'June to May' },
  { value: 'jul_jun', label: 'July to June' },
  { value: 'aug_jul', label: 'August to July' },
  { value: 'sep_aug', label: 'September to August' },
  { value: 'oct_sep', label: 'October to September' },
  { value: 'nov_oct', label: 'November to October' },
  { value: 'dec_nov', label: 'December to November' },
];

export const UPE_ACCOUNTING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'us_gaap', label: 'US GAAP' },
  { value: 'local_gaap', label: 'Local / National GAAP' },
  { value: 'ifrs', label: 'IFRS' },
  { value: 'ifrs_smes', label: 'IFRS for SMEs' },
  { value: 'other', label: 'Other' },
];

export const UAE_ACCOUNTING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ifrs', label: 'IFRS' },
  { value: 'ifrs_smes', label: 'IFRS for SMEs' },
  { value: 'other', label: 'Other' },
];

const SECTION_2_PLUS_IDS = [
  'q2a',
  'q3a',
  'q3b',
  'q3c',
  'q4a',
  'q4b',
  'q4c',
  'q4d',
] as const;

export const questionsData: Question[] = [
  {
    id: 'q1a',
    text: 'Are you an Entity that is a member of an MNE Group with annual revenue of EUR 750 Million or more in the Consolidated Financial Statements of the Ultimate Parent Entity for at least two of the four fiscal years immediately preceding the tested fiscal year?',
    subject: '1. Group Revenue Threshold',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
    note: 'Note: The tested fiscal year means fiscal year starting on or after 1 January 2025.\nPillar Two Rules in the UAE do not apply to purely domestic groups. A Purely Domestic Group is a group of entities where all entities, operations, and permanent establishments are located strictly within a single jurisdiction (e.g., exclusively within the UAE).',
  },
  {
    id: 'q1b',
    text: 'Did two or more independent groups merge to form your current MNE Group during fiscal year 2025?',
    subject: '1. Group Revenue Threshold',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
    note: 'Note: If yes, then please confirm if the sum of the revenue included in each of their Consolidated Financial Statements for at least two out of four years prior to the year 2025 is equal to or greater than EUR 750 million.',
  },
  {
    id: 'q1c',
    text: 'Did the MNE Group acquire or merge with any standalone Entity (a company that was not part of any group) at any point during the 2025 fiscal year? (Alternatively, was your current Group newly formed in 2025 by a standalone Entity acquiring another group/entity?)',
    subject: '1. Group Revenue Threshold',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
    note: 'Note: If yes, then please confirm if the sum of the revenue included in each of their Financial Statements or Consolidated Financial Statements for at least two out of four years prior to the year 2025 is equal to or greater than EUR 750 million.',
  },
  {
    id: 'q1d',
    text: 'Did the MNE Group undergo a demerger into two or more separate groups during fiscal years 2024 or 2025?',
    subject: '1. Group Revenue Threshold',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
    note: 'Note: If yes, please confirm if the Demerged Group has annual revenues of EUR 750 million or more in the first tested fiscal year ending after the demerger or in at least two of the fiscal years out of the four fiscal years following the year of the demerger.\nThis condition has to be evaluated independently for each Demerged Group.',
  },
  {
    id: 'q2a',
    text: 'Please attach MNE Group ownership structure with jurisdiction and shareholding percentage. (Optional)',
    subject: '2. Group Structure',
    responseType: 'file',
    optional: true,
    placeholder: 'Upload ownership structure (PDF, PNG, JPG, or XLSX)',
  },
  {
    id: 'q3a',
    text: 'Please specify the Jurisdiction where the Ultimate Parent Entity is located.',
    subject: '3. Ultimate Parent Entity',
    responseType: 'country',
  },
  {
    id: 'q3b',
    text: 'Please specify the accounting standard of the Ultimate Parent Entity',
    subject: '3. Ultimate Parent Entity',
    responseType: 'select_other',
    options: UPE_ACCOUNTING_OPTIONS,
    placeholder: 'Specify accounting standard',
  },
  {
    id: 'q3c',
    text: 'Please specify the fiscal year of the Ultimate Parent Entity.',
    subject: '3. Ultimate Parent Entity',
    responseType: 'select',
    options: FISCAL_YEAR_OPTIONS,
  },
  {
    id: 'q4a',
    text: 'Please specify the accounting standard of the UAE Entities.',
    subject: '4. UAE Jurisdiction',
    responseType: 'select_other',
    options: UAE_ACCOUNTING_OPTIONS,
    placeholder: 'Specify accounting standard',
  },
  {
    id: 'q4b',
    text: 'Please specify the fiscal year of the UAE entities.',
    subject: '4. UAE Jurisdiction',
    responseType: 'select',
    options: FISCAL_YEAR_OPTIONS,
  },
  {
    id: 'q4c',
    text: 'Please confirm if the Place of Effective Management and Control of all the UAE entities is in the UAE.',
    subject: '4. UAE Jurisdiction',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
  {
    id: 'q4d',
    text: 'Are there any foreign (non-UAE) entities in the group that are effectively managed or controlled by directors/executives based in the UAE?',
    subject: '4. UAE Jurisdiction',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
];

const questionById = Object.fromEntries(questionsData.map((q) => [q.id, q]));

/** Returns ordered visible question IDs based on Section 1 branching from the Excel. */
export function getVisibleQuestionIds(answers: Record<string, string>): string[] {
  const path: string[] = ['q1a'];

  if (answers.q1a === '1') {
    return [...path, ...SECTION_2_PLUS_IDS];
  }
  if (answers.q1a !== '0') {
    return path;
  }

  path.push('q1b');
  if (answers.q1b === '1') {
    return [...path, ...SECTION_2_PLUS_IDS];
  }
  if (answers.q1b !== '0') {
    return path;
  }

  path.push('q1c');
  if (answers.q1c === '1') {
    return [...path, ...SECTION_2_PLUS_IDS];
  }
  if (answers.q1c !== '0') {
    return path;
  }

  path.push('q1d');
  if (answers.q1d === '1') {
    return [...path, ...SECTION_2_PLUS_IDS];
  }

  // q1d unanswered or No — only Section 1 path (No ends questionnaire)
  return path;
}

export function getVisibleQuestions(answers: Record<string, string>): Question[] {
  return getVisibleQuestionIds(answers)
    .map((id) => questionById[id])
    .filter(Boolean);
}

/** True when Section 1 answers qualify the group for Section 2+. */
export function meetsRevenueThreshold(answers: Record<string, string>): boolean {
  return (
    answers.q1a === '1' ||
    answers.q1b === '1' ||
    answers.q1c === '1' ||
    answers.q1d === '1'
  );
}

/** True when all of Q1a–d were answered No. */
export function failsRevenueThreshold(answers: Record<string, string>): boolean {
  return (
    answers.q1a === '0' &&
    answers.q1b === '0' &&
    answers.q1c === '0' &&
    answers.q1d === '0'
  );
}
