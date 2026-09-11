import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CONFIG } from '../config';
import { Question, TestSubmission } from '../types';

/**
 * Generate official question script (Naskah Soal) PDF for SD Negeri 3 Loloan Timur
 */
export function generateQuestionPaperPDF(questions: Question[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header / Kop Dokumen Ujian
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PEMERINTAH KABUPATEN JEMBRANA - DINAS PENDIDIKAN', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(15);
  doc.text(CONFIG.SEKOLAH, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Alamat: Loloan Timur, Kec. Negara, Kab. Jembrana, Bali | NPSN / Akreditasi Resmi', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Horizontal double divider
  doc.setLineWidth(0.8);
  doc.line(15, y, pageWidth - 15, y);
  y += 1;
  doc.setLineWidth(0.2);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('NASKAH TES SUMATIF IPA KELAS V', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text(`MATERI: ${CONFIG.MATERI}`, pageWidth / 2, y, { align: 'center' });
  y += 7;

  // Metadata Table
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 32 },
      3: { cellWidth: 55 },
    },
    body: [
      [
        'Mata Pelajaran',
        `: ${CONFIG.MATA_PELAJARAN}`,
        'Nama Peserta',
        ': ........................................',
      ],
      [
        'Kelas / Semester',
        `: ${CONFIG.KELAS} / Ganjil`,
        'Nomor Absen',
        ': ........................................',
      ],
      [
        'Guru Pengampu',
        `: ${CONFIG.NAMA_GURU}`,
        'Alokasi Waktu',
        ': 60 Menit',
      ],
      [
        'KKTP Minimum',
        `: ${CONFIG.KKTP} Poin`,
        'Tanggal Tes',
        `: ........................................`,
      ],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 4;

  // Instructions
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Petunjuk: Bacalah soal dengan teliti dan pilih jawaban yang paling tepat. Dilarang bekerjasama atau menyontek.', 15, y);
  y += 5;
  doc.setLineWidth(0.2);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  // Questions Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  questions.forEach((q, idx) => {
    // Check if new page needed
    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    doc.setFont('helvetica', 'bold');
    const qNumText = `${idx + 1}. `;
    const qTypeText = q.type === 'multiple_choice_complex'
      ? ' [Pilihan Ganda Kompleks - Lebih dari 1 jawaban]'
      : q.type === 'category_matrix'
      ? ' [Pilihan Ganda Kompleks Kategori]'
      : '';

    doc.text(qNumText, 15, y);
    doc.setFont('helvetica', 'normal');

    if (q.stimulus) {
      const stimulusLines = doc.splitTextToSize(`[Wacana: ${q.stimulus}]`, pageWidth - 36);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(70, 70, 70);
      doc.text(stimulusLines, 22, y);
      y += stimulusLines.length * 4;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    }

    const questionLines = doc.splitTextToSize(q.text + qTypeText, pageWidth - 36);
    doc.text(questionLines, 22, y);
    y += questionLines.length * 4.2;

    // Render options
    if (q.type === 'single_choice' || q.type === 'multiple_choice_complex') {
      if (q.options) {
        q.options.forEach((opt) => {
          if (y > 275) {
            doc.addPage();
            y = 15;
          }
          const optLines = doc.splitTextToSize(`${opt.id}. ${opt.text}`, pageWidth - 42);
          doc.text(optLines, 25, y);
          y += optLines.length * 4;
        });
      }
    } else if (q.type === 'category_matrix') {
      if (q.statements) {
        q.statements.forEach((st, sIdx) => {
          if (y > 275) {
            doc.addPage();
            y = 15;
          }
          const stLine = doc.splitTextToSize(`(${sIdx + 1}) [ ${st.categoryType} ] : ${st.text}`, pageWidth - 42);
          doc.text(stLine, 25, y);
          y += stLine.length * 4;
        });
      }
    }

    y += 2.5; // spacing between questions
  });

  // Footer / Signatures
  if (y > 235) {
    doc.addPage();
    y = 20;
  } else {
    y += 8;
  }

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Mengetahui,', 25, y);
  doc.text(`Loloan Timur, ${dateStr}`, pageWidth - 75, y);
  y += 5;
  doc.text('Orang Tua / Wali Siswa,', 25, y);
  doc.text('Guru Mata Pelajaran IPA,', pageWidth - 75, y);

  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('( .................................................. )', 25, y);
  doc.text(CONFIG.NAMA_GURU, pageWidth - 75, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${CONFIG.NIP_GURU}`, pageWidth - 75, y);

  // Download PDF
  doc.save(`Naskah_Soal_IPA_Kelas5_${CONFIG.SEKOLAH.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate official student test result certificate / sheet signed by Guru and Orang Tua/Wali
 */
export function generateTestResultPDF(submission: TestSubmission) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header / Kop
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PEMERINTAH KABUPATEN JEMBRANA - DINAS PENDIDIKAN', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(15);
  doc.text(CONFIG.SEKOLAH, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Alamat: Loloan Timur, Kec. Negara, Kab. Jembrana, Bali | NPSN / Kode Pos: 82216', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Double horizontal rule
  doc.setLineWidth(0.8);
  doc.line(15, y, pageWidth - 15, y);
  y += 1;
  doc.setLineWidth(0.2);
  doc.line(15, y, pageWidth - 15, y);
  y += 7;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEMBAR HASIL EVALUASI TES SUMATIF', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text(`Mata Pelajaran: ${CONFIG.MATA_PELAJARAN} (Kelas ${submission.kelas || CONFIG.KELAS})`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Materi Pokok: ${CONFIG.MATERI}`, pageWidth / 2, y, { align: 'center' });
  y += 7;

  // Table 1: Student Identity
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['INFORMASI PESERTA DIDIK', 'KETERANGAN']],
    body: [
      ['Nama Lengkap Siswa', submission.nama.toUpperCase()],
      ['Nomor Absen', submission.nomorAbsen],
      ['Kelas / Fase', `${submission.kelas || CONFIG.KELAS} / Fase C`],
      ['Satuan Pendidikan', CONFIG.SEKOLAH],
      ['Waktu Pelaksanaan Tes', submission.timestamp || new Date().toLocaleString('id-ID')],
    ],
    headStyles: {
      fillColor: [30, 58, 138], // Navy blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 120 },
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // Table 2: Test Result & KKTP Evaluation
  const isLulus = submission.status === 'Lulus';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['KOMPONEN PENILAIAN', 'CAPAIAN HASIL', 'KRITERIA KETUNTASAN (KKTP)']],
    body: [
      ['Jumlah Soal Dikerjakan', `${submission.totalSoal} Butir Soal`, '24 Butir Wajib Selesai'],
      ['Jumlah Jawaban Benar', `${submission.benar} Soal`, '-'],
      ['Jumlah Jawaban Salah', `${submission.salah} Soal`, '-'],
      ['Nilai Akhir (Skala 0 - 100)', `${submission.nilai}`, `Batas Minimum: ${CONFIG.KKTP}`],
      [
        'STATUS HASIL TES',
        isLulus ? 'TUNTAS / LULUS' : 'BELUM TUNTAS (PERLU REMEDIAL)',
        isLulus ? 'Memenuhi KKTP' : 'Belum Memenuhi KKTP',
      ],
    ],
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 55 },
    },
    didParseCell: (data) => {
      if (data.row.index === 4 && data.column.index === 1) {
        if (isLulus) {
          data.cell.styles.textColor = [22, 101, 52]; // Dark green
          data.cell.styles.fillColor = [220, 252, 231]; // Light green
        } else {
          data.cell.styles.textColor = [153, 27, 27]; // Dark red
          data.cell.styles.fillColor = [254, 226, 226]; // Light red
        }
      }
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // Catatan Guru & Evaluasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Catatan & Rekomendasi Guru:', 15, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const noteText = isLulus
    ? 'Selamat! Peserta didik telah menguasai materi Sistem Pencernaan pada Manusia dengan capaian di atas KKTP. Pertahankan dan tingkatkan motivasi belajar.'
    : 'Peserta didik belum mencapai batas KKTP (70). Dianjurkan untuk mempelajari kembali materi mengenai fungsi organ pencernaan dan enzim, serta mengikuti sesi remedial.';
  const noteLines = doc.splitTextToSize(noteText, pageWidth - 30);
  doc.text(noteLines, 15, y);
  y += noteLines.length * 4 + 10;

  // Official Signatures section (HANYA DITANDATANGANI GURU & ORANG TUA / WALI)
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Mengetahui / Menyetujui,', 25, y);
  doc.text(`Loloan Timur, ${dateStr}`, pageWidth - 75, y);
  y += 5;
  doc.text('Orang Tua / Wali Peserta Didik,', 25, y);
  doc.text('Guru Mata Pelajaran IPA,', pageWidth - 75, y);

  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.text('( .................................................. )', 25, y);
  doc.text(CONFIG.NAMA_GURU, pageWidth - 75, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${CONFIG.NIP_GURU}`, pageWidth - 75, y);

  // Footer validation stamp code
  y += 10;
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dokumen digital sah diterbitkan melalui Aplikasi Tes Sumatif SDN 3 Loloan Timur. Ref ID: ${submission.id}`, pageWidth / 2, y, { align: 'center' });

  // Save PDF
  doc.save(`Hasil_Tes_IPA_${submission.nama.replace(/\s+/g, '_')}_Absen${submission.nomorAbsen}.pdf`);
}
