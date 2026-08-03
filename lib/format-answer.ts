import type { Question } from '@/lib/questions';
import { formatSelectOtherDisplay } from '@/lib/select-other';

function formatFileAnswer(answerValue: string): string {
  if (!answerValue?.trim()) return 'Not provided';
  try {
    const parsed = JSON.parse(answerValue) as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    };
    if (parsed.fileName) {
      const size =
        typeof parsed.fileSize === 'number'
          ? ` (${Math.round(parsed.fileSize / 1024)} KB)`
          : '';
      return `${parsed.fileName}${size}`;
    }
  } catch {
    // plain string
  }
  return answerValue;
}

/** Format a stored answer for PDF, email, and Google Sheets display. */
export function formatAnswerDisplay(
  question: Question | undefined,
  answerValue: string,
): string {
  if (!answerValue?.trim()) {
    if (question?.optional) return 'Not provided';
    return 'Not answered';
  }

  if (!question) return answerValue;

  switch (question.responseType) {
    case 'select_other':
      return formatSelectOtherDisplay(answerValue, question.options);
    case 'yesno':
    case 'select': {
      const answer = question.options?.find((opt) => opt.value === answerValue);
      return answer?.label || answerValue;
    }
    case 'country':
      return answerValue;
    case 'file':
      return formatFileAnswer(answerValue);
    case 'text':
    default:
      return answerValue;
  }
}
