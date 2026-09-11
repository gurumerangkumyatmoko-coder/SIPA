import React, { useState, useEffect } from 'react';
import { CONFIG } from './config';
import { GuruSettings, Question, StudentAnswer, StudentIdentity, TestSubmission } from './types';
import { INITIAL_QUESTIONS } from './data/questions';
import { prepareShuffledTest, gradeExam } from './utils/scoring';
import { gasService } from './services/gasService';
import { generateQuestionPaperPDF } from './utils/pdfGenerator';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Tahap1Identitas } from './components/Tahap1Identitas';
import { Tahap2Soal } from './components/Tahap2Soal';
import { Tahap3Hasil } from './components/Tahap3Hasil';
import { Tahap4PanelGuru } from './components/Tahap4PanelGuru';
import { GuruAuthModal } from './components/GuruAuthModal';

export default function App() {
  // Current active stage: 1 = Identitas, 2 = Soal, 3 = Hasil, 4 = Panel Guru
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);

  // Bank of questions (editable in admin panel)
  const [baseQuestions, setBaseQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('sdn3_base_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === CONFIG.JUMLAH_TOTAL_SOAL) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_QUESTIONS;
  });

  // Active test questions (shuffled for current student session)
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  // Student identity & responses
  const [student, setStudent] = useState<StudentIdentity | null>(null);
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({});

  // Submission state & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<TestSubmission | null>(null);

  // Guru Panel states
  const [isGuruAuthenticated, setIsGuruAuthenticated] = useState(false);
  const [showGuruAuthModal, setShowGuruAuthModal] = useState(false);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [gasFetchError, setGasFetchError] = useState<string | null>(null);

  // Global Guru settings (e.g. answer key release)
  const [guruSettings, setGuruSettings] = useState<GuruSettings>(() => {
    try {
      const saved = localStorage.getItem('sdn3_guru_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      showAnswerKeyToStudents: false, // Default is closed for students as requested
      kktp: CONFIG.KKTP,
    };
  });

  // Save settings on update
  const handleUpdateSettings = (newSettings: GuruSettings) => {
    setGuruSettings(newSettings);
    localStorage.setItem('sdn3_guru_settings', JSON.stringify(newSettings));
  };

  // Save questions updates
  const handleUpdateQuestions = (updated: Question[]) => {
    setBaseQuestions(updated);
    localStorage.setItem('sdn3_base_questions', JSON.stringify(updated));
  };

  // Fetch results from Google Apps Script
  const fetchGasResults = async () => {
    setIsLoadingSubmissions(true);
    setGasFetchError(null);
    try {
      const liveData = await gasService.getResults();
      // Combine with any local backup items that haven't synced yet
      const localBackups = gasService.getLocalBackups();
      
      const combinedMap = new Map<string, TestSubmission>();
      // Put live data first
      liveData.forEach((item) => {
        if (item.id) combinedMap.set(item.id, item);
      });
      // Merge local backups if not yet in live
      localBackups.forEach((item) => {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      const merged = Array.from(combinedMap.values());
      setSubmissions(merged);
    } catch (err: any) {
      console.error('Error fetching GAS results:', err);
      setGasFetchError(
        'Gagal mengambil data dari server. Periksa koneksi internet atau konfigurasi Google Apps Script.'
      );
      // Fallback to local backups if available, without fake dummy data
      const localBackups = gasService.getLocalBackups();
      setSubmissions(localBackups);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // When student starts test (Tahap 1 -> Tahap 2)
  const handleStartTest = (identity: StudentIdentity) => {
    // Prepare randomized questions and randomized options!
    const shuffled = prepareShuffledTest(baseQuestions);
    setActiveQuestions(shuffled);
    setStudent(identity);
    setAnswers({});
    setSubmitError(null);
    setCurrentStage(2);
  };

  // When student selects an answer in Tahap 2
  const handleAnswerChange = (questionId: number, answer: StudentAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // When student completes test and confirms submission (Tahap 2 -> Tahap 3)
  const handleSubmitTest = async () => {
    if (!student || activeQuestions.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Calculate score
    const result = gradeExam(activeQuestions, answers);
    const submissionId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestampStr = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const submissionData: TestSubmission = {
      id: submissionId,
      timestamp: timestampStr,
      nama: student.nama,
      nomorAbsen: student.nomorAbsen,
      kelas: student.kelas,
      totalSoal: result.totalSoal,
      benar: result.benar,
      salah: result.salah,
      nilai: result.nilai,
      status: result.status,
      details: result.details,
    };

    try {
      // Send data to Google Apps Script & wait for server response!
      await gasService.submitTest(submissionData);
      
      setLastSubmission(submissionData);
      // Update local submissions list too
      setSubmissions((prev) => [submissionData, ...prev.filter((s) => s.id !== submissionData.id)]);
      
      // Move to Tahap 3 (Hasil Tes)
      setCurrentStage(3);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(
        err.message || 'Gagal mengirim jawaban ke server. Silakan coba klik Kirim lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restart / new test
  const handleRestartTest = () => {
    setStudent(null);
    setAnswers({});
    setActiveQuestions([]);
    setLastSubmission(null);
    setCurrentStage(1);
  };

  // Navigation controller
  const handleNavigateStage = (stage: 1 | 2 | 3 | 4) => {
    if (stage === 4) {
      if (isGuruAuthenticated) {
        setCurrentStage(4);
        fetchGasResults();
      } else {
        setShowGuruAuthModal(true);
      }
      return;
    }

    if (stage === 2 && !student) {
      return;
    }
    if (stage === 3 && !lastSubmission) {
      return;
    }
    setCurrentStage(stage);
  };

  const handleOpenGuruAuth = () => {
    if (isGuruAuthenticated) {
      setCurrentStage(4);
      fetchGasResults();
    } else {
      setShowGuruAuthModal(true);
    }
  };

  const handleGuruAuthenticated = () => {
    setIsGuruAuthenticated(true);
    setShowGuruAuthModal(false);
    setCurrentStage(4);
    fetchGasResults();
  };

  const handleLogoutGuru = () => {
    setIsGuruAuthenticated(false);
    setCurrentStage(1);
  };

  const handleDeleteSubmission = async (id: string, submission?: TestSubmission) => {
    await gasService.deleteResult(id, submission);
    setSubmissions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownloadQuestionPDF = () => {
    generateQuestionPaperPDF(baseQuestions);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <HeaderNavbar
        currentStage={currentStage}
        student={student}
        onNavigateStage={handleNavigateStage}
        onOpenGuruAuth={handleOpenGuruAuth}
        isGuruAuthenticated={isGuruAuthenticated}
      />

      {/* Main Stage Content */}
      <main className="flex-1">
        {currentStage === 1 && (
          <Tahap1Identitas
            onStartTest={handleStartTest}
            onDownloadQuestionPDF={handleDownloadQuestionPDF}
          />
        )}

        {currentStage === 2 && student && (
          <Tahap2Soal
            questions={activeQuestions}
            student={student}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmitTest={handleSubmitTest}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onDownloadQuestionPDF={handleDownloadQuestionPDF}
          />
        )}

        {currentStage === 3 && lastSubmission && (
          <Tahap3Hasil
            submission={lastSubmission}
            guruSettings={guruSettings}
            onRestartTest={handleRestartTest}
          />
        )}

        {currentStage === 4 && isGuruAuthenticated && (
          <Tahap4PanelGuru
            submissions={submissions}
            isLoading={isLoadingSubmissions}
            fetchError={gasFetchError}
            onRefreshData={fetchGasResults}
            onDeleteSubmission={handleDeleteSubmission}
            guruSettings={guruSettings}
            onUpdateSettings={handleUpdateSettings}
            questions={baseQuestions}
            onUpdateQuestions={handleUpdateQuestions}
            onLogoutGuru={handleLogoutGuru}
          />
        )}
      </main>

      {/* Guru Password Auth Modal */}
      <GuruAuthModal
        isOpen={showGuruAuthModal}
        onClose={() => setShowGuruAuthModal(false)}
        onAuthenticated={handleGuruAuthenticated}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            {CONFIG.SEKOLAH} — {CONFIG.MATA_PELAJARAN} Kelas {CONFIG.KELAS}
          </p>
          <p className="mt-1 text-slate-400">
            Materi: {CONFIG.MATERI} • KKTP: {CONFIG.KKTP} • Guru Pengampu: {CONFIG.NAMA_GURU} (NIP: {CONFIG.NIP_GURU})
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Kepala Sekolah: {CONFIG.NAMA_KEPALA_SEKOLAH} (NIP: {CONFIG.NIP_KEPALA_SEKOLAH})
          </p>
        </div>
      </footer>
    </div>
  );
}
