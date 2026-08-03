"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import styles from "@/styles/CybersecurityAssessmentForm.module.css";
import {
  getVisibleQuestions,
  failsRevenueThreshold,
  meetsRevenueThreshold,
  type Question,
} from "@/lib/questions";
import { computeAssessment, type AssessmentResult } from "@/lib/scoring";
import {
  hasSelectOtherText,
  parseSelectOther,
  stringifySelectOther,
} from "@/lib/select-other";
import {
  countryOptionsWithSelections,
  getCountryDropdownOptions,
} from "@/lib/country-options";
import { ThemedSelect } from "@/components/themed-select";

const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
];

const HEADER_IMAGE_URL =
  "https://nexuseslink2024.s3.us-east-2.amazonaws.com/Frame_4__2__1785760512242_sxup.png";

const FILE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8MB — content is emailed as attachment

type FileAnswerMeta = {
  fileName: string;
  fileType: string;
  fileSize: number;
  base64?: string;
};

function parseFileAnswer(value: string): FileAnswerMeta | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<FileAnswerMeta>;
    if (typeof parsed.fileName === "string") {
      return {
        fileName: parsed.fileName,
        fileType: typeof parsed.fileType === "string" ? parsed.fileType : "",
        fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
        base64: typeof parsed.base64 === "string" ? parsed.base64 : undefined,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function validateQuestionAnswer(
  question: Question,
  answer: string | undefined,
): string | null {
  const trimmed = answer?.trim() ?? "";

  if (question.responseType === "file") {
    return null;
  }

  if (question.responseType === "select_other") {
    const parsed = parseSelectOther(trimmed);
    if (!parsed?.value) return "Please select an option.";
    if (!hasSelectOtherText(trimmed)) {
      return question.placeholder
        ? `Please ${question.placeholder.toLowerCase()}.`
        : "Please specify your selection.";
    }
    return null;
  }

  if (question.responseType === "country") {
    if (!trimmed) return "Please select a country.";
    return null;
  }

  if (question.responseType === "yesno" || question.responseType === "select") {
    if (!trimmed) return "Please provide an answer before proceeding.";
    return null;
  }

  if (!trimmed) return "Please provide an answer before proceeding.";
  return null;
}

function YesNoOptionCards({
  questionId,
  options,
  value,
  onChange,
}: {
  questionId: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => {
        const id = `${questionId}-${option.value}`;
        const isSelected = value === option.value;
        const isYes = option.value === "1";
        const isNo = option.value === "0";

        return (
          <div key={option.value} className="flex-1">
            <input
              type="radio"
              id={id}
              name={questionId}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <Label
              htmlFor={id}
              className={cn(
                "flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none",
                isYes && "border border-[#3F9C35]",
                isNo && "border border-[#00AEEF]",
                !isSelected && isYes && "hover:border-[#3F9C35] hover:shadow-lg",
                !isSelected && isNo && "hover:border-[#00AEEF] hover:shadow-lg",
                isSelected &&
                  isYes &&
                  "border-[#3F9C35] bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)] hover:shadow-[0_12px_30px_rgba(34,197,94,0.3)]",
                isSelected &&
                  isNo &&
                  "border-[#00AEEF] bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-[0_12px_30px_rgba(239,68,68,0.22)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.3)]",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 transition-colors",
                  isSelected && "border-white bg-white",
                )}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 transition-opacity",
                    isSelected && isYes && "text-[#22c55e] opacity-100",
                    isSelected && isNo && "text-[#ef4444] opacity-100",
                    !isSelected && "opacity-0",
                  )}
                />
              </span>
              <span
                className={cn(
                  "flex-1 text-left",
                  isSelected && "font-semibold text-white",
                )}
              >
                {option.label}
              </span>
            </Label>
          </div>
        );
      })}
    </div>
  );
}

