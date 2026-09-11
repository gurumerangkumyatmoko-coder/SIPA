import { Question, StudentAnswer, TestResultItem } from '../types';
import { CONFIG } from '../config';

// Helper to randomly shuffle an array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate randomized question list and randomized options for each test session
export function prepareShuffledTest(baseQuestions: Question[]): Question[] {
  // 1. Separate by type if desired or shuffle all
  // To keep pedagogical flow, we can shuffle within categories or shuffle all 24 questions!
  // The requirement says: "Soal dan pilihan jawaban harus diacak setiap kali tes dimulai."
  // Shuffling all 24 questions gives true exam randomization!
  const shuffledQuestions = shuffleArray(baseQuestions);

  return shuffledQuestions.map((q, index) => {
    const clonedQuestion: Question = {
      ...q,
      // The displayed sequential number for the student
      originalNumber: index + 1,
    };

    if (q.type === 'single_choice' && q.options) {
      // Find the text of the correct answer
      const correctOption = q.options.find((opt) => opt.id === q.correctAnswer);
      const correctText = correctOption?.text;

      // Shuffle options
      const shuffledOptions = shuffleArray(q.options);
      // Re-assign IDs as A, B, C, D for clean UI presentation
      const letterIds = ['A', 'B', 'C', 'D'];
      const newOptions = shuffledOptions.map((opt, optIndex) => ({
        id: letterIds[optIndex] || String.fromCharCode(65 + optIndex),
        text: opt.text,
      }));

      // Find the new letter for the correct text
      const newCorrect = newOptions.find((opt) => opt.text === correctText)?.id || 'A';

      clonedQuestion.options = newOptions;
      clonedQuestion.correctAnswer = newCorrect;
    } else if (q.type === 'multiple_choice_complex' && q.options && q.correctAnswers) {
      // Find texts of all correct answers
      const correctTexts = q.options
        .filter((opt) => q.correctAnswers?.includes(opt.id))
        .map((opt) => opt.text);

      // Shuffle options
      const shuffledOptions = shuffleArray(q.options);
      const letterIds = ['A', 'B', 'C', 'D'];
      const newOptions = shuffledOptions.map((opt, optIndex) => ({
        id: letterIds[optIndex] || String.fromCharCode(65 + optIndex),
        text: opt.text,
      }));

      const newCorrectAnswers = newOptions
        .filter((opt) => correctTexts.includes(opt.text))
        .map((opt) => opt.id);

      clonedQuestion.options = newOptions;
      clonedQuestion.correctAnswers = newCorrectAnswers;
    } else if (q.type === 'category_matrix' && q.statements) {
      // Shuffle statement order slightly or keep coherent
      const shuffledStatements = shuffleArray(q.statements);
      clonedQuestion.statements = shuffledStatements;
    }

    return clonedQuestion;
  });
}

// Check if a specific question has been completely answered by student
export function isQuestionAnswered(question: Question, answer: StudentAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return false;

  if (question.type === 'single_choice') {
    return typeof answer === 'string' && answer.trim() !== '';
  }

  if (question.type === 'multiple_choice_complex') {
    return Array.isArray(answer) && answer.length > 0;
  }

  if (question.type === 'category_matrix') {
    if (typeof answer !== 'object' || Array.isArray(answer)) return false;
    const statements = question.statements || [];
    // Must have an answer for every statement
    return statements.every((st) => {
      const val = (answer as Record<string, string>)[st.id];
      return val === 'Benar' || val === 'Salah' || val === 'Sesuai' || val === 'Tidak Sesuai';
    });
  }

  return false;
}

// Grade the whole exam
export function gradeExam(
  questions: Question[],
  answers: Record<number, StudentAnswer>
): {
  totalSoal: number;
  benar: number;
  salah: number;
  nilai: number;
  status: 'Lulus' | 'Belum Lulus';
  details: TestResultItem[];
} {
  let totalScoreRaw = 0;
  let maxScoreRaw = 0;
  let correctCount = 0;
  let wrongCount = 0;

  const details: TestResultItem[] = [];

  questions.forEach((q, idx) => {
    const userAnswer = answers[q.id];
    let isCorrect = false;
    let scoreEarned = 0;
    let correctAnswerSummary = '';

    if (q.type === 'single_choice') {
      maxScoreRaw += 1;
      const userSelected = typeof userAnswer === 'string' ? userAnswer : '';
      isCorrect = userSelected === q.correctAnswer;
      scoreEarned = isCorrect ? 1 : 0;
      const correctOpt = q.options?.find((o) => o.id === q.correctAnswer);
      correctAnswerSummary = `${q.correctAnswer}. ${correctOpt?.text || ''}`;
    } else if (q.type === 'multiple_choice_complex') {
      maxScoreRaw += 1;
      const userList = Array.isArray(userAnswer) ? (userAnswer as string[]) : [];
      const correctList = q.correctAnswers || [];

      // Sort both and compare
      const sortedUser = [...userList].sort().join(',');
      const sortedCorrect = [...correctList].sort().join(',');

      isCorrect = sortedUser === sortedCorrect;
      scoreEarned = isCorrect ? 1 : 0;

      const correctTexts = (q.options || [])
        .filter((opt) => correctList.includes(opt.id))
        .map((opt) => `${opt.id}. ${opt.text}`)
        .join('; ');
      correctAnswerSummary = correctTexts;
    } else if (q.type === 'category_matrix') {
      const statements = q.statements || [];
      maxScoreRaw += 1;
      const userMap = (typeof userAnswer === 'object' && !Array.isArray(userAnswer)
        ? userAnswer
        : {}) as Record<string, string>;

      let correctStatementsCount = 0;
      statements.forEach((st) => {
        if (userMap[st.id] === st.correctAnswer) {
          correctStatementsCount++;
        }
      });

      // Partial / full scoring: if all correct -> 1 point, else proportion
      const ratio = statements.length > 0 ? correctStatementsCount / statements.length : 0;
      scoreEarned = ratio;
      isCorrect = correctStatementsCount === statements.length;

      correctAnswerSummary = statements
        .map((st) => `[${st.correctAnswer}] ${st.text}`)
        .join(' | ');
    }

    if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    totalScoreRaw += scoreEarned;

    details.push({
      questionId: q.id,
      questionNumber: idx + 1,
      type: q.type,
      isCorrect,
      score: scoreEarned,
      userAnswer: userAnswer || '',
      correctAnswerSummary,
      explanation: q.explanation,
      questionText: q.text,
    });
  });

  // Scale 0 - 100
  const nilai = maxScoreRaw > 0 ? Math.round((totalScoreRaw / maxScoreRaw) * 100) : 0;
  const status: 'Lulus' | 'Belum Lulus' = nilai >= CONFIG.KKTP ? 'Lulus' : 'Belum Lulus';

  return {
    totalSoal: questions.length,
    benar: correctCount,
    salah: wrongCount,
    nilai,
    status,
    details,
  };
}
