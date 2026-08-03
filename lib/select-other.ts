export type SelectOtherAnswer = {
  value: string;
  other?: string;
};

export function parseSelectOther(value: string): SelectOtherAnswer | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<SelectOtherAnswer>;
    if (typeof parsed.value === 'string' && parsed.value.trim()) {
      return {
        value: parsed.value.trim(),
        other: typeof parsed.other === 'string' ? parsed.other : '',
      };
    }
  } catch {
    // plain option value
  }
  return { value: value.trim() };
}

export function getSelectOtherValue(value: string): string {
  return parseSelectOther(value)?.value ?? value;
}

export function stringifySelectOther(data: SelectOtherAnswer): string {
  if (data.value === 'other') {
    return JSON.stringify({
      value: 'other',
      other: (data.other ?? '').trim(),
    });
  }
  return data.value;
}

export function hasSelectOtherText(value: string): boolean {
  const parsed = parseSelectOther(value);
  if (!parsed || parsed.value !== 'other') return true;
  return Boolean(parsed.other?.trim());
}

export function formatSelectOtherDisplay(
  value: string,
  options?: Array<{ value: string; label: string }>,
): string {
  const parsed = parseSelectOther(value);
  if (!parsed) return value || 'Not answered';
  if (parsed.value === 'other') {
    const text = parsed.other?.trim();
    return text ? `Other — ${text}` : 'Other';
  }
  const option = options?.find((opt) => opt.value === parsed.value);
  return option?.label ?? parsed.value;
}
