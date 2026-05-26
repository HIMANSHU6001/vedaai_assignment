import type { IAssignment } from '../models/Assignment';

export const SYSTEM_PROMPT = `You are an expert educational assessment designer.
Your task is to generate a structured, professional question paper.

Rules you MUST follow:
- Generate a formal, academically appropriate and professional title for the question paper (e.g., "Class Test: Chemical Effects of Electric Current" or "Unit Assessment: React Hooks in Depth"). Do NOT just copy raw snake_case names or file names (like "ch_3_react" or "react_hooks_guide_Paper").
- Generate exactly the number of questions specified
- Total marks across all questions MUST equal the requested total exactly
- Distribute questions across sections by question type (one section per type)
- Apply difficulty distribution as close to the requested percentages as possible
- MCQ questions MUST include an options array with exactly 4 choices
- Question text must be academically appropriate and unambiguous
- Section labels must be sequential uppercase letters: A, B, C...
- Do not add questions beyond the specified count
- Include a detailed and academically appropriate model answer for each question in the 'answer' field of the question object (e.g., correct option letter + explanation for MCQs, complete solution for short answers). This will be used to automatically build the Answer Key section at the end of the paper.`;

type DifficultyCounts = {
  easy: number;
  medium: number;
  hard: number;
};

function calculateDifficultyCounts(totalQuestions: number, distribution: DifficultyCounts): DifficultyCounts {
  const exactCounts = [
    { key: 'easy' as const, exact: (totalQuestions * distribution.easy) / 100 },
    { key: 'medium' as const, exact: (totalQuestions * distribution.medium) / 100 },
    { key: 'hard' as const, exact: (totalQuestions * distribution.hard) / 100 },
  ];

  const counts: DifficultyCounts = {
    easy: Math.floor(exactCounts[0].exact),
    medium: Math.floor(exactCounts[1].exact),
    hard: Math.floor(exactCounts[2].exact),
  };

  let remaining = totalQuestions - (counts.easy + counts.medium + counts.hard);

  const remainders = exactCounts
    .map((item) => ({ key: item.key, remainder: item.exact - Math.floor(item.exact) }))
    .sort((left, right) => right.remainder - left.remainder);

  for (const item of remainders) {
    if (remaining <= 0) {
      break;
    }

    counts[item.key] += 1;
    remaining -= 1;
  }

  return counts;
}

export function buildPrompt(assignment: IAssignment): string {
  const difficultyCounts = calculateDifficultyCounts(assignment.totalQuestions, assignment.difficultyDistribution);
  const marksPerQuestion = Math.floor(assignment.totalMarks / assignment.totalQuestions);

  let prompt = `Generate a question paper with these exact specifications:

Suggested Topic/Source Name: ${assignment.title}
Subject: ${assignment.subject}
Total Questions: ${assignment.totalQuestions}
Total Marks: ${assignment.totalMarks}
Approximate marks per question: ${marksPerQuestion}
Question types to include: ${assignment.questionTypes.join(', ')}

Difficulty breakdown:
- Easy questions: ${difficultyCounts.easy}
- Medium questions: ${difficultyCounts.medium}
- Hard questions: ${difficultyCounts.hard}

Group questions into sections by type.
Each section gets a letter label (A, B, C...) and a descriptive title.
Section instruction should indicate how many questions and marks are in that section.`;

  if (assignment.additionalInstructions) {
    prompt += `\n\nAdditional instructions from the teacher:\n${assignment.additionalInstructions}`;
  }

  if (assignment.extractedText) {
    const context = assignment.extractedText.slice(0, 2500);
    prompt += `\n\nBase the questions on the following study material (excerpt):\n---\n${context}\n---`;
  }

  return prompt;
}
