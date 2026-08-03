export type YesNoDetailsChoice = '0' | '1' | 'no_branch';

export type YesNoDetailsAnswer = {
  choice: YesNoDetailsChoice;
  countries?: string[];
};

function normalizeCountries(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((c) => (typeof c === 'string' ? c : String(c)));
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((c) => c.trim());
  }
  return [];
}

function isYesNoDetailsChoice(value: unknown): value is YesNoDetailsChoice {
  return value === '0' || value === '1' || value === 'no_branch';
}

export function parseYesNoDetails(value: string): YesNoDetailsAnswer | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<YesNoDetailsAnswer> & {
      countries?: unknown;
    };
    if (isYesNoDetailsChoice(parsed.choice)) {
      return {
        choice: parsed.choice,
        countries: normalizeCountries(parsed.countries),
      };
    }
  } catch {
    if (value === '0' || value === '1') {
      return { choice: value, countries: [] };
    }
    if (value === 'no_branch') {
      return { choice: 'no_branch', countries: [] };
    }
  }
  return null;
}

export function getCountriesList(details: YesNoDetailsAnswer | null): string[] {
  if (!details || details.choice !== '1') return [''];
  const list = details.countries ?? [];
  return list.length > 0 ? list : [''];
}

export function stringifyYesNoDetails(data: YesNoDetailsAnswer): string {
  return JSON.stringify({
    choice: data.choice,
    countries:
      data.choice === '1'
        ? (data.countries ?? []).map((c) => c.trim())
        : [],
  });
}

export function hasAtLeastOneCountry(details: YesNoDetailsAnswer | null): boolean {
  if (!details || details.choice !== '1') return false;
  return (details.countries ?? []).some((c) => c.trim().length > 0);
}

export function formatYesNoDetailsDisplay(
  value: string,
  detailsKind: 'countries' | 'branches' = 'countries',
  options?: Array<{ value: string; label: string }>,
): string {
  const parsed = parseYesNoDetails(value);
  if (!parsed) return value || 'Not answered';

  const optionLabel = options?.find((o) => o.value === parsed.choice)?.label;

  if (parsed.choice === '0') {
    return optionLabel ?? (detailsKind === 'branches' ? 'No' : 'No');
  }
  if (parsed.choice === 'no_branch') {
    return optionLabel ?? 'No branch part';
  }

  const items = (parsed.countries ?? []).map((c) => c.trim()).filter(Boolean);
  if (detailsKind === 'branches') {
    const yesLabel = optionLabel ?? 'Yes';
    return items.length > 0 ? `${yesLabel} — ${items.join(', ')}` : yesLabel;
  }
  return items.length > 0 ? `Yes — ${items.join(', ')}` : 'Yes';
}
