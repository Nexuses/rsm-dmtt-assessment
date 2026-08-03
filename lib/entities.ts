export type EntityRecord = {
  legalName: string;
  trn: string;
  turnoverBand: string;
  salesInvoicesPerYear: string;
  purchaseInvoicesPerYear: string;
  ftaPilotAdoption: string;
};

export const FTA_PILOT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'planning', label: 'Planning voluntary adoption by July 2026' },
  { value: 'not_sure', label: 'Not sure' },
] as const;

export const TURNOVER_BAND_OPTIONS = [
  { value: 'gt_50m', label: 'Greater than AED 50M (Phase 1)' },
  { value: 'lt_50m', label: 'Less than AED 50M (Phase 2)' },
  { value: 'not_registered_vat', label: 'Not registered for VAT' },
  { value: 'unknown', label: 'Not sure / To be confirmed' },
] as const;

/** Same volume bands as inbound (q6_inbound) and sales outbound (q6) volume questions. */
export const INVOICE_VOLUME_BAND_OPTIONS = [
  { value: '1_3k', label: '1–3k' },
  { value: '3_5k', label: '3–5k' },
  { value: '5_7k', label: '5–7k' },
  { value: '7_10k', label: '7–10k' },
] as const;

const INVOICE_VOLUME_VALUES = new Set<string>(
  INVOICE_VOLUME_BAND_OPTIONS.map((o) => o.value),
);

export function createEmptyEntity(): EntityRecord {
  return {
    legalName: '',
    trn: '',
    turnoverBand: '',
    salesInvoicesPerYear: '',
    purchaseInvoicesPerYear: '',
    ftaPilotAdoption: '',
  };
}

export function parseEntities(value: string): EntityRecord[] | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => ({
      legalName: typeof item?.legalName === 'string' ? item.legalName : '',
      trn: typeof item?.trn === 'string' ? item.trn : '',
      turnoverBand: typeof item?.turnoverBand === 'string' ? item.turnoverBand : '',
      salesInvoicesPerYear:
        typeof item?.salesInvoicesPerYear === 'string'
          ? item.salesInvoicesPerYear
          : String(item?.salesInvoicesPerYear ?? ''),
      purchaseInvoicesPerYear:
        typeof item?.purchaseInvoicesPerYear === 'string'
          ? item.purchaseInvoicesPerYear
          : String(item?.purchaseInvoicesPerYear ?? ''),
      ftaPilotAdoption:
        typeof item?.ftaPilotAdoption === 'string' ? item.ftaPilotAdoption : '',
    }));
  } catch {
    return null;
  }
}

export function stringifyEntities(entities: EntityRecord[]): string {
  return JSON.stringify(entities);
}

export function getEntitiesList(value: string): EntityRecord[] {
  const parsed = parseEntities(value);
  return parsed && parsed.length > 0 ? parsed : [createEmptyEntity()];
}

export type ValidateEntitiesOptions = {
  requireLegalName?: boolean;
  requireTurnoverBand?: boolean;
  requireSalesInvoicesPerYear?: boolean;
};

export function validateEntities(
  value: string,
  options?: ValidateEntitiesOptions,
): string | null {
  const requireLegalName = options?.requireLegalName ?? true;
  const requireTurnoverBand = options?.requireTurnoverBand ?? true;
  const requireSalesInvoicesPerYear =
    options?.requireSalesInvoicesPerYear ?? true;
  const entities = getEntitiesList(value);

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const label = `Entity #${i + 1}`;

    if (requireLegalName && !entity.legalName.trim()) {
      return `${label}: Entity legal name is required.`;
    }
    if (entity.trn.trim() && !/^\d{15}$/.test(entity.trn.trim())) {
      return `${label}: TRN must be 15 digits when provided.`;
    }
    if (requireTurnoverBand && !entity.turnoverBand) {
      return `${label}: Please select an annual turnover band.`;
    }
    if (
      requireSalesInvoicesPerYear &&
      !INVOICE_VOLUME_VALUES.has(entity.salesInvoicesPerYear)
    ) {
      return `${label}: Please select sales invoices per year.`;
    }
    if (!INVOICE_VOLUME_VALUES.has(entity.purchaseInvoicesPerYear)) {
      return `${label}: Please select purchase invoices per year.`;
    }
    if (!entity.ftaPilotAdoption) {
      return `${label}: Please select FTA pilot / voluntary adoption status.`;
    }
  }

  return null;
}

export function formatEntitiesDisplay(value: string): string {
  const entities = parseEntities(value);
  if (!entities?.length) return 'Not answered';

  return entities
    .map((entity, index) => {
      const turnover =
        TURNOVER_BAND_OPTIONS.find((o) => o.value === entity.turnoverBand)?.label ||
        entity.turnoverBand ||
        '—';
      const trn = entity.trn.trim() ? entity.trn.trim() : '—';
      const ftaPilot =
        FTA_PILOT_OPTIONS.find((o) => o.value === entity.ftaPilotAdoption)?.label ||
        entity.ftaPilotAdoption ||
        '—';
      const salesVolume =
        INVOICE_VOLUME_BAND_OPTIONS.find(
          (o) => o.value === entity.salesInvoicesPerYear,
        )?.label || entity.salesInvoicesPerYear.trim();
      const purchaseVolume =
        INVOICE_VOLUME_BAND_OPTIONS.find(
          (o) => o.value === entity.purchaseInvoicesPerYear,
        )?.label || entity.purchaseInvoicesPerYear.trim();
      return [
        `Entity ${index + 1}: ${entity.legalName.trim()}`,
        `TRN: ${trn}`,
        `Turnover: ${turnover}`,
        `Sales invoices/year (B2B & B2G): ${salesVolume || '—'}`,
        `Purchase invoices/year (excl. imports): ${purchaseVolume || '—'}`,
        `FTA pilot / voluntary adoption by Jul 2026: ${ftaPilot}`,
      ].join(' | ');
    })
    .join('\n');
}
