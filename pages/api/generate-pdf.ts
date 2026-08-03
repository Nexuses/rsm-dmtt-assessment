import type { NextApiRequest, NextApiResponse } from 'next';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { questionsData } from '@/lib/questions';
import { computeAssessment } from '@/lib/scoring';
import { formatAnswerDisplay } from '@/lib/format-answer';

// Add language parameter to the request body type
interface RequestBody {
  personalInfo: PersonalInfo;
  answers: Record<string, string>;
  score?: number;
}

// Add this interface at the top of the file
interface PersonalInfo {
  name: string;
  email: string;
  company: string;
  position: string;
}

// Add these types
type Question = {
  id: string;
  text: string;
  options: Array<{ value: string; label: string }>;
};


// Create styles for the PDF with letterhead design and custom colors
const createStyles = () => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#757574',
    position: 'relative',
  },
  fullPageImageContainer: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPageImage: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
  },
  // Letterhead Header
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
    width: 100,
    height: 48,
    objectFit: 'contain',
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
  
  // Main Content Area
  contentArea: {
    padding: 40,
    paddingTop: 30,
    paddingBottom: 30,
    flex: 1,
  },
  
  // Section Styling
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
  
  // Personal Information Card
  personalInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#009CD9',
    borderLeftStyle: 'solid',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    width: '25%',
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 11,
    color: '#2D9C2D',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  
  // Score Display
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
  
  // Assessment Details Table
  questionsTableContainer: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
    breakInside: 'avoid',
  },
  questionsTableContainerPageBreak: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
    breakInside: 'avoid',
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
  
  // Letterhead Footer
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
  footerDivider: {
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.3,
    marginVertical: 8,
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
  contactText: {
    fontSize: 10,
    color: '#1b3a57',
    lineHeight: 1.6,
    textAlign: 'left',
    marginTop: 10,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { personalInfo, answers } = req.body as RequestBody;
    const assessment = computeAssessment(answers);

    // Validate required fields
    if (!personalInfo || !personalInfo.name || !personalInfo.email || !personalInfo.company) {
      return res.status(400).json({ message: 'Missing required personal information' });
    }

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    const styles = createStyles();
    const currentQuestions = questionsData;

    // Create the PDF document using React.createElement
    const createDocument = () => {
      const currentDate = new Date().toLocaleDateString('en-US');
      
      // Split questions into chunks for better page management
      const allAnswers = Object.entries(answers);
      const questionsPerSecondPage = 5;
      const questionsPerPage = 11; // For subsequent pages
      const questionChunks: [string, string][][] = [];
      
      // First chunk: 5 questions (for second page)
      if (allAnswers.length > 0) {
        questionChunks.push(allAnswers.slice(0, questionsPerSecondPage));
      }
      
      // Remaining chunks: rest of the questions
      for (let i = questionsPerSecondPage; i < allAnswers.length; i += questionsPerPage) {
        questionChunks.push(allAnswers.slice(i, i + questionsPerPage));
      }
      
      const createQuestionRows = (answersChunk: [string, string][], isLastPage = false) => {
        return answersChunk.map(([questionId, answerValue]: [string, string], index: number) => {
          const question = currentQuestions.find((q) => q.id === questionId);
          let displayAnswer = '';
          
          if (question) {
            displayAnswer = formatAnswerDisplay(question, answerValue);
          } else {
            displayAnswer = answerValue || 'Not answered';
          }
          
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

      // Create footer component for reuse
      const createFooter = () => React.createElement(View, { style: styles.letterheadFooter },
        React.createElement(View, { style: styles.footerContent },
          React.createElement(View, { style: styles.footerLeft },
            React.createElement(Text, { style: styles.footerText }, "© 2026 RSM. All rights reserved."),
            React.createElement(Text, { style: styles.footerDescription }, "RSM is a powerful network of assurance, tax and consulting experts with offices all over the world.")
          ),
          React.createElement(View, { style: styles.footerRight },
            React.createElement(Text, { style: styles.footerText }, "Audit | Tax | Consulting Services")
          )
        )
      );

      // Create pages array
      const pages = [];
      
      // First Page - Header, Personal Info, and Scores
      pages.push(
        React.createElement(Page, { size: "A4", style: styles.page },
          // Professional Letterhead Header
          React.createElement(View, { style: styles.letterheadHeader },
            React.createElement(View, { style: styles.headerTop },
              React.createElement(View, { style: styles.headerLeft },
                React.createElement(Text, { style: styles.companyName }, "RSM in Kuwait"),
                React.createElement(Text, { style: styles.companyTagline }, "Audit | Tax | Consulting Services")
              ),
              React.createElement(View, { style: styles.headerRight },
                React.createElement(Image, {
                  style: styles.logo,
                  src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/Intellectus/Untitled%20design%20(2).png"
                })
              )
            ),
            React.createElement(View, { style: styles.headerBottom },
              React.createElement(Text, { style: styles.documentTitle }, "Pillar Two Initial Scoping Readiness Assessment"),
              React.createElement(Text, { style: styles.documentDate }, currentDate)
            )
          ),

          // Main Content Area - First Page
          React.createElement(View, { style: styles.contentArea },
            // Personal Information Section
            React.createElement(View, { style: styles.section },
              React.createElement(Text, { style: styles.sectionTitle }, "Detailed Information"),
              React.createElement(View, { style: styles.personalInfoCard },
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Name:"),
                  React.createElement(Text, { style: styles.infoValue }, personalInfo.name)
                ),
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Email:"),
                  React.createElement(Text, { style: styles.infoValue }, personalInfo.email)
                ),
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Company:"),
                  React.createElement(Text, { style: styles.infoValue }, personalInfo.company)
                ),
                React.createElement(View, { style: styles.infoRow },
                  React.createElement(Text, { style: styles.infoLabel }, "Position:"),
                  React.createElement(Text, { style: styles.infoValue }, personalInfo.position)
                )
              )
            ),

            // Assessment Score Section
            React.createElement(View, { style: styles.section },
              React.createElement(Text, { style: styles.sectionTitle }, "Assessment Results"),
              React.createElement(View, { style: styles.scoreContainer },
                React.createElement(Text, { style: styles.scoreLabel }, assessment.outcomeTitle || "Assessment Outcome"),
                React.createElement(Text, { style: styles.resultText }, assessment.outcomeMessage || assessment.phaseRecommendation.description),
                React.createElement(View, { style: styles.gaugeContainer },
                  React.createElement(Text, { style: styles.resultText }, `Status: ${assessment.eligible ? "In Scope — Subject to DMTT / Pillar Two" : "Out of Scope"}`)
                )
              )
            ),

            // Disclaimer Section
            React.createElement(View, { style: styles.section },
              React.createElement(View, { style: styles.disclaimerSection },
                React.createElement(Text, { style: styles.disclaimerTitle }, "Disclaimer"),
                React.createElement(Text, { style: styles.disclaimerText },
                  "This Pillar Two Initial Scoping Readiness Assessment is an indicative self-assessment based solely on your responses. It does not constitute legal or tax advice and does not guarantee detection of all compliance obligations. The assessment report is intended solely for your internal use and must not be distributed, disclosed, or relied upon by third parties. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results."
                )
              )
            ),

            // Contact Information Section
            React.createElement(View, { style: styles.section },
              React.createElement(Text, { style: styles.contactText },
                "If you have any questions or would like to learn more about UAE DMTT / Pillar Two requirements, please contact the RSM Pillar Two team."
              )
            )
          )
        )
      );

      // Add questions starting from second page (first page is header/info/score)
      questionChunks.forEach((chunk, chunkIndex) => {
        const isLastChunk = chunkIndex === questionChunks.length - 1;
        
        pages.push(
          React.createElement(Page, { size: "A4", style: styles.page },
            // Main Content Area (No Header)
            React.createElement(View, { style: styles.contentArea },
              // Questions and Answers Section
              React.createElement(View, { style: styles.section },
                // Show "Assessment Details" title only on the first question page (third page overall)
                chunkIndex === 0 ? React.createElement(Text, { style: styles.sectionTitle }, "Assessment Details") : null,
                React.createElement(View, { 
                  style: chunkIndex === 0 ? styles.questionsTableContainer : styles.questionsTableContainerPageBreak 
                },
                  React.createElement(View, { style: styles.questionsTable },
                    // Show table header only on the first question page
                    chunkIndex === 0 ? React.createElement(View, { style: styles.tableHeader },
                      React.createElement(View, { style: styles.tableHeaderCell },
                        React.createElement(Text, { style: styles.tableHeaderText }, "Question")
                      ),
                      React.createElement(View, { style: styles.tableHeaderCellLast },
                        React.createElement(Text, { style: styles.tableHeaderText }, "Answer")
                      )
                    ) : null,
                    ...createQuestionRows(chunk, isLastChunk)
                  )
                )
              )
            ),

            // Footer (Last Page Only)
            isLastChunk ? createFooter() : null
          )
        );
      });

      return React.createElement(Document, {}, ...pages);
    };

    // Generate PDF buffer
    const pdfBuffer = await pdf(createDocument()).toBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=assessment_report.pdf');

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      res.status(500).json({ 
        message: 'Error generating PDF', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      res.status(500).json({ message: 'Unknown error generating PDF' });
    }
  }
}
