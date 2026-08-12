import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Link } from '@react-pdf/renderer';
import { questionsData } from '@/lib/questions';
import { computeAssessment, DMTT_SCHEDULING_URL } from '@/lib/scoring';
import { formatAnswerDisplay } from '@/lib/format-answer';
import { google } from 'googleapis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

// Define the structure of the request body
interface AssessmentData {
  personalInfo: {
    name: string;
    email: string;
    company: string;
    position: string;
    phone?: string;
    website?: string;
  };
  answers: Record<string, string>;
  score?: number;
  assessment?: any;
}

interface PersonalInfo {
  name: string;
  email: string;
  company: string;
  position: string;
  phone?: string;
  website?: string;
}


// Create styles for the PDF
const createStyles = () => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#757574',
    position: 'relative',
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    flex: 1,
  },
  coverHeaderBand: {
    backgroundColor: '#009CD9',
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  coverLogoWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  coverLogo: {
    width: 90,
    height: 42,
    objectFit: 'contain',
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.35,
    marginBottom: 6,
    maxWidth: 480,
  },
  coverSubtitle: {
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.4,
    opacity: 0.95,
  },
  coverBody: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  coverLetterCard: {
    width: '100%',
    marginBottom: 0,
    padding: 20,
    paddingBottom: 18,
  },
  coverLetterGreeting: {
    fontSize: 11,
    color: '#1b3a57',
    marginBottom: 14,
    lineHeight: 1.5,
  },
  coverLetterSubject: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#009CD9',
    marginBottom: 18,
    lineHeight: 1.55,
  },
  coverLetterBody: {
    fontSize: 9.5,
    color: '#555554',
    marginBottom: 11,
    lineHeight: 1.7,
    textAlign: 'justify',
  },
  coverLetterClosingBlock: {
    marginTop: 10,
  },
  coverLetterClosing: {
    fontSize: 10,
    color: '#1b3a57',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  coverLetterSignatory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#009CD9',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  coverLetterFooterLine: {
    fontSize: 8.5,
    color: '#757574',
    marginBottom: 2,
    lineHeight: 1.45,
  },
  coverLetterFooterBold: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#757574',
    marginTop: 4,
    marginBottom: 2,
    lineHeight: 1.45,
  },
  closingContentArea: {
    padding: 40,
    paddingTop: 100,
    paddingBottom: 120,
    flex: 1,
  },
  assistancePageCenter: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 90,
    paddingBottom: 110,
  },
  assistanceCardCenter: {
    width: '100%',
    maxWidth: 460,
  },
  meetingCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#E8F7FD',
    borderWidth: 1.5,
    borderColor: '#00AEEF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  meetingCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1b3a57',
    marginBottom: 10,
    textAlign: 'left',
  },
  meetingBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B8E6F7',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  meetingBulletNumberWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00AEEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  meetingBulletNumber: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  meetingBulletText: {
    flex: 1,
    fontSize: 9,
    color: '#1b3a57',
    lineHeight: 1.45,
  },
  inquiryCardOuter: {
    marginTop: 24,
    width: '100%',
  },
  inquiryLead: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.6,
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
  },
  inquiryBody: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  inquiryBodyLast: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.55,
    marginBottom: 0,
    textAlign: 'left',
    width: '100%',
  },
  inquiryUrl: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#009CD9',
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  letterheadHeader: {
    backgroundColor: '#009CD9',
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
    textAlign: 'left',
  },
  companyTagline: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'left',
  },
  managingPartner: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  headerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    borderTopStyle: 'solid',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
  },
  documentDate: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'right',
  },
  contentArea: {
    padding: 40,
    // Keep enough space for the top-right logo, but avoid subtle overflow
    // that can cause @react-pdf/renderer to insert an extra (often blank) page.
    paddingTop: 70,
    paddingBottom: 30,
    flex: 1,
  },
  // Continuation pages: extra top padding so tables sit below the fixed logo
  contentAreaContinuation: {
    padding: 40,
    paddingTop: 110,
    paddingBottom: 90,
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2D9C2D',
    borderBottomStyle: 'solid',
    textAlign: 'left',
  },
  summaryCard: {
    backgroundColor: '#f0f9ff',
    padding: 25,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    width: '100%',
  },
  summaryCardCenter: {
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
  },
  infoRowLast: {
    flexDirection: 'row',
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    width: '32%',
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 11,
    color: '#009CD9',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  scoreContainer: {
    backgroundColor: '#f0f9ff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#757574',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 20,
  },
  percentageContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#009CD9',
    borderTopStyle: 'solid',
    alignItems: 'center',
    width: '100%',
  },
  percentageLabel: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  percentageValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#009CD9',
  },
  gaugeContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  gaugeOuter: {
    width: 200,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSemiCircle: {
    width: 200,
    height: 100,
    borderTopWidth: 8,
    borderTopColor: '#ef4444',
    borderLeftWidth: 8,
    borderLeftColor: '#ef4444',
    borderRightWidth: 8,
    borderRightColor: '#22c55e',
    borderRadius: 100,
    borderBottomWidth: 0,
    position: 'relative',
  },
  gaugeNeedle: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#1E293B',
    top: 20,
    left: 99,
  },
  gaugeCenter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    top: 100,
    left: 92,
  },
  gaugePercentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 10,
    textAlign: 'center',
  },
  gaugeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  gaugeLabel: {
    fontSize: 9,
    color: '#1E293B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009CD9',
    textAlign: 'center',
    lineHeight: 1.4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  questionsTableContainer: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionsTableContainerPageBreak: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pageFooterDisclaimer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
  },
  questionsTable: {
    marginTop: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D9C2D',
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#009CD9',
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
    borderRightStyle: 'solid',
  },
  tableHeaderCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#f8f9fa',
  },
  tableRowLast: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tableRowAltLast: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    borderRightStyle: 'solid',
  },
  tableCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableCellText: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.4,
  },
  letterheadFooter: {
    backgroundColor: '#757574',
    padding: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginTop: 'auto',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 1.3,
  },
  footerDescription: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'left',
    lineHeight: 1.2,
    fontStyle: 'italic',
  },
  disclaimerSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#009CD9',
    borderLeftStyle: 'solid',
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1b3a57',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  disclaimerTextBottom: {
    fontSize: 7,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 30,
    paddingRight: 40,
    paddingBottom: 20,
  },
  letterLogo: {
    width: 100,
    height: 85,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 40,
    paddingTop: 90,
    paddingBottom: 30,
  },
  reportHeaderLeft: {
    flex: 1,
    paddingRight: 20,
  },
  reportHeaderRight: {
    flex: 1,
    paddingLeft: 20,
    alignItems: 'flex-end',
  },
  reportHeaderRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  reportHeaderLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#757574',
  },
  reportHeaderValue: {
    fontSize: 10,
    color: '#757574',
  },
  reportHeaderCompanyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    marginBottom: 8,
    textAlign: 'right',
  },
  reportHeaderContact: {
    fontSize: 10,
    color: '#757574',
    marginBottom: 3,
    textAlign: 'right',
    lineHeight: 1.4,
  },
  pageLogoHeader: {
    position: 'absolute',
    top: 20,
    right: 40,
    zIndex: 10,
  },
  pageLogo: {
    width: 100,
    height: 72,
    objectFit: 'contain',
  },
  letterContent: {
    padding: 40,
    paddingTop: 135,
    flex: 1,
  },
  letterGreeting: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 15,
    lineHeight: 1.6,
  },
  letterSubject: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 20,
    lineHeight: 1.6,
    fontWeight: 'bold',
  },
  letterBody: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 15,
    lineHeight: 1.8,
    textAlign: 'left',
  },
  letterClosing: {
    fontSize: 11,
    color: '#757574',
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 1.6,
  },
  letterSignature: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 5,
    lineHeight: 1.6,
  },
  signatureName: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 5,
    lineHeight: 1.6,
  },
  signatureCompany: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 8,
    lineHeight: 1.6,
  },
  letterFooter: {
    fontSize: 10,
    color: '#757574',
    marginTop: 0,
    marginBottom: 2,
    lineHeight: 1.45,
    textAlign: 'left',
  },
  letterFooterBold: {
    fontSize: 10,
    color: '#757574',
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 1,
    lineHeight: 1.45,
    textAlign: 'left',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  disclaimerTextInline: {
    fontSize: 9,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
    flex: 1,
    paddingRight: 10,
  },
  disclaimerImage: {
    width: 180,
    height: 60,
    marginLeft: 10,
  },
});

