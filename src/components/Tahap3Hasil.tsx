import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  BookOpen,
  Calendar,
  Clock,
  Lock,
  ChevronDown,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { CONFIG } from '../config';
import { GuruSettings, TestSubmission } from '../types';
import { generateTestResultPDF } from '../utils/pdfGenerator';

interface Tahap3HasilProps {
  submission: TestSubmission;
  guruSettings: GuruSettings;
  onRestartTest: () => void;
}

export const Tahap3Hasil: React.FC<Tahap3HasilProps> = ({
  submission,
  guruSettings,
  onRestartTest,
}) => {
  const isLulus = submission.status === 'Lulus';

  // Trigger celebration confetti when student passes!
  useEffect(() => {
    if (isLulus) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // silent fail if canvas not ready
      }
    }
  }, [isLulus]);

  const handleDownloadPDF = () => {
    generateTestResultPDF(submission);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 text-center mb-6 relative overflow-hidden">
        {/* Decorative background circle */}
        <div
          className={`absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-10 pointer-events-none ${
            isLulus ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold mb-4">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Hasil Tes Sumatif • {CONFIG.MATA_PELAJARAN}</span>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          {isLulus ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-base sm:text-lg border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>LULUS / TUNTAS</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-100 text-rose-800 font-extrabold text-base sm:text-lg border border-rose-200 shadow-xs">
              <XCircle className="w-6 h-6 text-rose-600" />
              <span>BELUM LULUS (PERLU REMEDIAL)</span>
            </div>
          )}
        </div>

        {/* Big Score Typography */}
        <div className="my-4">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Nilai Akhir
          </span>
          <div className="flex items-baseline justify-center">
            <span
              className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${
                isLulus ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {submission.nilai}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-400 ml-1">/100</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kriteria Ketercapaian Tujuan Pembelajaran (KKTP): <strong>{CONFIG.KKTP}</strong>
          </p>
        </div>

        <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-600 mt-2 mb-6">
          {isLulus
            ? `Hebat sekali! Ananda ${submission.nama} berhasil mencapai kompetensi materi Sistem Pencernaan pada Manusia dengan hasil memuaskan.`
            : `Tetap semangat! Ananda ${submission.nama} belum melampaui batas KKTP 70. Silakan pelajari kembali materi dan berkonsultasi dengan guru pengampu.`}
        </p>

        {/* Student Data Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8 text-left">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-[11px] text-slate-500 font-semibold">Nama Siswa</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {submission.nama}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-[11px] text-slate-500 font-semibold">Nomor Absen</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              Absen {submission.nomorAbsen} (Kls {submission.kelas})
            </p>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Jawaban Benar</span>
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-900">
              {submission.benar} Soal
            </p>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
            <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Jawaban Salah</span>
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-rose-900">
              {submission.salah} Soal
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="btn-unduh-hasil-pdf"
            type="button"
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Lembar Hasil Tes (PDF)</span>
          </button>

          <button
            id="btn-tes-baru"
            type="button"
            onClick={onRestartTest}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembali ke Awal / Tes Baru</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          * Lembar PDF resmi dilengkapi kolom tanda tangan Guru ({CONFIG.NAMA_GURU}) dan Orang Tua/Wali murid.
        </p>
      </div>

      {/* Answer Key & Discussion Section */}
      {guruSettings.showAnswerKeyToStudents ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kunci Jawaban & Pembahasan Lengkap
              </h3>
              <p className="text-xs text-slate-500">
                Fitur dibuka oleh Guru Pengampu untuk bahan evaluasi belajar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {submission.details?.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  item.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-rose-200 bg-rose-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Soal No. {item.questionNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.isCorrect ? '✓ Benar' : '✕ Salah'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 mb-2.5 font-medium">
                  {item.questionText}
                </p>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-xs space-y-1 mb-2">
                  <p className="text-slate-600">
                    <strong>Kunci Jawaban Benar:</strong>{' '}
                    <span className="text-emerald-700 font-semibold">
                      {item.correctAnswerSummary}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  <strong>Pembahasan:</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            Kunci Jawaban Dirahasiakan
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Demi menjaga objektivitas dan ketertiban evaluasi, kunci jawaban dan pembahasan soal hanya dapat dibuka melalui izin Administrator / Panel Guru.
          </p>
        </div>
      )}
    </div>
  );
};
