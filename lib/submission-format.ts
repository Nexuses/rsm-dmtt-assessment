import { questionsData } from "@/lib/questions";
import { formatAnswerDisplay } from "@/lib/format-answer";

export type SubmissionAnswer = {
  questionId: string;
  question: string;
  subject: string;
  answer: string;
};

export function formatSubmissionAnswers(
  answers: Record<string, string | null | undefined>,
): SubmissionAnswer[] {
  return questionsData.map((question) => ({
    questionId: question.id,
    question: question.text,
    subject: question.subject,
    answer: formatAnswerDisplay(question, answers[question.id] || ""),
  }));
}
