"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";
import { ExamPayload } from "@/types/exam";

// Styles matching the reference layout exactly
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.6,
  },

  /* ─── Header ─── */
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 3,
  },
  headerSubText: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#333333",
    textAlign: "center",
    marginBottom: 1,
  },

  /* ─── Time / Marks Row ─── */
  timeMarksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timeBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  /* ─── General Instructions ─── */
  generalInstruction: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },

  /* ─── Student Blanks ─── */
  blanksContainer: {
    marginBottom: 22,
  },
  blankRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  blankLabel: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  blankLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    height: 12,
    marginLeft: 4,
  },

  /* ─── Section Title ─── */
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 14,
    marginTop: 4,
  },

  /* ─── Section Header ─── */
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTypeTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  sectionInstruction: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Oblique",
    color: "#333333",
    marginBottom: 10,
  },

  /* ─── Questions ─── */
  questionContainer: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  questionText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  questionNumber: {
    fontFamily: "Helvetica",
  },
  difficultyTag: {
    fontFamily: "Helvetica",
  },
  marksTag: {
    fontFamily: "Helvetica",
  },

  /* ─── MCQ Options ─── */
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
    paddingLeft: 20,
  },
  optionItem: {
    width: "50%",
    fontSize: 9,
    marginBottom: 3,
  },

  /* ─── End of Paper ─── */
  endOfPaper: {
    fontSize: 10,
    fontFamily: "Helvetica-BoldOblique",
    color: "#cc0000",
    marginTop: 10,
    marginBottom: 30,
  },

  /* ─── Answer Key ─── */
  answerKeyTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 12,
    marginTop: 20,
  },
  answerContainer: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  answerNumber: {
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  answerText: {
    fontSize: 10,
    lineHeight: 1.5,
  },

  /* ─── Footer ─── */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    borderTopStyle: "solid",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#999999",
    fontFamily: "Helvetica",
  },
});

interface ExamPDFProps {
  examData: ExamPayload;
}

export default function ExamPDF({ examData }: ExamPDFProps) {
  const { data } = examData;

  // Cumulative question counter across sections
  let globalQuestionIndex = 0;

  const getOptionPrefix = (index: number) => {
    return `${String.fromCharCode(97 + index)}) `;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ─── School Header (centered) ─── */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.title}</Text>
          <Text style={styles.headerSubText}>Subject: {data.subject}</Text>
          <Text style={styles.headerSubText}>Class: 5th</Text>
        </View>

        {/* ─── Time Allowed / Maximum Marks ─── */}
        <View style={styles.timeMarksRow}>
          <Text style={styles.timeBold}>Time Allowed: 45 minutes</Text>
          <Text style={styles.timeBold}>Maximum Marks: {data.totalMarks}</Text>
        </View>

        {/* ─── General Instruction ─── */}
        <Text style={styles.generalInstruction}>
          All questions are compulsory unless stated otherwise.
        </Text>

        {/* ─── Student Detail Blanks ─── */}
        <View style={styles.blanksContainer}>
          <View style={styles.blankRow}>
            <Text style={styles.blankLabel}>Name: </Text>
            <View style={styles.blankLine} />
          </View>
          <View style={styles.blankRow}>
            <Text style={styles.blankLabel}>Roll Number: </Text>
            <View style={[styles.blankLine, { width: 120 }]} />
          </View>
          <View style={styles.blankRow}>
            <Text style={styles.blankLabel}>Class: 5th Section: </Text>
            <View style={[styles.blankLine, { width: 80 }]} />
          </View>
        </View>

        {/* ─── Sections ─── */}
        {data.sections.map((section, sIndex) => (
          <View key={sIndex} style={{ marginBottom: 10 }}>
            {/* Section Label e.g. "Section A" */}
            <Text style={styles.sectionTitle}>{section.sectionLabel}</Text>

            {/* Section type + instruction */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTypeTitle}>{section.title}</Text>
              <Text style={styles.sectionInstruction}>{section.instruction}</Text>
            </View>

            {/* Questions */}
            {section.questions.map((q, qIndex) => {
              globalQuestionIndex++;
              const difficultyLabel = q.difficulty ? `[${q.difficulty}] ` : "";
              return (
                <View key={qIndex} style={styles.questionContainer} wrap={false}>
                  <Text style={styles.questionText}>
                    <Text style={styles.questionNumber}>{q.questionNumber}. </Text>
                    <Text style={styles.difficultyTag}>{difficultyLabel}</Text>
                    <Text>{q.text} </Text>
                    <Text style={styles.marksTag}>[{q.marks} Marks]</Text>
                  </Text>

                  {/* MCQ options */}
                  {q.type === "mcq" && q.options && q.options.length > 0 && (
                    <View style={styles.optionsGrid}>
                      {q.options.map((opt, oIndex) => (
                        <Text key={oIndex} style={styles.optionItem}>
                          {getOptionPrefix(oIndex)}{opt}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* ─── End of Question Paper ─── */}
        <Text style={styles.endOfPaper}>End of Question Paper</Text>

        {/* ─── Answer Key ─── */}
        {data.sections.some(s => s.questions.some(q => q.answer)) && (
          <View wrap={false}>
            <Text style={styles.answerKeyTitle}>Answer Key:</Text>
            {data.sections.map((section) =>
              section.questions.map((q, qIndex) =>
                q.answer ? (
                  <View key={`ans-${qIndex}`} style={styles.answerContainer} wrap={false}>
                    <Text style={styles.answerText}>
                      <Text style={styles.answerNumber}>{q.questionNumber}. </Text>
                      <Text>{q.answer}</Text>
                    </Text>
                  </View>
                ) : null
              )
            )}
          </View>
        )}

        {/* ─── Footer ─── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by VedaAI</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
