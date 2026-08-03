import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#E4E4E4',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    marginBottom: 20,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  scoreSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  questionSection: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 12,
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#4B5563',
    fontSize: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
    padding: 5,
  },
  resultTextSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  resultTextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  suggestionText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

interface Question {
  id: string;
  text: string;
  options: Array<{ value: string; label: string }>;
}

interface AssessmentReportProps {
  personalInfo: {
    name: string;
    email: string;
    company: string;
    position: string;
  };
  score: number;
  answers: Record<string, string>;
  questions: Question[];
}

const getResultText = (score: number): { result: string; suggestion: string } => {
  if (score >= 85) {
    return {
      result: "Advanced Cyber Maturity",
      suggestion: "Your cybersecurity measures are robust. Continue maintaining and updating your practices."
    };
  } else if (score >= 65) {
    return {
      result: "Aligned to Foundational Values",
      suggestion: "Consider aligning with industry-standard cybersecurity frameworks for further improvement."
    };
  } else if (score >= 35) {
    return {
      result: "Basic Measures in Place",
      suggestion: "A thorough assessment of your cybersecurity posture is recommended in the mid-term."
    };
  } else {
    return {
      result: "Immediate Action Required",
      suggestion: "Your cyber posture needs immediate attention. Consider a comprehensive cybersecurity assessment."
    };
  }
};

export const AssessmentReport: React.FC<AssessmentReportProps> = ({ personalInfo, score, answers, questions }) => {
  const { result, suggestion } = getResultText(score);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            style={styles.logo}
            src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_6edb4dff-a4af-42c2-8395-781c15cc13dc.png"
          />
          <Text style={styles.title}>Pillar Two Initial Scoping Readiness Assessment</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Personal Information</Text>
          <Text style={styles.text}>Name: {personalInfo.name}</Text>
          <Text style={styles.text}>Email: {personalInfo.email}</Text>
          <Text style={styles.text}>Company: {personalInfo.company}</Text>
          <Text style={styles.text}>Position: {personalInfo.position}</Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreText}>Your Score: {score}</Text>
        </View>

        <View style={styles.resultTextSection}>
          <Text style={styles.resultTextTitle}>Assessment Result</Text>
          <Text style={styles.resultText}>{result}</Text>
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Details</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Question</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Answer</Text>
              </View>
            </View>
            {questions.map((question, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{question.text}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {question.options.find(option => option.value === answers[question.id])?.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Nexuses. All rights reserved.
        </Text>
      </Page>
    </Document>
  );
};
