import React from 'react';
import { BookOpen, School, Shield, User, Award } from 'lucide-react';
import { CONFIG } from '../config';
import { StudentIdentity } from '../types';

interface HeaderNavbarProps {
  currentStage: 1 | 2 | 3 | 4;
  student: StudentIdentity | null;
  onNavigateStage: (stage: 1 | 2 | 3 | 4) => void;
  onOpenGuruAuth: () => void;
  isGuruAuthenticated: boolean;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentStage,
  student,
  onNavigateStage,
  onOpenGuruAuth,
  isGuruAuthenticated,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & School info */}
          <div 
            onClick={() => onNavigateStage(1)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <School className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  Tes Sumatif IPA
                </span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  Kelas {CONFIG.KELAS}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
                {CONFIG.SEKOLAH}
              </h1>
            </div>
          </div>

          {/* Center Stage Badges (Desktop) */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onNavigateStage(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentStage === 1
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Identitas
            </button>
            <button
              onClick={() => student && onNavigateStage(2)}
              disabled={!student}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentStage === 2
                  ? 'bg-white text-blue-700 shadow-xs'
                  : student
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              2. Soal Tes
            </button>
            <button
              disabled={currentStage < 3}
              onClick={() => onNavigateStage(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentStage === 3
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              3. Hasil Tes
            </button>
          </div>

          {/* Right Actions: Student indicator & Guru Panel button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {student && currentStage === 2 && (
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {student.nomorAbsen}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {student.nama}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Kelas {student.kelas}
                  </p>
                </div>
              </div>
            )}

            <button
              id="btn-panel-guru"
              onClick={onOpenGuruAuth}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentStage === 4
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                  : isGuruAuthenticated
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Panel Guru</span>
              <span className="sm:hidden">Guru</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
