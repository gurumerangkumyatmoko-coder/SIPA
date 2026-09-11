export type QuestionType = 'single_choice' | 'multiple_choice_complex' | 'category_matrix';

export type DifficultyLevel = 'Mudah' | 'Sedang' | 'Sukar';

export interface Option {
  id: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface CategoryStatement {
  id: string; // e.g. "S1", "S2"
  text: string;
  correctAnswer: 'Benar' | 'Salah' | 'Sesuai' | 'Tidak Sesuai';
  categoryType: 'Benar/Salah' | 'Sesuai/Tidak Sesuai';
}

export interface Question {
  id: number;
  originalNumber: number;
  type: QuestionType;
  text: string;
  stimulus?: string;
  options?: Option[]; // for single_choice and multiple_choice_complex
  correctAnswer?: string; // for single_choice (e.g. "A")
  correctAnswers?: string[]; // for multiple_choice_complex (e.g. ["A", "C"])
  statements?: CategoryStatement[]; // for category_matrix
  difficulty: DifficultyLevel;
  explanation: string; // Pembahasan
  topic: string;
}

export interface StudentIdentity {
  nama: string;
  nomorAbsen: string;
  kelas: string;
  startedAt: string;
}

// Student response mapping:
// - single_choice: string (e.g. "A")
// - multiple_choice_complex: string[] (e.g. ["A", "C"])
// - category_matrix: Record<string, 'Benar' | 'Salah' | 'Sesuai' | 'Tidak Sesuai'> (e.g. { "S1": "Benar", "S2": "Salah" })
export type StudentAnswer = string | string[] | Record<string, string>;

export interface TestResultItem {
  questionId: number;
  questionNumber: number;
  type: QuestionType;
  isCorrect: boolean;
  score: number; // 0 to 1 (or partial)
  userAnswer: StudentAnswer;
  correctAnswerSummary: string;
  explanation: string;
  questionText: string;
}

export interface TestSubmission {
  id: string;
  timestamp: string;
  nama: string;
  nomorAbsen: string;
  kelas: string;
  totalSoal: number;
  benar: number;
  salah: number;
  nilai: number; // 0 to 100
  status: 'Lulus' | 'Belum Lulus';
  details?: TestResultItem[];
}

export interface GuruSettings {
  showAnswerKeyToStudents: boolean;
  kktp: number;
}
