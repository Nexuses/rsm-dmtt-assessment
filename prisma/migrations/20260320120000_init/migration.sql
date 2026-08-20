-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "totalScore" INTEGER NOT NULL,
    "outcomeTitle" TEXT NOT NULL,
    "outcomeMessage" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "ineligibleReason" TEXT,
    "answers" JSONB NOT NULL,
    "pdfS3Url" TEXT,
    "uploadedDocumentUrl" TEXT,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "score" INTEGER,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);
