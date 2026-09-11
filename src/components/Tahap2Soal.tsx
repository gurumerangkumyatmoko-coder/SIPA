import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Check,
  RotateCcw,
  Layers,
  Loader2,
  FileText,
} from 'lucide-react';
import { Question, StudentAnswer, StudentIdentity } from '../types';
import { isQuestionAnswered } from '../utils/scoring';

interface Tahap2SoalProps {
  questions: Question[];
  student: StudentIdentity;
  answers: Record<number, StudentAnswer>;
  onAnswerChange: (questionId: number, answer: StudentAnswer) => void;
  onSubmitTest: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  onDownloadQuestionPDF: () => void;
}

export const Tahap2Soal: React.FC<Tahap2SoalProps> = ({
  questions,
  student,
  answers,
  onAnswerChange,
  onSubmitTest,
  isSubmitting,
  submitError,
  onDownloadQuestionPDF,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  // Calculate answered count
  const answeredCount = questions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  const totalCount = questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);
  const isAllAnswered = answeredCount === totalCount;

  // List of unanswered question numbers
  const unansweredNumbers = questions
    .filter((q) => !isQuestionAnswered(q, answers[q.id]))
    .map((q) => q.originalNumber);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
    setShowPaletteDrawer(false);
  };

  // Single choice selection handler
  const handleSelectSingle = (optionId: string) => {
    onAnswerChange(currentQ.id, optionId);
  };

  // Multiple choice complex handler (checkbox toggle)
  const handleToggleMultiple = (optionId: string) => {
    const currentList = Array.isArray(answers[currentQ.id])
      ? ([...(answers[currentQ.id] as string[])])
      : [];
    
    let updated: string[];
    if (currentList.includes(optionId)) {
      updated = currentList.filter((id) => id !== optionId);
    } else {
      updated = [...currentList, optionId];
    }
    onAnswerChange(currentQ.id, updated);
  };

  // Category matrix handler (Benar/Salah or Sesuai/Tidak Sesuai)
  const handleCategoryResponse = (statementId: string, value: string) => {
    const currentMap =
      typeof answers[currentQ.id] === 'object' && !Array.isArray(answers[currentQ.id])
        ? { ...(answers[currentQ.id] as Record<string, string>) }
        : {};
    currentMap[statementId] = value;
    onAnswerChange(currentQ.id, currentMap);
  };

  // Trigger submit check
  const handleAttemptSubmit = () => {
    if (!isAllAnswered) {
      setShowIncompleteModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const currentAnswer = answers[currentQ.id];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Bar: Progress & Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              Nomor {currentIndex + 1} dari {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Peserta: <strong className="text-slate-800">{student.nama}</strong> ({student.nomorAbsen})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-unduh-naskah-top"
              onClick={onDownloadQuestionPDF}
              title="Unduh Naskah Soal Lengkap (PDF)"
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Naskah PDF</span>
            </button>

            <button
              id="btn-toggle-daftar-soal"
              onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Soal ({answeredCount}/{totalCount})</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Progres Pengerjaan</span>
            <span className={isAllAnswered ? 'text-emerald-700 font-bold' : 'text-blue-700'}>
              {answeredCount} dari {totalCount} Soal Dijawab ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isAllAnswered ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Container: Question Card + Sidebar (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-200">
            {/* Question Header & Type Tag */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {currentIndex + 1}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  Materi: {currentQ.topic}
                </span>
              </div>

              {/* Badges for Question Type */}
              {currentQ.type === 'single_choice' && (
                <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  Pilihan Ganda (1 Jawaban)
                </span>
              )}
              {currentQ.type === 'multiple_choice_complex' && (
                <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                  Pilihan Ganda Kompleks (Bisa Lebih Dari 1)
                </span>
              )}
              {currentQ.type === 'category_matrix' && (
                <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                  PG Kompleks Kategori
                </span>
              )}
            </div>

            {/* Stimulus / Reading / Context if available */}
            {currentQ.stimulus && (
              <div className="mb-5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                <p className="font-semibold text-slate-800 not-italic mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Konteks / Wacana:</span>
                </p>
                {currentQ.stimulus}
              </div>
            )}

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
              {currentQ.text}
            </h3>

            {/* ANSWER OPTIONS RENDERING */}
            {/* 1. SINGLE CHOICE */}
            {currentQ.type === 'single_choice' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectSingle(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start space-x-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-1 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <span className="text-sm sm:text-base pt-0.5 leading-snug">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. MULTIPLE CHOICE COMPLEX */}
            {currentQ.type === 'multiple_choice_complex' && currentQ.options && (
              <div>
                <div className="mb-3 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-800 inline-block">
                  Petunjuk: Klik pilihan untuk mencentang (boleh memilih 2 atau lebih jawaban yang benar).
                </div>
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
                    const isSelected = selectedList.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleMultiple(opt.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start space-x-3.5 cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs ring-1 ring-purple-600/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center transition-colors border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white border-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{opt.id}</span>
                          )}
                        </div>
                        <span className="text-sm sm:text-base pt-0.5 leading-snug">
                          <strong className="mr-1">{opt.id}.</strong> {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CATEGORY MATRIX (Benar/Salah or Sesuai/Tidak Sesuai) */}
            {currentQ.type === 'category_matrix' && currentQ.statements && (
              <div>
                <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800">
                  Petunjuk: Tentukan status respon untuk setiap pernyataan di bawah ini.
                </div>
                <div className="space-y-4">
                  {currentQ.statements.map((st, sIdx) => {
                    const statementMap =
                      typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
                        ? (currentAnswer as Record<string, string>)
                        : {};
                    const chosen = statementMap[st.id];

                    const isBenarSalah = st.categoryType === 'Benar/Salah';
                    const option1 = isBenarSalah ? 'Benar' : 'Sesuai';
                    const option2 = isBenarSalah ? 'Salah' : 'Tidak Sesuai';

                    return (
                      <div
                        key={st.id}
                        className="p-4 bg-slate-50/80 rounded-xl border border-slate-200"
                      >
                        <p className="text-sm font-medium text-slate-900 mb-3 leading-relaxed">
                          <span className="font-bold text-slate-600 mr-1.5">{sIdx + 1}.</span>
                          {st.text}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleCategoryResponse(st.id, option1)}
                            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                              chosen === option1
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{option1}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryResponse(st.id, option2)}
                            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                              chosen === option2
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>✕ {option2}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              id="btn-soal-sebelumnya"
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center space-x-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  id="btn-soal-berikutnya"
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-kirim-jawaban"
                  type="button"
                  onClick={handleAttemptSubmit}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    isAllAnswered
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Selesai / Kirim Jawaban</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette (Desktop 4 cols, or drawer on mobile) */}
        <div
          className={`${
            showPaletteDrawer ? 'fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center' : 'hidden lg:block'
          } lg:col-span-4`}
        >
          <div
            className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 w-full max-w-sm lg:max-w-none ${
              showPaletteDrawer ? 'max-h-[90vh] overflow-y-auto' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Nomor Soal ({totalCount})</span>
              </h4>
              {showPaletteDrawer && (
                <button
                  onClick={() => setShowPaletteDrawer(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1"
                >
                  Tutup ✕
                </button>
              )}
            </div>

            {/* Grid of 24 questions */}
            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2 mb-5">
              {questions.map((q, idx) => {
                const answered = isQuestionAnswered(q, answers[q.id]);
                const isActive = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpTo(idx)}
                    className={`h-10 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center border cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-600 bg-blue-600 text-white font-extrabold'
                        : answered
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                <span>Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-200" />
                <span>Belum Dijawab ({totalCount - answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                  ●
                </div>
                <span>Soal Sedang Aktif</span>
              </div>
            </div>

            {/* Finish button inside palette for convenient access */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                id="btn-selesai-palette"
                type="button"
                onClick={handleAttemptSubmit}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isAllAnswered
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Jawaban Tes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Incomplete Validation Alert */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Belum Semua Soal Dijawab!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-4 leading-relaxed">
              Sesuai ketentuan, Anda <strong>wajib menjawab seluruh {questions.length} soal</strong> sebelum dapat mengirimkan hasil tes.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Nomor soal yang belum Anda jawab ({unansweredNumbers.length}):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {unansweredNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setShowIncompleteModal(false);
                      handleJumpTo(num - 1);
                    }}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-md border border-amber-300"
                  >
                    No. {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowIncompleteModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl"
            >
              Lanjutkan Mengerjakan
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirmation Dialog Before Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Apakah Anda yakin ingin mengirim jawaban?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-4 leading-relaxed">
              Seluruh <strong>{questions.length} butir soal</strong> telah selesai Anda jawab. Setelah dikirim, jawaban tidak dapat diubah kembali dan hasil nilai akan langsung dihitung.
            </p>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-batal-kirim"
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-ya-kirim"
                type="button"
                disabled={isSubmitting}
                onClick={onSubmitTest}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Ya, Kirim Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Global Submitting Overlay to prevent double submission */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Menyimpan Hasil Ujian...
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sedang memproses nilai dan menyinkronkan data ke Google Spreadsheet server. Mohon tunggu sebentar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