const PDF_DISCLAIMER_TEXT =
  "Disclaimer\n\nThis report is intended for informational purposes only and does not constitute legal advice. Regulatory interpretation may vary based on organizational structure, industry sector, and processing activities. Businesses should seek professional counsel for formal compliance assessments under UAE law.\n\nRSM UAE is a member of the RSM Network and trades as RSM. RSM is the trading name used by the members of the RSM network. Each member of the RSM Network is an independent assurance, tax and consulting firm, each of which practices in its own right. The RSM Network is not itself a separate legal entity of any description in any jurisdiction. The RSM Network is administered by RSM International Limited, a company registered in England and Wales, company number 4040598, whose registered office is at 50 Cannon Street, London EC4N 6JJ. The brand and trademark RSM and other intellectual property rights used by members of the Network are owned by RSM International Association, an association governed by article 60 et seq of the Civil Code of Switzerland, whose seat is in Zug.";

const PDF_RSM_LOGO =
  "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png";

/** Embed remote images as data URIs so @react-pdf renders JPEG/PNG reliably (avoids blank white cover). */
async function fetchPdfImageDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load PDF image (${response.status}): ${url}`);
  }
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

// Helper function to generate PDF buffer
async function generatePDFBuffer(
  personalInfo: PersonalInfo,
  answers: Record<string, string>
): Promise<Buffer> {
  const styles = createStyles();
  const currentQuestions = questionsData;
  const assessment = computeAssessment(answers);

  let logoSrc = PDF_RSM_LOGO;
  try {
    logoSrc = await fetchPdfImageDataUri(PDF_RSM_LOGO);
  } catch (imageError) {
    console.warn("PDF logo: could not embed; using remote URL.", imageError);
  }

  const createDocument = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const currentDate = `${day}-${month}-${year}`;
    
    const allAnswers = Object.entries(answers);
    // PDF page 3: first 10 Q&As; PDF page 4: all remaining Q&As
    const questionsOnPage3 = 10;
    const questionChunksRaw: [string, string][][] = [];

    if (allAnswers.length > 0) {
      questionChunksRaw.push(allAnswers.slice(0, questionsOnPage3));
    }
    if (allAnswers.length > questionsOnPage3) {
      questionChunksRaw.push(allAnswers.slice(questionsOnPage3));
    }

    // Defensive: never render a page for an empty chunk (can lead to a blank page in some renderers)
    const questionChunks = questionChunksRaw.filter((chunk) => chunk.length > 0);
    
    const createQuestionRows = (answersChunk: [string, string][], isLastPage = false) => {
      return answersChunk.map(([questionId, answerValue]: [string, string], index: number) => {
        const question = currentQuestions.find((q) => q.id === questionId);
        let displayAnswer = '';

        displayAnswer = formatAnswerDisplay(question, answerValue as string);

        const globalIndex = allAnswers.findIndex(([id]) => id === questionId);
        const isLastRow = isLastPage && index === answersChunk.length - 1;
        const rowStyle = isLastRow 
          ? (globalIndex % 2 === 0 ? styles.tableRowLast : styles.tableRowAltLast)
          : (globalIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt);
        const cellStyle = isLastRow ? styles.tableCellLast : styles.tableCell;
        
        return React.createElement(View, { key: questionId, style: rowStyle },
          React.createElement(View, { style: cellStyle },
            React.createElement(Text, { style: styles.tableCellText }, question?.text || 'Unknown question')
          ),
          React.createElement(View, { style: styles.tableCellLast },
            React.createElement(Text, { style: styles.tableCellText }, displayAnswer)
          )
        );
      });
    };

    const pages = [];

    const createCoverLetterContent = () =>
      React.createElement(View, { style: [styles.summaryCard, styles.coverLetterCard] },
        React.createElement(Text, { style: styles.coverLetterGreeting },
          `Dear ${personalInfo.name || "Participant"},`
        ),
        React.createElement(Text, { style: styles.coverLetterSubject },
          `Subject: Pillar Two Initial Scoping Readiness Assessment Report – ${personalInfo.company || "Your Organization"}`
        ),
        React.createElement(Text, { style: styles.coverLetterBody },
          "We would like to thank you for your participation in completing the Pillar Two Initial Scoping Readiness Assessment."
        ),
        React.createElement(Text, { style: styles.coverLetterBody },
          "This report is auto-generated by the assessment platform, based solely on the responses provided by you. The results are shared as is, without validation, verification, independent testing, or review by our team."
        ),
        React.createElement(Text, { style: styles.coverLetterBody },
          "We believe that this report will assist you in gaining high-level insights into your organization's UAE DMTT / Pillar Two scoping position and identifying key areas for further review as you prepare for compliance."
        ),
        React.createElement(Text, { style: styles.coverLetterBody },
          "This report is intended solely for the use of management, and sharing should be limited only to authorized personnel within your organization."
        ),
        React.createElement(Text, { style: styles.coverLetterBody },
          "Please do not hesitate to contact us if you have any questions or would like to schedule a session on the outcome of this report with our team."
        ),
        React.createElement(View, { style: styles.coverLetterClosingBlock },
          React.createElement(Text, { style: styles.coverLetterClosing }, "Thanking you,"),
          React.createElement(Text, { style: styles.coverLetterSignatory }, "RSM UAE"),
          React.createElement(Text, { style: styles.coverLetterFooterBold }, "THE POWER OF BEING UNDERSTOOD"),
          React.createElement(Text, { style: styles.coverLetterFooterBold }, "AUDIT | TAX | CONSULTING"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "RSM UAE"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "Floor 14, WeWork Hub 71, Al Khatem Tower,"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "ADGM Square, Al Maryah Island"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "P.O. Box 46617"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "T: +971 (0)4 554 7423"),
          React.createElement(Text, { style: styles.coverLetterFooterLine }, "W: www.rsm.ae")
        )
      );

    const createCoverPage = () =>
      React.createElement(Page, { size: "A4", style: styles.coverPage },
        React.createElement(View, { style: styles.coverHeaderBand },
          React.createElement(View, { style: styles.coverLogoWrap },
            React.createElement(Image, { style: styles.coverLogo, src: logoSrc })
          ),
          React.createElement(Text, { style: styles.coverTitle },
            "RSM Pillar Two Initial Scoping Readiness Assessment"
          ),
          React.createElement(Text, { style: styles.coverSubtitle },
            "UAE DMTT / Pillar Two | Indicative Self-Assessment"
          )
        ),
        React.createElement(View, { style: styles.coverBody },
          createCoverLetterContent()
        )
      );

    const personalInfoRows: Array<[string, string]> = [
      ["Assessment Date", currentDate],
      ["Full Name", personalInfo.name],
      ["Email Address", personalInfo.email],
      ["Company", personalInfo.company],
      ["Position", personalInfo.position],
      ...(personalInfo.phone ? [["Phone", personalInfo.phone] as [string, string]] : []),
      ...(personalInfo.website ? [["Website", personalInfo.website] as [string, string]] : []),
    ];

    const createInfoRow = (label: string, value: string, isLast: boolean) =>
      React.createElement(View, { style: isLast ? styles.infoRowLast : styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, `${label}:`),
        React.createElement(Text, { style: styles.infoValue }, value || "—")
      );

    const createOverviewPage = () =>
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, { style: styles.pageLogo, src: logoSrc })
        ),
        React.createElement(View, { style: styles.contentArea },
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Personal Information"),
            React.createElement(View, { style: styles.summaryCard },
              ...personalInfoRows.map(([label, value], index) =>
                createInfoRow(label, value, index === personalInfoRows.length - 1)
              )
            )
          ),
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Assessment Summary"),
            React.createElement(View, { style: [styles.summaryCard, styles.summaryCardCenter] },
              React.createElement(Text, { style: styles.scoreLabel }, assessment.outcomeTitle || "Assessment Outcome"),
              React.createElement(Text, { style: styles.resultText }, assessment.outcomeMessage || assessment.phaseRecommendation.description),
              React.createElement(Text, { style: styles.resultText }, `Status: ${assessment.eligible ? "In Scope — Subject to DMTT / Pillar Two" : "Out of Scope"}`),
            )
          )
        )
      );

    const createFurtherAssistancePage = () =>
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, { style: styles.pageLogo, src: logoSrc })
        ),
        React.createElement(View, { style: styles.assistancePageCenter },
          React.createElement(View, { style: [styles.summaryCard, styles.assistanceCardCenter] },
            React.createElement(View, { style: styles.summaryCardCenter },
              React.createElement(Text, { style: styles.scoreLabel }, "Further Assistance")
            ),
            React.createElement(Text, { style: styles.inquiryBody },
              "For any queries regarding UAE DMTT / Pillar Two scoping, registration, or the interpretation of this assessment report, please contact the RSM Pillar Two team."
            ),
            React.createElement(Link, { src: DMTT_SCHEDULING_URL, style: styles.inquiryUrl },
              "Schedule a Meeting"
            ),
            React.createElement(Text, { style: styles.inquiryBodyLast },
              "Our Pillar Two specialists can support you with scoping analysis, compliance roadmapping, and ongoing advisory under the UAE DMTT framework."
            )
          )
        ),
        React.createElement(View, { style: styles.pageFooterDisclaimer },
          React.createElement(Text, { style: styles.disclaimerTextBottom }, PDF_DISCLAIMER_TEXT)
        )
      );
    
    // Second page: Letter format - COMMENTED OUT FOR NOW (will be added back later)
    /*
    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, {
            style: styles.pageLogo,
            src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/RSM%20Logo%20-%20Color.png"
          })
        ),
        React.createElement(View, { style: styles.reportHeader },
          React.createElement(View, { style: styles.reportHeaderLeft },
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Date: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, currentDate)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Name: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.name)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Position: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.position)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Company Name: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.company)
            )
          ),
          React.createElement(View, { style: styles.reportHeaderRight },
            React.createElement(Text, { style: styles.reportHeaderCompanyName }, "RSM Albazie Consulting W.L.L."),
            React.createElement(Text, { style: styles.reportHeaderContact }, "Arraya Tower 2, Floors 41 & 42"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "Abdulaziz Hamad Alsaqar St., Sharq"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "P.O. Box 2115, Safat 13022, State of Kuwait"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "T: +965 22961000"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "F: +965 22412761"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "www.rsm.global/kuwait")
          )
        ),
        React.createElement(View, { style: styles.letterContent },
          React.createElement(Text, { style: styles.letterGreeting },
            `Dear ${personalInfo.name},`
          ),
          React.createElement(Text, { style: styles.letterSubject },
            `Subject: Abridged E-invoicing Self-Assessment Report - ${personalInfo.company}`
          ),
          React.createElement(Text, { style: styles.letterBody },
            "We would like to thank you for your participation in completing the E-invoicing self-assessment questionnaire. This report is auto generated by the assessment platform, based solely on the responses provided by you. The results are shared as is, without validation, verification, or independent testing and review by our team."
          ),
          React.createElement(Text, { style: styles.letterBody },
            "We believe that this report will assist you in providing high level insights into your organization's E-invoicing compliance preparedness and provide areas for improvement as you continue your journey in adopting this framework. This report is intended solely for the use of management and sharing should be limited only to authorized personnel in your organization."
          ),
          React.createElement(Text, { style: styles.letterBody },
            "Please do not hesitate to contact us if you have any questions or would like to schedule a session on the outcome of this report with our cybersecurity team."
          ),
          React.createElement(Text, { style: styles.letterClosing },
            "Thanking You,"
          ),
          React.createElement(Text, { style: styles.signatureName },
            "Bhaskar Maheshwari"
          ),
          React.createElement(Text, { style: styles.signatureCompany },
            "RSM Albazie Consulting W.L.L."
          ),
          React.createElement(Text, { style: styles.letterFooterBold },
            "THE POWER OF BEING UNDERSTOOD"
          ),
          React.createElement(Text, { style: styles.letterFooterBold },
            "ASSURANCE | TAX | CONSULTING"
          ),
          React.createElement(View, { style: styles.disclaimerContainer },
            React.createElement(Text, { style: styles.disclaimerTextInline },
              "RSM Albazie Consulting W.L.L. is a member of the RSM network and trades as RSM. RSM is the trading name used by the members of the RSM network. Each member of the RSM network is an independent accounting and consulting firm which practices in its own right. The RSM network is not itself a separate legal entity in any jurisdiction."
            ),
            React.createElement(Image, {
              style: styles.disclaimerImage,
              src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/Screenshot%202026-01-06%20at%207.05.31%20PM.png"
            })
          )
        )
      )
    );
    */

    const firstChunk = questionChunks[0] || [];
    const remainingChunks = questionChunks.slice(1);

    pages.push(createCoverPage());
    pages.push(createOverviewPage());

    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, { style: styles.pageLogo, src: logoSrc })
        ),
        React.createElement(View, { style: styles.contentArea },
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Assessment Details"),
            React.createElement(View, { style: styles.questionsTableContainer },
              React.createElement(View, { style: styles.questionsTable },
                React.createElement(View, { style: styles.tableHeader },
                  React.createElement(View, { style: styles.tableHeaderCell },
                    React.createElement(Text, { style: styles.tableHeaderText }, "Question")
                  ),
                  React.createElement(View, { style: styles.tableHeaderCellLast },
                    React.createElement(Text, { style: styles.tableHeaderText }, "Response")
                  )
                ),
                ...createQuestionRows(firstChunk, remainingChunks.length === 0)
              )
            )
          )
        )
      )
    );

    remainingChunks.forEach((chunk, chunkIndex) => {
      const isLastChunk = chunkIndex === remainingChunks.length - 1;

      pages.push(
        React.createElement(Page, { size: "A4", style: styles.page },
          React.createElement(View, { style: styles.pageLogoHeader },
            React.createElement(Image, { style: styles.pageLogo, src: logoSrc })
          ),
          React.createElement(View, { style: styles.contentAreaContinuation },
            React.createElement(View, { style: styles.section },
              React.createElement(View, { 
                style: styles.questionsTableContainerPageBreak 
              },
                React.createElement(View, { style: styles.questionsTable },
                  ...createQuestionRows(chunk, isLastChunk)
                )
              )
            )
          )
        )
      );
    });

    pages.push(createFurtherAssistancePage());

    return React.createElement(Document, {}, ...pages);
  };

  // Generate PDF buffer - use blob() method and convert to Buffer
  const pdfDoc = pdf(createDocument());
  const blob = await pdfDoc.toBlob();
  
  // Convert Blob to Buffer
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Build email attachments from user-uploaded assessment files (e.g. ownership structure).
function getUserUploadAttachments(
  answers: Record<string, string>,
): Array<{ filename: string; content: Buffer; contentType: string }> {
  const attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [];

  for (const question of questionsData) {
    if (question.responseType !== 'file') continue;
    const raw = answers[question.id];
    if (!raw?.trim()) continue;

    try {
      const parsed = JSON.parse(raw) as {
        fileName?: string;
        fileType?: string;
        base64?: string;
      };
      if (!parsed.fileName || !parsed.base64) continue;

      attachments.push({
        filename: parsed.fileName,
        content: Buffer.from(parsed.base64, 'base64'),
        contentType: parsed.fileType || 'application/octet-stream',
      });
    } catch (error) {
      console.warn(`Could not parse uploaded file for ${question.id}:`, error);
    }
  }

  return attachments;
}

function getParsedUserUploads(answers: Record<string, string>): Array<{
  questionId: string;
  fileName: string;
  fileType: string;
  content: Buffer;
}> {
  const uploads: Array<{
    questionId: string;
    fileName: string;
    fileType: string;
    content: Buffer;
  }> = [];

  for (const question of questionsData) {
    if (question.responseType !== 'file') continue;
    const raw = answers[question.id];
    if (!raw?.trim()) continue;

    try {
      const parsed = JSON.parse(raw) as {
        fileName?: string;
        fileType?: string;
        base64?: string;
      };
      if (!parsed.fileName || !parsed.base64) continue;

      uploads.push({
        questionId: question.id,
        fileName: parsed.fileName,
        fileType: parsed.fileType || 'application/octet-stream',
        content: Buffer.from(parsed.base64, 'base64'),
      });
    } catch (error) {
      console.warn(`Could not parse uploaded file for ${question.id}:`, error);
    }
  }

  return uploads;
}

function columnToLetter(column: number): string {
  // Helper: convert column number to letter (e.g., 1 -> A, 27 -> AA)
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function getAwsS3Config(): {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
} | null {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('AWS S3 credentials or bucket name not configured:', {
      AWS_ACCESS_KEY_ID: accessKeyId ? '✓ Set' : '✗ Missing',
      AWS_SECRET_ACCESS_KEY: secretAccessKey ? '✓ Set' : '✗ Missing',
      AWS_S3_BUCKET_NAME: bucketName ? `✓ Set (${bucketName})` : '✗ Missing',
      AWS_REGION: region ? `✓ Set (${region})` : '✗ Missing',
    });
    return null;
  }

  return { region, accessKeyId, secretAccessKey, bucketName };
}

async function uploadBufferToS3(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string | null> {
  const config = getAwsS3Config();
  if (!config) return null;

  const { region, accessKeyId, secretAccessKey, bucketName } = config;

  try {
    const s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    console.log('AWS S3: Uploading file...', {
      bucket: bucketName,
      region,
      key: params.key,
      fileSize: params.buffer.length,
      contentType: params.contentType,
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
        ACL: 'private',
      }),
    );

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${params.key}`;
    console.log('AWS S3: Successfully uploaded to S3:', s3Url);
    return s3Url;
  } catch (error: any) {
    console.error('AWS S3: Error uploading to S3:', error);
    console.error('AWS S3: Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
    });
    return null;
  }
}

