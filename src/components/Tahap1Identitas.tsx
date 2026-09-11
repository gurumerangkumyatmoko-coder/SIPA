import React, { useState } from 'react';
import { Play, User, Hash, BookOpen, Clock, Award, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { CONFIG } from '../config';
import { StudentIdentity } from '../types';

interface Tahap1IdentitasProps {
  onStartTest: (identity: StudentIdentity) => void;
  onDownloadQuestionPDF: () => void;
}

export const Tahap1Identitas: React.FC<Tahap1IdentitasProps> = ({
  onStartTest,
  onDownloadQuestionPDF,
}) => {
  const [nama, setNama] = useState('');
  const [nomorAbsen, setNomorAbsen] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama lengkap siswa wajib diisi!');
      return;
    }
    if (!nomorAbsen.trim()) {
      setErrorMsg('Nomor absen siswa wajib diisi!');
      return;
    }

    setErrorMsg('');
    onStartTest({
      nama: nama.trim(),
      nomorAbsen: nomorAbsen.trim(),
      kelas: CONFIG.KELAS,
      startedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs sm:text-sm font-semibold mb-3">
          <BookOpen className="w-4 h-4" />
          <span>Fase C • Tahun Ajaran 2026/2027</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Tes Sumatif Ilmu Pengetahuan Alam (IPA)
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 font-medium">
          Materi: <span className="font-semibold text-blue-700">{CONFIG.MATERI}</span>
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {CONFIG.SEKOLAH}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Identitas Siswa Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tahap 1: Masukkan Identitas Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Isi data dengan benar sebelum mulai mengerjakan soal ujian
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="input-nama-lengkap"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                Nama Lengkap Siswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="input-nama-lengkap"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: I Putu Arya Wijaya"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="input-nomor-absen"
                  className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
                >
                  Nomor Absen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <input
                    id="input-nomor-absen"
                    type="number"
                    min="1"
                    max="50"
                    value={nomorAbsen}
                    onChange={(e) => setNomorAbsen(e.target.value)}
                    placeholder="Contoh: 14"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="input-kelas-readonly"
                  className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
                >
                  Kelas
                </label>
                <input
                  id="input-kelas-readonly"
                  type="text"
                  value={`Kelas ${CONFIG.KELAS}`}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm sm:text-base cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-mulai-tes"
                type="submit"
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Mulai Tes</span>
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          </form>

          {/* Quick PDF download button */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              id="btn-unduh-naskah-soal"
              type="button"
              onClick={onDownloadQuestionPDF}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Naskah Soal Lengkap (PDF)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Information & Ketentuan Soal */}
        <div className="lg:col-span-5 space-y-4">
          {/* Ketentuan Soal Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Struktur & Ketentuan Soal</span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Pilihan Ganda Biasa</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{CONFIG.JUMLAH_SOAL_PG} Soal</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Pilihan Ganda Kompleks</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{CONFIG.JUMLAH_SOAL_PGK} Soal</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600">PG Kompleks Kategori</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{CONFIG.JUMLAH_SOAL_KATEGORI} Soal</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-blue-900">
                <span className="font-semibold">Total Butir Soal</span>
                <span className="font-extrabold text-blue-700">{CONFIG.JUMLAH_TOTAL_SOAL} Soal</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-emerald-900">
                <span className="font-semibold">Batas Kelulusan (KKTP)</span>
                <span className="font-extrabold text-emerald-700">{CONFIG.KKTP} / 100</span>
              </div>
            </div>
          </div>

          {/* Tata Tertib Petunjuk */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
              <span>Petunjuk Pengerjaan</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Soal dan pilihan jawaban akan diacak secara otomatis.</li>
              <li>Siswa wajib menjawab <strong>seluruh {CONFIG.JUMLAH_TOTAL_SOAL} soal</strong> sebelum dapat mengirim jawaban.</li>
              <li>Dapat berpindah nomor soal secara bebas melalui daftar nomor soal.</li>
              <li>Hasil nilai dan lembar evaluasi digital dapat langsung diunduh setelah selesai.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