export function CybersecurityAssessmentForm() {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    website: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationSuccess, setConsultationSuccess] = useState(false);
  const [consultationError, setConsultationError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers),
    [answers],
  );
  const TOTAL_QUESTIONS = visibleQuestions.length;

  useEffect(() => {
    if (currentQuestion > visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentQuestion(visibleQuestions.length);
    }
  }, [visibleQuestions.length, currentQuestion]);

  const formSchema = z.object({
    name: z.string().min(2, { message: "Please enter a valid name." }),
    email: z
      .string()
      .email("Please enter a valid email address")
      .refine((email) => {
        if (!email.includes("@")) return false;
        const [, domain] = email.split("@");
        return domain && !BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase());
      }, "Please use your business email address."),
    company: z.string().min(2, { message: "Company legal name cannot be empty." }),
    position: z.string().min(2, { message: "Please enter a valid position." }),
    phone: z.union([
      z.string().max(25, { message: "Contact number is too long." }),
      z.literal(""),
    ]),
    website: z.string().min(2, { message: "Please enter a website." }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      position: "",
      phone: "",
      website: "",
    },
    mode: "onSubmit",
  });

  const consultationSchema = z.object({
    firstName: z.string().min(2, { message: "Please enter a valid first name." }),
    lastName: z.string().min(2, { message: "Please enter a valid last name." }),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().max(20, { message: "Phone number is too long." }).optional(),
  });

  const consultationForm = useForm<z.infer<typeof consultationSchema>>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (isConsultationModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isConsultationModalOpen]);

  useEffect(() => {
    if (isConsultationModalOpen && personalInfo.name && personalInfo.email) {
      const nameParts = personalInfo.name.trim().split(/\s+/);
      consultationForm.reset({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: personalInfo.email,
        phone: "",
      });
    }
  }, [isConsultationModalOpen, personalInfo, consultationForm]);

  const animateScore = useCallback((result: AssessmentResult) => {
    const maxTotal = result.maxUrgencyScore + result.maxComplexityScore;
    const percentageScore =
      maxTotal > 0 ? Math.round((result.totalScore / maxTotal) * 100) : 0;

    setAnimatedScore(0);
    const animationDuration = 1000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;

    const animate = () => {
      const progress = frame / totalFrames;
      setAnimatedScore(Math.floor(progress * percentageScore));
      if (frame < totalFrames) {
        frame++;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const submitAssessment = useCallback(
    async (finalAnswers: Record<string, string>) => {
      const result = computeAssessment(finalAnswers);
      setAssessment(result);
      animateScore(result);

      const assessmentData = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          company: personalInfo.company,
          position: personalInfo.position,
          phone: personalInfo.phone,
          website: personalInfo.website,
        },
        answers: finalAnswers,
        score: result.totalScore,
        assessment: result,
      };

      try {
        const response = await fetch("/api/send-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assessmentData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to send assessment results",
          );
        }
      } catch (error) {
        console.error("Error sending assessment results:", error);
      }
    },
    [animateScore, personalInfo],
  );

  const handlePersonalInfoSubmit = (values: z.infer<typeof formSchema>) => {
    setPersonalInfo(values);
    setCurrentQuestion(1);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);

    const currentQ = visibleQuestions[currentQuestion - 1];
    if (!currentQ || currentQ.id !== questionId) return;

    // Excel: only when Q1a–Q1d are ALL No does the questionnaire end.
    if (
      questionId === "q1d" &&
      value === "0" &&
      failsRevenueThreshold(updatedAnswers)
    ) {
      setTimeout(() => {
        setFormErrors([]);
        submitAssessment(updatedAnswers);
      }, 300);
      return;
    }

    // Auto-advance for yes/no and select — use next path from updatedAnswers
    // (not stale TOTAL_QUESTIONS, which was wrong on Q1a Yes/No).
    if (
      currentQ.responseType === "yesno" ||
      currentQ.responseType === "select"
    ) {
      const nextVisible = getVisibleQuestions(updatedAnswers);
      const currentIndex = nextVisible.findIndex((q) => q.id === questionId);
      const nextIndex = currentIndex + 1;

      setTimeout(() => {
        setFormErrors([]);
        if (currentIndex >= 0 && nextIndex < nextVisible.length) {
          setCurrentQuestion(nextIndex + 1);
          return;
        }

        // Last question of the in-scope path (e.g. Q4d)
        if (meetsRevenueThreshold(updatedAnswers)) {
          submitAssessment(updatedAnswers);
        }
      }, 300);
    }
  };

  const handleFileSelect = async (questionId: string, file: File | null) => {
    if (!file) {
      handleAnswerChange(questionId, "");
      return;
    }

    if (file.size > FILE_UPLOAD_MAX_BYTES) {
      setFormErrors([
        `File is too large. Please upload a file under ${Math.round(FILE_UPLOAD_MAX_BYTES / (1024 * 1024))}MB.`,
      ]);
      return;
    }

    setIsUploadingFile(true);
    setFormErrors([]);
    try {
      const meta: FileAnswerMeta = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const encoded = result.includes(",") ? result.split(",")[1] : result;
          resolve(encoded);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      meta.base64 = base64;

      setAnswers((prev) => ({
        ...prev,
        [questionId]: JSON.stringify(meta),
      }));
    } catch (error) {
      console.error("Error reading file:", error);
      setFormErrors(["Unable to read the selected file. Please try again."]);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion === 0) {
      form.handleSubmit(handlePersonalInfoSubmit)();
      return;
    }

    const currentQ = visibleQuestions[currentQuestion - 1];
    const currentAnswer = answers[currentQ.id];
    const validationError = validateQuestionAnswer(currentQ, currentAnswer);

    if (validationError) {
      setFormErrors([validationError]);
      return;
    }

    setFormErrors([]);

    const nextVisible = getVisibleQuestions(answers);
    const currentIndex = nextVisible.findIndex((q) => q.id === currentQ.id);
    const nextIndex = currentIndex + 1;

    if (currentIndex >= 0 && nextIndex < nextVisible.length) {
      setCurrentQuestion(nextIndex + 1);
      return;
    }

    if (
      failsRevenueThreshold(answers) ||
      meetsRevenueThreshold(answers)
    ) {
      submitAssessment({ ...answers });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setFormErrors([]);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleConsultationSubmit = async (
    values: z.infer<typeof consultationSchema>,
  ) => {
    setConsultationError(null);
    setIsSubmittingConsultation(true);
    try {
      const response = await fetch("/api/book-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          context: {
            personalInfo,
            score: assessment?.totalScore ?? Math.round(animatedScore),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to submit consultation request.",
        );
      }

      consultationForm.reset();
      setConsultationSuccess(true);
      setIsConsultationModalOpen(false);
    } catch (error) {
      console.error("Error submitting consultation form:", error);
      setConsultationError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmittingConsultation(false);
    }
  };

  const progress = ((currentQuestion + 1) / (TOTAL_QUESTIONS + 1)) * 100;

  const renderQuestionInput = (currentQ: Question, currentAnswer: string) => {
    switch (currentQ.responseType) {
      case "yesno":
        return (
          <YesNoOptionCards
            questionId={currentQ.id}
            options={currentQ.options ?? []}
            value={currentAnswer}
            onChange={(value) => handleAnswerChange(currentQ.id, value)}
          />
        );

      case "select":
        return (
          <ThemedSelect
            value={currentAnswer}
            onChange={(value) => handleAnswerChange(currentQ.id, value)}
            options={currentQ.options ?? []}
            placeholder="Select an option..."
            aria-label={currentQ.text}
          />
        );

      case "select_other": {
        const parsed = parseSelectOther(currentAnswer);
        const selectedValue = parsed?.value ?? "";
        const otherText =
          selectedValue === "other" ? (parsed?.other ?? "") : "";

        const updateSelectOther = (value: string, other?: string) => {
          setAnswers((prev) => ({
            ...prev,
            [currentQ.id]: stringifySelectOther({
              value,
              other: value === "other" ? other : undefined,
            }),
          }));
        };

        return (
          <div className="flex flex-col gap-4">
            <ThemedSelect
              value={selectedValue}
              onChange={(value) =>
                updateSelectOther(value, value === "other" ? otherText : undefined)
              }
              options={currentQ.options ?? []}
              placeholder="Select an option..."
              aria-label={currentQ.text}
            />
            {selectedValue === "other" && (
              <div>
                <Label className="mb-2 block text-sm font-semibold text-[#1b3a57]">
                  Please specify
                </Label>
                <Input
                  value={otherText}
                  onChange={(e) => updateSelectOther("other", e.target.value)}
                  placeholder={
                    currentQ.placeholder || "Specify your selection"
                  }
                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                />
              </div>
            )}
          </div>
        );
      }

      case "country": {
        const countryOptions = countryOptionsWithSelections(
          getCountryDropdownOptions(""),
          currentAnswer ? [currentAnswer] : [],
        );
        return (
          <ThemedSelect
            value={currentAnswer}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, [currentQ.id]: value }))
            }
            options={countryOptions}
            placeholder="Select country..."
            searchable
            aria-label={currentQ.text}
          />
        );
      }

      case "file": {
        const fileMeta = parseFileAnswer(currentAnswer);
        return (
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void handleFileSelect(currentQ.id, file);
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                className="h-12 rounded-full border-[#00AEEF] text-sm font-semibold text-[#00AEEF] hover:bg-[#e6f5fc]"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploadingFile ? "Uploading..." : "Choose File"}
              </Button>
              {fileMeta && (
                <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3">
                  <span className="truncate text-sm font-medium text-[#1b3a57]">
                    {fileMeta.fileName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFileSelect(currentQ.id, null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-8 w-8 shrink-0 rounded-full p-0 text-gray-500 hover:text-red-600"
                    aria-label="Clear file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {currentQ.placeholder && (
              <p className="text-sm text-gray-500">{currentQ.placeholder}</p>
            )}
            {currentQ.optional && (
              <p className="text-xs text-gray-400">
                This upload is optional — you may continue without attaching a file.
              </p>
            )}
          </div>
        );
      }

      default:
        return (
          <Input
            value={currentAnswer}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [currentQ.id]: e.target.value,
              }))
            }
            placeholder={currentQ.placeholder || "Please provide your answer"}
            className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
          />
        );
    }
  };

  const headerSection = (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
      <Image
        src={HEADER_IMAGE_URL}
        alt="RSM Header"
        width={1920}
        height={200}
        className="block h-auto w-full"
        priority
      />
    </section>
  );

  if (currentQuestion === 0) {
    return (
      <div className="relative min-h-screen">
        {headerSection}
        <section className="relative pb-16">
          <div className="relative mx-auto mt-12 max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
            <Card className="rounded-3xl border-2 border-[#3F9C35] bg-white shadow-[0_25px_70px_rgba(2,48,89,0.12)]">
              <CardHeader className="relative space-y-2 px-6 pb-4 pt-6 text-center">
                <CardTitle className="text-2xl font-semibold text-[#1b3a57] sm:text-3xl">
                  Business Information
                </CardTitle>
                <CardDescription className="text-base text-gray-500">
                  Please provide your information before starting the Pillar Two
                  Initial Scoping Readiness Assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handlePersonalInfoSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your name"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.name &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Business Email{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="your.email@company.com"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.email &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Company Legal Name{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your company legal name"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.company &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Position <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your job title"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.position &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Contact Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your contact number (optional)"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.phone &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Website <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="example.com"
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.website &&
                                    "border-red-500 focus-visible:ring-red-500",
                                )}
                              />
                            </FormControl>
                            {form.formState.submitCount > 0 && <FormMessage />}
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf]"
                    >
                      Continue to Questions
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const currentQ = visibleQuestions[currentQuestion - 1];
  const currentAnswer = currentQ ? answers[currentQ.id] || "" : "";

  return (
    <div className="relative min-h-screen">
      {headerSection}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 py-10 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {assessment === null && currentQ ? (
            <motion.div
              key={`question-${currentQuestion}`}
              className="relative z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-2 border-[#00AEEF] bg-white/95 shadow-[0_25px_70px_rgba(3,32,66,0.25)] backdrop-blur">
                <CardHeader className="relative border-b border-gray-100 px-6 py-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00AEEF]">
                      {currentQ.subject}
                    </span>
                    <CardTitle className="text-xl font-semibold leading-snug text-[#1b3a57] sm:text-2xl">
                      {currentQ.text}
                    </CardTitle>
                    <span className="text-xs font-medium text-gray-400">
                      Question {currentQuestion} of {TOTAL_QUESTIONS}
                    </span>
                    {currentQ.note && (
                      <div className="mt-2 rounded-xl border border-[#00AEEF]/20 bg-[#f8fbfd] px-4 py-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                        {currentQ.note}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="overflow-visible px-6 py-6">
                  {renderQuestionInput(currentQ, currentAnswer)}
                  {formErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                      {formErrors.map((error, index) => (
                        <p key={index}>{error}</p>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:justify-between">
                  <Button
                    onClick={handleBack}
                    disabled={currentQuestion === 1}
                    className="h-11 w-full rounded-full border border-gray-200 bg-white text-sm font-semibold text-[#1b3a57] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="h-11 w-full rounded-full bg-[#00AEEF] text-sm font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] sm:w-[220px]"
                  >
                    {currentQuestion === TOTAL_QUESTIONS ? "Finish" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ) : assessment ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-0 bg-white/95 shadow-[0_25px_70px_rgba(3,32,66,0.25)] backdrop-blur">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center justify-center">
                    <CardTitle className="text-center text-3xl font-semibold text-[#1b3a57]">
                      Assessment Results
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent
                  className={cn(styles.resultContainer, "px-6 pb-10 pt-2")}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="px-6 py-5 text-center"
                  >
                    <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
                      Thank you{" "}
                      <span className="font-semibold text-[#1b3a57]">
                        {personalInfo.name}
                      </span>{" "}
                      for completing the Pillar Two Initial Scoping Readiness
                      Assessment for{" "}
                      <span className="font-semibold text-[#1b3a57]">
                        {personalInfo.company}
                      </span>{" "}
                      on{" "}
                      <span className="font-semibold text-[#1b3a57]">
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      .
                    </p>
                  </motion.div>

                  {assessment.eligible ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        className="mt-4 px-6 py-3"
                      >
                        <div className="rounded-2xl border-2 border-[#3F9C35] bg-gradient-to-r from-[#f0fbf4] to-[#e6f5ed] px-6 py-5 shadow-md">
                          <div className="text-center">
                            <div className="mb-3">
                              <span className="rounded-md bg-[#3F9C35] px-3 py-1.5 text-sm font-bold text-white">
                                {assessment.outcomeTitle}
                              </span>
                            </div>
                            <p className="text-base font-semibold leading-relaxed text-[#1b3a57]">
                              {assessment.outcomeMessage}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.5 }}
                        className="mt-4 px-6 py-3"
                      >
                        <div className="overflow-hidden rounded-2xl border-2 border-[#00AEEF]/40 bg-gradient-to-br from-[#e8f7fd] via-[#d9f0fa] to-[#c5e8f6] shadow-[0_12px_40px_rgba(0,174,239,0.18)]">
                          <div className="border-b border-[#00AEEF]/25 bg-[#00AEEF]/10 px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00AEEF] text-white shadow-md shadow-[#00AEEF]/35">
                                <Check className="h-4 w-4" strokeWidth={3} />
                              </span>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0091cf]">
                                  Next step
                                </p>
                                <p className="text-sm font-semibold text-[#1b3a57] sm:text-base">
                                  In this meeting, we will:
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 px-5 py-4">
                            {(assessment.meetingBullets?.length
                              ? assessment.meetingBullets
                              : [
                                  "Walk through your detailed scoping results and identify key risk areas (e.g., accounting period alignments, entity classification, data readiness etc.).",
                                  "Present a customized compliance roadmap outlining critical milestones for 2025.",
                                ]
                            ).map((bullet, index) => (
                              <div
                                key={index}
                                className="flex gap-2.5 rounded-xl border border-[#00AEEF]/20 bg-white/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00AEEF] text-[10px] font-bold text-white">
                                  {index + 1}
                                </span>
                                <p className="text-xs leading-relaxed text-[#1b3a57] sm:text-sm">
                                  {bullet}
                                </p>
                              </div>
                            ))}

                            <div className="rounded-xl border border-dashed border-[#00AEEF]/40 bg-[#00AEEF]/5 px-3.5 py-2.5">
                              <p className="text-xs leading-relaxed text-[#1b3a57]/90 sm:text-sm">
                                {assessment.meetingPrompt ||
                                  "Please select a convenient time for the team via the meeting link below, or book a consultation with our Pillar Two specialists."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className={cn(styles.buttonContainer, "px-6")}
                      >
                        <Button
                          onClick={() => setIsConsultationModalOpen(true)}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] sm:flex-1"
                        >
                          <Phone className="h-5 w-5" />
                          Book a Consultation
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.5 }}
                      className="mt-4 px-6 py-4 text-center"
                    >
                      <div className="rounded-2xl border border-[#ef4444]/30 bg-gradient-to-r from-[#fff1f2] to-[#ffe4e6] px-6 py-5">
                        <p className="mb-2 text-base font-semibold text-[#1b3a57] sm:text-lg">
                          {assessment.outcomeTitle || "Out of Scope"}
                        </p>
                        <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                          {assessment.outcomeMessage ||
                            assessment.ineligibleReason}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.5 }}
                    className="mt-4 px-6 py-4 text-center"
                  >
                    <div className="rounded-2xl border border-[#009cde]/30 bg-gradient-to-r from-[#e6f5fc] to-[#d0ebf7] px-6 py-4">
                      <p className="mb-2 text-base font-semibold text-[#1b3a57] sm:text-lg">
                        Your Report is on the Way!
                      </p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        Your detailed assessment report will be sent to{" "}
                        <span className="font-semibold text-[#009cde]">
                          {personalInfo.email}
                        </span>{" "}
                        shortly. Please check your inbox for the complete PDF
                        report.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-4 px-6 py-4 text-center"
                  >
                    <p className="text-sm text-gray-700 sm:text-base">
                      Please contact the RSM Pillar Two team for further
                      assistance.
                    </p>
                  </motion.div>

                  {!isConsultationModalOpen && consultationSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-2xl border border-[#3F9C35]/30 bg-gradient-to-r from-[#f0fbf4] to-[#e6f5ed] px-6 py-5 text-center text-[#1b3a57]"
                    >
                      <p className="text-lg font-semibold text-[#1b3a57]">
                        Thank you for reaching out!
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        Our consulting team has received your request and will
                        get back to you shortly with available consultation
                        slots. A confirmation email is on its way to your inbox.
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {assessment === null && (
          <motion.div
            className="relative z-0 rounded-3xl border-2 border-[#3F9C35] bg-white/80 px-6 py-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative h-2 overflow-hidden rounded-full bg-[#EAF6FB]">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-[#009CD9]"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isConsultationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4 py-8"
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <Card className="border border-[#00AEEF]/20 bg-white shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
                <CardHeader className="relative px-6 pb-2 pt-6 text-center">
                  <button
                    onClick={() => {
                      setIsConsultationModalOpen(false);
                      setConsultationError(null);
                    }}
                    className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white p-1 text-gray-500 transition hover:text-gray-800"
                    aria-label="Close consultation form"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-semibold text-[#1b3a57]">
                    <UserRound className="h-6 w-6 text-[#00AEEF]" />
                    Book a Consultation
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Share a few details and our team will reach out with
                    available slots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <Form {...consultationForm}>
                    <form
                      onSubmit={consultationForm.handleSubmit(
                        handleConsultationSubmit,
                      )}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={consultationForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                First Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter first name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Last Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter last name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="your.email@company.com"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="+971 5X XXX XXXX"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {consultationError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {consultationError}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmittingConsultation}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Phone className="h-5 w-5" />
                        {isSubmittingConsultation
                          ? "Sending..."
                          : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
