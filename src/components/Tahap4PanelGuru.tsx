import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Settings,
  Code,
  AlertTriangle,
  Edit,
  Plus,
  Save,
  Lock,
  LogOut,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpDown,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { CONFIG } from '../config';
import { GuruSettings, Question, TestSubmission } from '../types';
import { gasService, GOOGLE_APPS_SCRIPT_SAMPLE_CODE } from '../services/gasService';
import { generateTestResultPDF } from '../utils/pdfGenerator';

interface Tahap4PanelGuruProps {
  submissions: TestSubmission[];
  isLoading: boolean;
  fetchError: string | null;
  onRefreshData: () => Promise<void>;
  onDeleteSubmission: (id: string, submission?: TestSubmission) => Promise<void>;
  guruSettings: GuruSettings;
  onUpdateSettings: (settings: GuruSettings) => void;
  questions: Question[];
  onUpdateQuestions: (updated: Question[]) => void;
  onLogoutGuru: () => void;
}

export const Tahap4PanelGuru: React.FC<Tahap4PanelGuruProps> = ({
  submissions,
  isLoading,
  fetchError,
  onRefreshData,
  onDeleteSubmission,
  guruSettings,
  onUpdateSettings,
  questions,
  onUpdateQuestions,
  onLogoutGuru,
}) => {
  // Navigation tabs in Guru Panel
  const [activeTab, setActiveTab] = useState<'rekap' | 'bank_soal' | 'panduan_gas'>('rekap');

  // Filter & Search states
  const [searchName, setSearchName] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'nilai' | 'nama' | 'nomorAbsen'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected student for detail modal
  const [selectedDetail, setSelectedDetail] = useState<TestSubmission | null>(null);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<TestSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Question editing modal state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Copy code feedback
  const [copiedScript, setCopiedScript] = useState(false);

  // Summary Metrics calculations
  const totalPeserta = submissions.length;
  const jumlahLulus = submissions.filter((s) => s.status === 'Lulus').length;
  const jumlahBelumLulus = submissions.filter((s) => s.status === 'Belum Lulus').length;
  const rataRataNilai =
    totalPeserta > 0
      ? Math.round(submissions.reduce((acc, s) => acc + (Number(s.nilai) || 0), 0) / totalPeserta)
      : 0;

  // Available unique classes for filtering
  const availableKelas = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.kelas) set.add(s.kelas);
    });
    return Array.from(set);
  }, [submissions]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((item) => {
        // Name filter
        if (searchName.trim()) {
          const matchName = item.nama?.toLowerCase().includes(searchName.toLowerCase().trim());
          if (!matchName) return false;
        }
        // Class filter
        if (filterKelas !== 'Semua' && item.kelas !== filterKelas) {
          return false;
        }
        // Status filter
        if (filterStatus !== 'Semua' && item.status !== filterStatus) {
          return false;
        }
        // Date filter
        if (filterDate) {
          if (!item.timestamp || !item.timestamp.includes(filterDate)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'nilai' || sortBy === 'nomorAbsen') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = (valA || '').toString().toLowerCase();
          valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [submissions, searchName, filterKelas, filterStatus, filterDate, sortBy, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSort = (field: 'timestamp' | 'nilai' | 'nama' | 'nomorAbsen') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const updatedList = questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q));
    onUpdateQuestions(updatedList);
    setEditingQuestion(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Mode Administrator / Guru</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Guru & Sinkronisasi Nilai
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {CONFIG.SEKOLAH} • Pengampu: {CONFIG.NAMA_GURU} (NIP: {CONFIG.NIP_GURU})
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="btn-refresh-data"
            type="button"
            onClick={onRefreshData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>REFRESH DATA</span>
          </button>

          <button
            id="btn-logout-guru"
            type="button"
            onClick={onLogoutGuru}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            title="Keluar dari Panel Guru"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Peserta
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPeserta}</p>
          <p className="text-[11px] text-slate-400 mt-1">Siswa telah submit tes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Jumlah Lulus
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{jumlahLulus}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Nilai &ge; {CONFIG.KKTP} ({totalPeserta > 0 ? Math.round((jumlahLulus / totalPeserta) * 100) : 0}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Jumlah Belum Lulus
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">{jumlahBelumLulus}</p>
          <p className="text-[11px] text-slate-400 mt-1">Perlu remedial</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Rata-rata Nilai
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{rataRataNilai}</p>
          <p className="text-[11px] text-slate-400 mt-1">Skala 0 - 100</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'rekap'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekap Hasil Ujian ({totalPeserta})
          </button>
          <button
            onClick={() => setActiveTab('bank_soal')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'bank_soal'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bank Soal & Jawaban ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('panduan_gas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'panduan_gas'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panduan Google Apps Script
          </button>
        </div>

        {/* Global Answer Key Release Toggle for Students */}
        <div className="flex items-center space-x-2.5 px-3 py-1 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">
            Kunci Jawaban ke Siswa:
          </span>
          <button
            id="toggle-kunci-jawaban"
            type="button"
            onClick={() =>
              onUpdateSettings({
                ...guruSettings,
                showAnswerKeyToStudents: !guruSettings.showAnswerKeyToStudents,
              })
            }
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              guruSettings.showAnswerKeyToStudents ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                guruSettings.showAnswerKeyToStudents ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-xs font-bold ${
              guruSettings.showAnswerKeyToStudents ? 'text-blue-700' : 'text-slate-400'
            }`}
          >
            {guruSettings.showAnswerKeyToStudents ? 'Dibuka' : 'Ditutup'}
          </span>
        </div>
      </div>

      {/* TAB 1: REKAP TABEL HASIL */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* API Error Notification if fetch failed */}
          {fetchError && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold">{fetchError}</p>
                <p className="text-xs text-amber-700 mt-1">
                  Pastikan skrip Google Apps Script sudah di-deploy sebagai Web App dengan akses &quot;Siapa saja&quot; (Anyone), atau klik tombol REFRESH DATA di bawah.
                </p>
                <button
                  onClick={onRefreshData}
                  className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer"
                >
                  REFRESH DATA
                </button>
              </div>
            </div>
          )}

          {/* Table Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search by Name */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Filter Kelas */}
              <div>
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Semua">Semua Kelas</option>
                  <option value="V">Kelas V</option>
                  {availableKelas
                    .filter((k) => k !== 'V')
                    .map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Semua">Semua Status (Lulus & Belum)</option>
                  <option value="Lulus">Lulus (Nilai &ge; 70)</option>
                  <option value="Belum Lulus">Belum Lulus (Nilai &lt; 70)</option>
                </select>
              </div>

              {/* Filter Date */}
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Clear filters button if active */}
            {(searchName || filterKelas !== 'Semua' || filterStatus !== 'Semua' || filterDate) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSearchName('');
                    setFilterKelas('Semua');
                    setFilterStatus('Semua');
                    setFilterDate('');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Banner Notifikasi Penghapusan */}
          {deleteFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{deleteFeedback}</span>
              </div>
              <button
                onClick={() => setDeleteFeedback(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th
                      onClick={() => handleToggleSort('timestamp')}
                      className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Timestamp</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort('nama')}
                      className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Siswa</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3.5">Kelas</th>
                    <th
                      onClick={() => handleToggleSort('nomorAbsen')}
                      className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Absen</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Benar</th>
                    <th className="p-3.5 text-center">Salah</th>
                    <th
                      onClick={() => handleToggleSort('nilai')}
                      className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Nilai</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold">Belum ada data rekap ujian yang cocok</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Data diambil langsung dari Google Spreadsheet melalui Google Apps Script.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedSubmissions.map((row) => {
                      const isLulus = row.status === 'Lulus';
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 text-slate-500 text-xs whitespace-nowrap">
                            {row.timestamp || '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {row.nama}
                          </td>
                          <td className="p-3.5 text-slate-600 whitespace-nowrap">
                            Kelas {row.kelas || 'V'}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-700">
                            {row.nomorAbsen}
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-600">
                            {row.benar}
                          </td>
                          <td className="p-3.5 text-center font-bold text-rose-600">
                            {row.salah}
                          </td>
                          <td className="p-3.5 text-center font-extrabold text-slate-900">
                            <span className="text-base">{row.nilai}</span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLulus
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Lihat Detail */}
                              <button
                                onClick={() => setSelectedDetail(row)}
                                title="Lihat Detail Jawaban"
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Download PDF */}
                              <button
                                onClick={() => generateTestResultPDF(row)}
                                title="Unduh Lembar Nilai PDF Resmi"
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {/* Hapus Data */}
                              <button
                                id={`btn-hapus-siswa-${row.id}`}
                                onClick={() => setItemToDelete(row)}
                                title={`Hapus Data Ujian: ${row.nama}`}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer group"
                              >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} dari{' '}
                  {filteredSubmissions.length} hasil
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BANK SOAL MANAGEMENT */}
      {activeTab === 'bank_soal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Manajemen Bank Soal & Pembahasan
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh {questions.length} butir soal materi Sistem Pencernaan pada Manusia dapat ditinjau dan diedit oleh guru.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              Total {questions.length} Butir Soal
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Topik: {q.topic}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        q.difficulty === 'Mudah'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.difficulty === 'Sedang'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {q.type === 'single_choice'
                        ? 'Pilihan Ganda'
                        : q.type === 'multiple_choice_complex'
                        ? 'PG Kompleks'
                        : 'Kategori Matriks'}
                    </span>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Soal</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                  {q.text}
                </p>

                {/* Options display */}
                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt) => {
                      const isCorrect =
                        q.correctAnswer === opt.id || q.correctAnswers?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl text-xs border ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <strong>{opt.id}.</strong> {opt.text}{' '}
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 ml-1">
                              (Kunci Jawaban)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Category Statements display */}
                {q.statements && (
                  <div className="space-y-1.5 mb-3">
                    {q.statements.map((st, sIdx) => (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <span>
                          {sIdx + 1}. {st.text}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          Kunci: {st.correctAnswer}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-blue-900">Pembahasan:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE APPS SCRIPT SETUP GUIDE */}
      {activeTab === 'panduan_gas' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Panduan Sinkronisasi Google Apps Script & Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Arsitektur resmi: SISWA &rarr; FRONTEND &rarr; GOOGLE APPS SCRIPT WEB APP &rarr; GOOGLE SPREADSHEET
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2">
            <p className="font-bold text-slate-800">Konfigurasi Endpoint Aktif Saat Ini:</p>
            <div className="p-3 bg-white font-mono text-xs text-blue-700 break-all rounded-lg border border-slate-300 select-all">
              {CONFIG.GOOGLE_APPS_SCRIPT_URL}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Kode Google Apps Script Lengkap (Tinggal Salin & Tempel ke Apps Script):
              </span>
              <button
                onClick={handleCopyScript}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Skrip</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
              {GOOGLE_APPS_SCRIPT_SAMPLE_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL JAWABAN SISWA */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detail Lembar Jawaban: {selectedDetail.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  Absen: {selectedDetail.nomorAbsen} • Kelas {selectedDetail.kelas} • Nilai: {selectedDetail.nilai} ({selectedDetail.status})
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-3 flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Total Soal</span>
                  <strong className="text-slate-800">{selectedDetail.totalSoal} Soal</strong>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 block">Jawaban Benar</span>
                  <strong className="text-emerald-900">{selectedDetail.benar}</strong>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-rose-700 block">Jawaban Salah</span>
                  <strong className="text-rose-900">{selectedDetail.salah}</strong>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-700 block">Nilai Akhir</span>
                  <strong className="text-blue-900 text-sm">{selectedDetail.nilai}</strong>
                </div>
              </div>

              {selectedDetail.details && selectedDetail.details.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {selectedDetail.details.map((d, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs ${
                        d.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex justify-between font-bold mb-1">
                        <span>No. {d.questionNumber} - {d.questionText}</span>
                        <span className={d.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {d.isCorrect ? 'Benar' : 'Salah'}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Kunci: <strong>{d.correctAnswerSummary}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Rekapitulasi nilai tersimpan langsung dari database Google Spreadsheet.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const target = selectedDetail;
                  setSelectedDetail(null);
                  setItemToDelete(target);
                }}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Hapus data ujian siswa ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateTestResultPDF(selectedDetail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF Resmi</span>
                </button>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SOAL BANK SOAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveQuestion}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
          >
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Edit Soal No. {editingQuestion.originalNumber}
            </h3>

            <div className="my-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teks Pertanyaan
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.text}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, text: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Kesulitan
                </label>
                <select
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      difficulty: e.target.value as any,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Sukar">Sukar</option>
                </select>
              </div>

              {editingQuestion.type === 'single_choice' && editingQuestion.options && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kunci Jawaban Benar
                  </label>
                  <select
                    value={editingQuestion.correctAnswer}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-700"
                  >
                    {editingQuestion.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.id} - {opt.text}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pembahasan / Penjelasan Jawaban
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS DATA SISWA */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
              Hapus Rekap Nilai Siswa?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              Data hasil ujian ini akan dihapus dari sistem rekapitulasi dan disinkronkan ke database Google Spreadsheet.
            </p>

            {/* Ringkasan Data Siswa yang Akan Dihapus */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Lengkap:</span>
                <strong className="text-slate-900 font-bold">{itemToDelete.nama}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor Absen / Kelas:</span>
                <span className="font-semibold text-slate-700">No. {itemToDelete.nomorAbsen} • Kelas {itemToDelete.kelas || 'V'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nilai Akhir:</span>
                <span
                  className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                    itemToDelete.nilai >= CONFIG.KKTP
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {itemToDelete.nilai} ({itemToDelete.status})
                </span>
              </div>
              {itemToDelete.timestamp && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Waktu Tes:</span>
                  <span className="text-slate-600 font-mono text-[11px]">{itemToDelete.timestamp}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-hapus-siswa"
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!itemToDelete) return;
                  setIsDeleting(true);
                  try {
                    await onDeleteSubmission(itemToDelete.id, itemToDelete);
                    setDeleteFeedback(`Data ujian atas nama "${itemToDelete.nama}" berhasil dihapus.`);
                    setItemToDelete(null);
                    setTimeout(() => setDeleteFeedback(null), 4000);
                  } catch (err) {
                    console.error('Gagal menghapus data:', err);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
