export type SelectCountriesAnswer = {
  value: string;
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

export function parseSelectCountries(value: string): SelectCountriesAnswer | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<SelectCountriesAnswer> & {
      countries?: unknown;
    };
    if (typeof parsed.value === 'string' && parsed.value.trim()) {
      return {
        value: parsed.value.trim(),
        countries: normalizeCountries(parsed.countries),
      };
    }
  } catch {
    // plain option value
  }
  return { value: value.trim(), countries: [] };
}

export function getSelectCountriesValue(value: string): string {
  return parseSelectCountries(value)?.value ?? value;
}

export function selectCountriesNeedsList(value: string): boolean {
  const v = getSelectCountriesValue(value);
  return v === 'ksa' || v === 'global';
}

export function getCountriesListForSelect(
  details: SelectCountriesAnswer | null,
): string[] {
  if (!details || !selectCountriesNeedsList(details.value)) return [];
  return (details.countries ?? []).map((c) => c.trim()).filter(Boolean);
}

export function stringifySelectCountries(data: SelectCountriesAnswer): string {
  if (selectCountriesNeedsList(data.value)) {
    return JSON.stringify({
      value: data.value,
      countries: (data.countries ?? [])
        .map((c) => c.trim())
        .filter(Boolean),
    });
  }
  return data.value;
}

export function hasAtLeastOneSelectCountry(value: string): boolean {
  const parsed = parseSelectCountries(value);
  if (!parsed || !selectCountriesNeedsList(parsed.value)) return true;
  return (parsed.countries ?? []).some((c) => c.trim().length > 0);
}

export function formatSelectCountriesDisplay(
  value: string,
  options?: Array<{ value: string; label: string }>,
): string {
  const parsed = parseSelectCountries(value);
  if (!parsed) return value || 'Not answered';

  const option = options?.find((opt) => opt.value === parsed.value);
  const label = option?.label ?? parsed.value;

  if (!selectCountriesNeedsList(parsed.value)) {
    return label;
  }

  const countries = (parsed.countries ?? []).map((c) => c.trim()).filter(Boolean);
  return countries.length > 0 ? `${label} — ${countries.join(', ')}` : label;
}