// Function to upload PDF to S3
async function uploadPDFToS3(
  pdfBuffer: Buffer,
  companyName: string,
  personalInfo: PersonalInfo
): Promise<string | null> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedEmail = personalInfo.email.replace(/[^a-zA-Z0-9]/g, '_');
  const key = `dmtt-pillar-two-assessments/${sanitizedCompanyName}_${timestamp}_${sanitizedEmail}.pdf`;

  return uploadBufferToS3({
    buffer: pdfBuffer,
    key,
    contentType: 'application/pdf',
  });
}

/** Upload user-attached documents (e.g. ownership structure) to S3 and return URLs. */
async function uploadUserDocumentsToS3(
  answers: Record<string, string>,
  personalInfo: PersonalInfo,
): Promise<{ urls: string[]; primaryUrl: string | null }> {
  const uploads = getParsedUserUploads(answers);
  if (uploads.length === 0) {
    return { urls: [], primaryUrl: null };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedCompanyName = personalInfo.company.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedEmail = personalInfo.email.replace(/[^a-zA-Z0-9]/g, '_');
  const urls: string[] = [];

  for (const upload of uploads) {
    const safeName = upload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `dmtt-pillar-two-uploads/${sanitizedCompanyName}_${timestamp}_${sanitizedEmail}_${upload.questionId}_${safeName}`;

    const url = await uploadBufferToS3({
      buffer: upload.content,
      key,
      contentType: upload.fileType,
    });

    if (url) {
      urls.push(url);
      console.log(`AWS S3: User upload ${upload.fileName} → ${url}`);
    } else {
      console.warn(`AWS S3: Failed to upload user document ${upload.fileName}`);
    }
  }

  return { urls, primaryUrl: urls[0] || null };
}

// Function to write assessment data to Google Sheets
function normalizeSheetHeader(value: string): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // strip zero-width chars
    .replace(/[^a-z0-9]/g, "");
}

function safeCellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatAnswerForSheet(
  question: (typeof questionsData)[number],
  answerValue: string,
): string {
  return formatAnswerDisplay(question, answerValue);
}

async function writeToGoogleSheets(
  personalInfo: PersonalInfo,
  answers: Record<string, string>,
  score: number,
  pdfS3Url?: string | null,
  uploadedDocumentUrl?: string | null,
) {
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      console.error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set');
      return;
    }

    // Parse credentials with better error handling
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
      console.log('Google Sheets: Credentials parsed successfully. Service account:', credentials.client_email);
    } catch (parseError: any) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', parseError.message);
      console.error('First 100 chars of credentials:', process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS?.substring(0, 100));
      return;
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId =
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
      process.env.GOOGLE_SHEET_ID ||
      // Default to the sheet you provided in chat
      '17IoNsq0xAWSzJVgwnPC_Ej_eUGucW9iw6iVbvanUunE';

    const sheetName =
      process.env.GOOGLE_SHEETS_ASSESSMENT_SHEET_NAME ||
      process.env.GOOGLE_SHEETS_SHEET_NAME ||
      'Sheet1';

    console.log('Google Sheets: Using spreadsheet:', spreadsheetId, 'Sheet:', sheetName);

    // Get current questions
    const currentQuestions = questionsData;

    const assessment = computeAssessment(answers);
    // Build a canonical data map (values are strings for cells)
    const timestamp = new Date().toISOString();
    const baseFields: Record<string, string> = {
      Timestamp: timestamp,
      Name: personalInfo.name,
      Email: personalInfo.email,
      Company: personalInfo.company,
      Position: personalInfo.position,
      Phone: personalInfo.phone || "",
      Website: personalInfo.website || "",
      "Total Score": assessment.totalScore.toString(),
      Outcome: assessment.outcomeTitle || "",
      "Outcome Message": assessment.outcomeMessage || "",
      Eligible: assessment.eligible ? "Yes" : "No",
      "Ineligible Reason": assessment.ineligibleReason || "",
      "Uploaded Document URL": uploadedDocumentUrl || "",
      // Don't set PDF S3 Link here - we'll add it separately to ensure it takes precedence
    };

    // Desired headers (we will create headers if missing, and append any missing columns)
    const desiredHeaders: string[] = [
      ...Object.keys(baseFields),
      ...currentQuestions.map((q) => {
        const qNum = q.id.replace(/^q/i, "");
        const cleanText = (q.text || "").replace(/\s+/g, " ").trim();
        const label = `Q${qNum} - ${cleanText}`;
        return label.length > 140 ? `${label.slice(0, 137)}...` : label;
      }),
    ];

    // Alias map: normalized header -> value
    const normalizedValueByHeader = new Map<string, string>();
    const addAlias = (header: string, value: string, forceOverwrite = false) => {
      const n = normalizeSheetHeader(header);
      if (!n) return;
      // If forceOverwrite is true, always set the value
      // Otherwise, prefer the first non-empty value encountered
      if (forceOverwrite || !normalizedValueByHeader.has(n) || !normalizedValueByHeader.get(n)) {
        normalizedValueByHeader.set(n, value);
      }
    };

    Object.entries(baseFields).forEach(([k, v]) => addAlias(k, v));

    // Add PDF S3 Link separately - ensure it takes precedence and add multiple aliases
    // This must be done AFTER baseFields to ensure the actual URL overwrites any empty value
    // Use forceOverwrite=true to ensure the S3 URL always takes precedence
    const pdfLinkValue = pdfS3Url || "";
    addAlias("PDF S3 Link", pdfLinkValue, true);
    addAlias("PDF S3 URL", pdfLinkValue, true);
    addAlias("PDF Link", pdfLinkValue, true);
    addAlias("S3 Link", pdfLinkValue, true);
    addAlias("S3 URL", pdfLinkValue, true);
    addAlias("PDF URL", pdfLinkValue, true);

    const uploadLinkValue = uploadedDocumentUrl || "";
    addAlias("Uploaded Document URL", uploadLinkValue, true);
    addAlias("Uploaded Document S3 URL", uploadLinkValue, true);
    addAlias("Ownership Structure URL", uploadLinkValue, true);
    addAlias("Upload URL", uploadLinkValue, true);
    
    if (pdfS3Url) {
      console.log('Google Sheets: PDF S3 URL to write:', pdfS3Url);
      console.log('Google Sheets: PDF S3 Link aliases added to mapping');
    } else {
      console.log('Google Sheets: PDF S3 URL is empty/null - AWS S3 may not be configured or upload failed');
    }

    if (uploadedDocumentUrl) {
      console.log('Google Sheets: Uploaded document S3 URL to write:', uploadedDocumentUrl);
    } else {
      console.log('Google Sheets: No uploaded document URL (user may have skipped attachment)');
    }
    
    // Also add it to baseFields for the desired headers list
    baseFields["PDF S3 Link"] = pdfLinkValue;
    baseFields["Uploaded Document URL"] = uploadLinkValue;

    currentQuestions.forEach((q) => {
      const answerValue = answers[q.id] || "";
      const displayValue = formatAnswerForSheet(q, answerValue);
      const qNum = q.id.replace(/^q/i, "");
      addAlias(q.id, displayValue); // q5
      addAlias(`Q${qNum}`, displayValue); // Q5
      addAlias(`Question ${qNum}`, displayValue);
      addAlias(q.text || "", displayValue);
      addAlias(`Q${qNum} - ${q.text || ""}`, displayValue);

      // Helpful extra synonyms for the VAT eligibility question (if present)
      if (q.id.toLowerCase() === "q5") {
        addAlias("VAT Registered", displayValue);
        addAlias("VAT registration", displayValue);
      }
    });

    // Read existing headers (analyze), extend if needed, then map values by header
    console.log('Google Sheets: Reading existing headers from', `${sheetName}!1:1`);
    const existingHeaderResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    console.log('Google Sheets: Existing headers found:', existingHeaderResp.data.values?.[0]?.length || 0);

    const existingHeaders: string[] =
      existingHeaderResp.data.values && existingHeaderResp.data.values[0]
        ? existingHeaderResp.data.values[0].map((h) => safeCellString(h))
        : [];

    const existingHeaderSet = new Set(existingHeaders.map(normalizeSheetHeader).filter(Boolean));

    let finalHeaders: string[] = existingHeaders.length > 0 ? [...existingHeaders] : [];

    // If no headers yet, create from desired headers
    if (finalHeaders.length === 0) {
      finalHeaders = [...desiredHeaders];
    } else {
      // Append any missing desired headers so we can capture ALL details
      for (const h of desiredHeaders) {
        const nh = normalizeSheetHeader(h);
        if (nh && !existingHeaderSet.has(nh)) {
          finalHeaders.push(h);
          existingHeaderSet.add(nh);
        }
      }
    }

    const lastColumnLetter = columnToLetter(finalHeaders.length);
    const headerRange = `${sheetName}!A1:${lastColumnLetter}1`;

    // Ensure header row matches finalHeaders (without overwriting user-defined columns order)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [finalHeaders] },
    });

    // Build row in the exact header order
    const rowData = finalHeaders.map((h, index) => {
      const normalized = normalizeSheetHeader(h);
      const direct = normalizedValueByHeader.get(normalized);
      if (direct !== undefined) {
        // Log PDF S3 Link mapping for debugging
        if (normalized.includes('pdf') && (normalized.includes('link') || normalized.includes('url'))) {
          console.log(`Google Sheets: Mapped "${h}" (normalized: "${normalized}") at column ${index + 1} to value:`, direct || '(empty)', 'Length:', direct?.length || 0);
        }
        return direct;
      }

      // Heuristic: if header contains something like "q5", map to that question
      const qMatch = (h || "").match(/q\s*0*(\d+)/i);
      if (qMatch?.[1]) {
        const qKey = normalizeSheetHeader(`q${qMatch[1]}`);
        const fromQ = normalizedValueByHeader.get(qKey);
        if (fromQ !== undefined) return fromQ;
      }

      return "";
    });

    // Find PDF S3 Link column index for logging
    const pdfLinkHeaderIndex = finalHeaders.findIndex(h => {
      const n = normalizeSheetHeader(h);
      return n.includes('pdf') && (n.includes('link') || n.includes('url'));
    });
    const pdfLinkValueInRow = pdfLinkHeaderIndex >= 0 ? rowData[pdfLinkHeaderIndex] : 'N/A';
    
    // Debug: Check what's in the normalizedValueByHeader map for PDF S3 Link
    const pdfLinkNormalized = normalizeSheetHeader("PDF S3 Link");
    const pdfLinkInMap = normalizedValueByHeader.get(pdfLinkNormalized);

    console.log("Google Sheets: Writing row with", {
      spreadsheetId,
      sheetName,
      headerCount: finalHeaders.length,
      rowCellCount: rowData.length,
      firstFewHeaders: finalHeaders.slice(0, 5),
      firstFewValues: rowData.slice(0, 5),
      pdfS3LinkColumnIndex: pdfLinkHeaderIndex,
      pdfS3LinkHeader: pdfLinkHeaderIndex >= 0 ? finalHeaders[pdfLinkHeaderIndex] : 'Not found',
      pdfS3LinkValueInRow: pdfLinkValueInRow,
      pdfS3LinkValueInMap: pdfLinkInMap,
      pdfS3UrlProvided: pdfS3Url || '(null/empty)',
      normalizedKey: pdfLinkNormalized,
      mapHasKey: normalizedValueByHeader.has(pdfLinkNormalized),
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:${lastColumnLetter}`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [rowData] },
    });

    console.log('Google Sheets: Successfully wrote assessment data to Google Sheets');
  } catch (error: any) {
    console.error('Google Sheets: Error writing to Google Sheets:', error);
    console.error('Google Sheets: Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      response: error?.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
    
    // Common error: Sheet not shared with service account
    if (error?.code === 403 || error?.response?.status === 403) {
      console.error('Google Sheets: PERMISSION DENIED - Make sure the spreadsheet is shared with:', 
        process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? 
          JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS).client_email : 
          'the service account email');
    }
    
    // Don't throw error - we don't want to fail the email sending if sheets write fails
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { personalInfo, answers } = req.body as AssessmentData
  const assessment = computeAssessment(answers);
  const currentQuestions = questionsData;

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  // Prepare email content with HTML formatting
  const emailContent = `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            direction: ltr;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          .score { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .logo { display: block; margin: 0 auto; max-width: 200px; background: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png" alt="RSM Logo" class="logo">
          <h1>Pillar Two Initial Scoping Readiness Assessment</h1>
          <div class="section">
            <table>
              <tr>
                <th colspan="2">Personal Information</th>
              </tr>
              <tr>
                <td><strong>Name:</strong></td>
                <td>${personalInfo.name}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>${personalInfo.email}</td>
              </tr>
              <tr>
                <td><strong>Company:</strong></td>
                <td>${personalInfo.company}</td>
              </tr>
              <tr>
                <td><strong>Position:</strong></td>
                <td>${personalInfo.position}</td>
              </tr>
              <tr>
                <td><strong>Website:</strong></td>
                <td>${personalInfo.website || '—'}</td>
              </tr>
            </table>
          </div>
          <div class="section">
            <h2 class="score">${assessment.outcomeTitle || 'Assessment Outcome'}</h2>
            <p style="text-align:center;margin:8px 0 0 0;">
              <strong>Status:</strong> ${assessment.eligible ? 'In Scope — Subject to DMTT / Pillar Two' : 'Out of Scope'}<br/>
              ${assessment.outcomeMessage || assessment.ineligibleReason || ''}
            </p>
          </div>
          <div class="section">
            <table>
              <tr>
                <th>Question</th>
                <th>Subject</th>
                <th>Answer</th>
              </tr>
              ${Object.entries(answers).map(([questionId, answerValue]) => {
                const question = currentQuestions.find(q => q.id === questionId);
                const displayAnswer = formatAnswerDisplay(question, answerValue as string);
                
                return `
                  <tr>
                    <td>${question?.text || 'Unknown question'}</td>
                    <td>${question?.subject || 'N/A'}</td>
                    <td>${displayAnswer}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>
        </div>
      </body>
    </html>
  `

  let userEmailSent = false;
  
  try {
    // Validate email address (always check this)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      console.error('Invalid email address:', personalInfo.email);
      return res.status(400).json({ message: 'Invalid email address provided.' });
    }

    console.log('Starting assessment processing for:', personalInfo.email, personalInfo.company);

    // Check if email is configured (but don't block if it's not - Google Sheets is more important)
    const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL);
    if (!emailConfigured) {
      console.warn('Email configuration is missing - will skip email sending but still write to Google Sheets:', {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        FROM_EMAIL: !!process.env.FROM_EMAIL,
      });
    }

    // Generate PDF buffer once (used for both S3 upload and email attachment)
    let pdfBuffer: Buffer | null = null;
    let pdfS3Url: string | null = null;
    let uploadedDocumentUrl: string | null = null;
    
    try {
      console.log('Generating PDF buffer...');
      pdfBuffer = await generatePDFBuffer(personalInfo, answers);
      console.log('PDF buffer generated successfully, size:', pdfBuffer.length, 'bytes');

      // Upload PDF to S3 (optional)
      console.log('Starting S3 upload for company:', personalInfo.company);
      pdfS3Url = await uploadPDFToS3(pdfBuffer, personalInfo.company, personalInfo);
      
      if (pdfS3Url) {
        console.log('S3 upload SUCCESS - URL:', pdfS3Url);
      } else {
        console.warn('S3 upload FAILED or skipped - PDF S3 URL will be empty in Google Sheets');
        console.warn('To enable S3 uploads, configure AWS credentials in .env.local:');
        console.warn('  - AWS_ACCESS_KEY_ID');
        console.warn('  - AWS_SECRET_ACCESS_KEY');
        console.warn('  - AWS_S3_BUCKET_NAME');
        console.warn('  - AWS_REGION');
      }
    } catch (pdfError) {
      console.error('PDF generation/upload failed, continuing without PDF URL:', pdfError);
      if (pdfError instanceof Error) {
        console.error('PDF Error details:', {
          message: pdfError.message,
          stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined,
        });
      }
    }

    // Upload user attachment(s) to S3 (ownership structure, etc.)
    try {
      console.log('Uploading user document(s) to S3 (if any)...');
      const uploadResult = await uploadUserDocumentsToS3(answers, personalInfo);
      uploadedDocumentUrl = uploadResult.primaryUrl;
      if (uploadedDocumentUrl) {
        console.log('User document S3 upload SUCCESS - URL:', uploadedDocumentUrl);
        if (uploadResult.urls.length > 1) {
          console.log('Additional user document URLs:', uploadResult.urls.slice(1).join(', '));
        }
      } else {
        console.log('No user document uploaded (skipped or S3 unavailable)');
      }
    } catch (uploadError) {
      console.error('User document S3 upload failed:', uploadError);
    }

    // Write assessment data to Google Sheets FIRST (before email processing)
    // This ensures data is captured even if email fails
    console.log('Writing to Google Sheets...');
    try {
      await writeToGoogleSheets(
        personalInfo,
        answers,
        assessment.totalScore,
        pdfS3Url,
        uploadedDocumentUrl,
      );
      console.log('Google Sheets write completed');
    } catch (sheetsError) {
      console.error('Error writing to Google Sheets:', sheetsError);
      // Don't fail the whole request if Google Sheets fails, but log it
    }

    // If email is not configured, return success (Google Sheets already wrote)
    if (!emailConfigured) {
      console.log('Assessment processing completed (Google Sheets only, email skipped)');
      return res.status(200).json({ 
        message: 'Assessment results saved successfully',
        emailSent: false,
        sheetsWritten: true,
        timestamp: new Date().toISOString()
      });
    }

    // If PDF generation failed and email is configured, generate it now for email attachment
    if (!pdfBuffer) {
      console.log('Generating PDF buffer for email attachment...');
      pdfBuffer = await generatePDFBuffer(personalInfo, answers);
    }

    // Prepare user email content with appointment booking information
    const userEmailContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your RSM Pillar Two Scoping Assessment Report</title>
          <style>
              /* Resets and Core Styles */
              body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
              img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
              body { margin: 0; padding: 0; background-color: #ffffff; font-family: Helvetica, Arial, sans-serif; color: #333333; }
              
              /* RSM Color Palette */
              .rsm-blue { color: #00153D; }
              .bg-rsm-blue { background-color: #00153D; }
              .bg-light-gray { background-color: #f4f4f4; }
              
              /* Components */
              .container { width: 100%; max-width: 600px; margin: 0 auto; }
              .rounded-block { border-radius: 16px; overflow: hidden; }
              .attachment-badge { background-color: #eef2f6; color: #009cde; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; border: 1px solid #ccdbe8; }
              
              /* Typography */
              h1 { font-size: 32px; font-weight: bold; margin: 0 0 20px 0; color: #009cde; line-height: 1.2; }
              h2 { font-size: 20px; font-weight: bold; margin: 0 0 15px 0; color: #009cde; }
              h3 { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #ffffff; }
              p { font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
              
              /* List Items in Grey Box */
              .list-title { font-size: 16px; font-weight: bold; color: #3f9c35; margin-bottom: 4px; }
              .list-desc { font-size: 15px; color: #555555; line-height: 1.5; margin: 0; }
              
              .disclaimer { font-size: 12px; color: #777777; line-height: 1.5; }
              .footer-text { font-size: 12px; color: #999999; line-height: 1.5; }

              /* Buttons */
              .btn-primary { display: inline-block; padding: 14px 30px; background-color: #00153D; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 30px; font-size: 16px; text-align: center; }
              .btn-secondary { display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #009cde !important; text-decoration: none; font-weight: bold; border-radius: 30px; font-size: 14px; text-align: center; border: 2px solid #ffffff; }

              /* Spacing Utility */
              .p-40 { padding: 40px; }
              .p-30 { padding: 30px; }
              .mb-30 { margin-bottom: 30px; }
              .mt-30 { margin-top: 30px; }

              /* Mobile Responsive */
            @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; padding-left: 20px; padding-right: 20px; }
                  .p-40 { padding: 30px 20px !important; }
                  .p-30 { padding: 25px 20px !important; }
                  .mobile-stack { display: block !important; width: 100% !important; padding-bottom: 20px; }
                  h1 { font-size: 26px !important; }
            }
          </style>
        </head>
        <body>

          <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                  <td align="center" style="padding-top: 30px; padding-bottom: 40px;">
                      <table class="container" border="0" cellpadding="0" cellspacing="0">
                          
                          <tr>
                              <td align="left" style="padding-bottom: 30px;">
                                  <img src="https://i.imgur.com/k83w5gc.png" alt="RSM Logo" width="120">
                              </td>
                          </tr>

                          <tr>
                              <td align="left" style="padding-bottom: 20px;">
                                  <h1>Your Pillar Two Scoping Assessment Report is Ready</h1>
                                  <p>Dear ${personalInfo.name},<br><br>We would like to thank you for your participation in completing the Pillar Two Initial Scoping Readiness Assessment for ${personalInfo.company}. This report contains a summary of your responses regarding Group Revenue Threshold, Group Structure, Ultimate Parent Entity, and UAE Jurisdiction considerations.</p>
                                  <p>Based on the information you have provided, our team can support you with a detailed scoping review and compliance roadmap under the UAE DMTT / Pillar Two framework.</p>
                                  <p>Please do not hesitate to contact us if you have any questions or would like to schedule a consultation session with our Pillar Two team to discuss the next steps.</p>
                              </td>
                          </tr>

                          <tr>
                              <td align="center" style="padding-bottom: 15px;">
                                  <table border="0" cellspacing="0" cellpadding="0">
                                      <tr>
                                          <td class="attachment-badge">
                                              <strong>Note:</strong> Your full PDF report is attached below
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>

                          <!-- Image removed for now - will be added back later -->
                          <!--
                          <tr>
                              <td align="center" style="padding-bottom: 30px;">
                                  <img src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20KUWAIT%20TAX/RSM%20Kuwait%20brand/d007d516-b985-4230-ae81-70467da2a078.png" alt="Assessment Report Preview" width="100%" style="border-radius: 16px; border: 1px solid #eeeeee;">
                              </td>
                          </tr>
                          -->

                          <tr>
                              <td style="padding-bottom: 30px;">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0" class="rounded-block bg-rsm-blue">
                                      <tr>
                                          <td class="p-40" valign="middle" style="color: #ffffff;">
                                              <p style="color: #e0e0e0; margin-bottom: 0;">Our team specializes in UAE DMTT / Pillar Two scoping, registration support, and compliance advisory. Please contact us to schedule a consultation on how we can assist with your organization's Pillar Two readiness.</p>
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>

                          <tr>
                              <td align="left" style="padding-top: 20px; border-top: 1px solid #eeeeee;">
                                  <p class="disclaimer"><strong>Disclaimer:</strong> This Pillar Two Initial Scoping Readiness Assessment is designed to gather high-level information about your organization's potential applicability under the UAE DMTT / Pillar Two Rules. The information provided will be used to guide further discussion and advisory support. This assessment does not constitute legal or tax advice. Please consult with your tax advisor for specific compliance requirements. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results or any recommendations provided.</p>
                                  
                                  <p class="footer-text" style="margin-top: 30px;">
                                      <img src="https://i.imgur.com/k83w5gc.png" alt="RSM Logo" width="80" style="opacity: 0.6; margin-bottom: 15px;"><br>
                                      RSM MENA - Pillar Two Advisory Team<br>
                                      2026 RSM. All rights reserved.
                                  </p>
                              </td>
                          </tr>

                      </table>
                  </td>
              </tr>
          </table>

        </body>
      </html>
    `;

    // Verify transporter is configured
    try {
      await transporter.verify();
      console.log('SMTP server connection verified');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      console.error('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? '***' : 'MISSING',
        pass: process.env.SMTP_PASS ? '***' : 'MISSING',
        from: process.env.FROM_EMAIL,
      });
      return res.status(500).json({ 
        message: 'Email server configuration error. Please contact support.',
        error: process.env.NODE_ENV === 'development' ? String(verifyError) : undefined
      });
    }

    const replyToEmail = process.env.REPLY_TO_EMAIL || process.env.NOTIFICATION_EMAIL;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    // Send email to user with PDF attachment
    console.log('Sending email to user:', personalInfo.email);
    try {
      const userEmailResult = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: personalInfo.email,
        ...(replyToEmail ? { replyTo: replyToEmail } : {}),
        subject: `Pillar Two Scoping Assessment Report – ${personalInfo.company}`,
        html: userEmailContent,
        attachments: [
          {
            filename: `${personalInfo.company.replace(/[^a-zA-Z0-9]/g, '_')}_Pillar_Two_Scoping_Assessment_Report.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log('User email sent successfully. MessageId:', userEmailResult.messageId);
      userEmailSent = true;
    } catch (userEmailError: any) {
      console.error('Error sending user email:', userEmailError);
      console.error('Email error details:', {
        message: userEmailError?.message,
        code: userEmailError?.code,
        response: userEmailError?.response,
        command: userEmailError?.command,
      });
      // Continue to send internal email even if user email fails
    }

    // Send internal notification email (with PDF attachment)
    if (!notificationEmail) {
      console.warn('NOTIFICATION_EMAIL is not set; skipping internal notification email.');
    } else {
      console.log('Sending internal notification email...');
      try {
        const userUploads = getUserUploadAttachments(answers);
        if (userUploads.length > 0) {
          console.log(
            `Attaching ${userUploads.length} user upload(s) to notification email:`,
            userUploads.map((a) => a.filename).join(', '),
          );
        } else if (answers.q2a) {
          console.warn(
            'q2a has a value but no file content (base64) was available to attach.',
          );
        }

        const internalEmailResult = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: notificationEmail,
          ...(replyToEmail ? { replyTo: replyToEmail } : {}),
          subject: "Pillar Two Initial Scoping Readiness Assessment - UAE",
          html: emailContent,
          attachments: [
            {
              filename: `${personalInfo.company.replace(/[^a-zA-Z0-9]/g, '_')}_Pillar_Two_Scoping_Assessment_Report.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
            ...userUploads,
          ],
        });
        console.log('Internal email sent successfully. MessageId:', internalEmailResult.messageId);
      } catch (internalEmailError) {
        console.error('Error sending internal email:', internalEmailError);
        // Continue even if internal email fails
      }
    }

    // Google Sheets write already happened above (before email processing)

    console.log('Assessment processing completed successfully');
    res.status(200).json({ 
      message: 'Assessment results sent successfully',
      emailSent: userEmailSent,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in assessment processing:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      message: 'Failed to send assessment results',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}
