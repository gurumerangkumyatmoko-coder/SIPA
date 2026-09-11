import { CONFIG } from '../config';
import { TestSubmission } from '../types';

export interface GasApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Local storage key for offline or cached submissions
const LOCAL_SUBMISSIONS_KEY = 'sdn3_loloantimur_test_submissions';

export const gasService = {
  /**
   * Submit student test result to Google Apps Script Web App
   */
  async submitTest(submission: TestSubmission): Promise<{ success: boolean; message?: string }> {
    const payload = {
      action: 'submitTest',
      timestamp: submission.timestamp,
      id: submission.id,
      nama: submission.nama,
      nomorAbsen: submission.nomorAbsen,
      kelas: submission.kelas,
      totalSoal: submission.totalSoal,
      benar: submission.benar,
      salah: submission.salah,
      nilai: submission.nilai,
      status: submission.status,
      // Pass serialized details for comprehensive sheet logging
      summary: `Nilai: ${submission.nilai} (${submission.status}) | Benar: ${submission.benar}/${submission.totalSoal}`,
    };

    try {
      // Using text/plain prevents CORS preflight OPTIONS in Google Apps Script
      const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const text = await response.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        // If response is plain text or HTML redirect
        if (text.includes('success') || text.includes('OK') || response.status === 200) {
          result = { status: 'success' };
        } else {
          result = { status: 'error', message: text };
        }
      }

      if (result.status === 'success' || result.result === 'success') {
        // Also save to local backup
        gasService.saveToLocalBackup(submission);
        return { success: true };
      } else {
        // If script returned an error object
        throw new Error(result.message || 'Gagal menyimpan ke Google Spreadsheet.');
      }
    } catch (err: any) {
      console.warn('Direct GAS POST error:', err);
      // If CORS or network error occurs, we can try with mode 'no-cors' as fallback
      try {
        await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
        });
        // With no-cors, request is sent to Google Apps Script server (opaque response)
        gasService.saveToLocalBackup(submission);
        return { success: true };
      } catch (noCorsErr: any) {
        console.error('All submission attempts failed:', noCorsErr);
        throw new Error('Gagal mengirim jawaban ke server Google Apps Script. Periksa koneksi internet Anda.');
      }
    }
  },

  /**
   * Fetch all test results from Google Apps Script Web App
   */
  async getResults(): Promise<TestSubmission[]> {
    try {
      const url = new URL(CONFIG.GOOGLE_APPS_SCRIPT_URL);
      url.searchParams.set('action', 'getResults');
      url.searchParams.set('t', Date.now().toString()); // prevent browser caching

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data)) {
        return data;
      } else if (data && data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      } else if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        // If data is empty array from spreadsheet, return empty array as required
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch from GAS:', error);
      throw new Error('Gagal mengambil data dari server. Periksa koneksi internet atau konfigurasi Google Apps Script.');
    }
  },

  /**
   * Delete submission from Google Apps Script and local storage
   */
  async deleteResult(id: string, submission?: TestSubmission): Promise<boolean> {
    const payload = {
      action: 'deleteResult',
      id: id,
      nama: submission?.nama,
      nomorAbsen: submission?.nomorAbsen,
      timestamp: submission?.timestamp,
    };

    try {
      const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        gasService.deleteFromLocalBackup(id);
        return true;
      }
    } catch (err) {
      console.warn('Direct GAS delete error, trying no-cors fallback:', err);
      try {
        await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
        });
      } catch (noCorsErr) {
        console.error('Failed to send delete to GAS:', noCorsErr);
      }
    }
    gasService.deleteFromLocalBackup(id);
    return true;
  },

  /**
   * Local storage backup helpers
   */
  getLocalBackups(): TestSubmission[] {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveToLocalBackup(submission: TestSubmission) {
    try {
      const existing = gasService.getLocalBackups();
      // Avoid duplicate
      const filtered = existing.filter((item) => item.id !== submission.id);
      filtered.unshift(submission);
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to save to local backup', err);
    }
  },

  deleteFromLocalBackup(id: string) {
    try {
      const existing = gasService.getLocalBackups();
      const filtered = existing.filter((item) => item.id !== id);
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to delete from local backup', err);
    }
  },
};

/**
 * Complete Google Apps Script code guide for the teacher / administrator
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE_CODE = `/**
 * =========================================================================
 * SKRIP GOOGLE APPS SCRIPT - TES SUMATIF IPA KELAS V
 * SD NEGERI 3 LOLOAN TIMUR
 * =========================================================================
 * Petunjuk Pemasangan:
 * 1. Buka Google Spreadsheet baru (atau gunakan spreadsheet yang sudah ada).
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus semua kode default dan tempelkan (paste) seluruh kode di bawah ini.
 * 4. Klik tombol 'Simpan' (Save).
 * 5. Klik tombol 'Terapkan' (Deploy) -> 'Penerapan Baru' (New Deployment).
 * 6. Pilih Jenis: 'Aplikasi Web' (Web App).
 * 7. Pada 'Jalankan sebagai': Pilih 'Saya' (Me).
 * 8. Pada 'Siapa yang memiliki akses': Pilih 'Siapa saja' (Anyone).
 * 9. Klik 'Terapkan', izinkan akses jika diminta.
 * 10. Salin URL Aplikasi Web yang dihasilkan ke konfigurasi aplikasi.
 * =========================================================================
 */

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "Rekap Hasil Tes");
    
    var data = [];
    var rows = sheet.getDataRange().getValues();
    
    if (rows.length > 1) {
      var headers = rows[0];
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (!row[0] && !row[1]) continue; // lewati baris kosong
        
        data.push({
          timestamp: row[0] ? row[0].toString() : "",
          nama: row[1] ? row[1].toString() : "",
          kelas: row[2] ? row[2].toString() : "V",
          nomorAbsen: row[3] ? row[3].toString() : "",
          totalSoal: Number(row[4]) || 14,
          benar: Number(row[5]) || 0,
          salah: Number(row[6]) || 0,
          nilai: Number(row[7]) || 0,
          status: row[8] ? row[8].toString() : (Number(row[7]) >= 70 ? "Lulus" : "Belum Lulus"),
          id: row[9] ? row[9].toString() : ("ROW_" + i)
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: data.length,
      data: data
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var contents = e.postData.contents;
    var postData = JSON.parse(contents);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "Rekap Hasil Tes");
    
    // Aksi: Hapus Data
    if (postData.action === "deleteResult") {
      var rows = sheet.getDataRange().getValues();
      var deleted = false;
      for (var i = 1; i < rows.length; i++) {
        var rowId = rows[i][9] ? rows[i][9].toString().trim() : "";
        var rowNama = rows[i][1] ? rows[i][1].toString().trim().toLowerCase() : "";
        var rowAbsen = rows[i][3] ? rows[i][3].toString().trim() : "";
        
        var targetId = postData.id ? postData.id.toString().trim() : "";
        var targetNama = postData.nama ? postData.nama.toString().trim().toLowerCase() : "";
        var targetAbsen = postData.nomorAbsen ? postData.nomorAbsen.toString().trim() : "";

        if (
          (rowId && targetId && rowId === targetId) ||
          ("ROW_" + i === targetId) ||
          (targetNama && rowNama === targetNama && (!targetAbsen || rowAbsen === targetAbsen))
        ) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: deleted ? "Data berhasil dihapus dari Spreadsheet" : "Data lokal berhasil dihapus"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Aksi: Submit Test Siswa
    var timestamp = postData.timestamp || new Date().toLocaleString("id-ID");
    var nama = postData.nama || "-";
    var kelas = postData.kelas || "V";
    var nomorAbsen = postData.nomorAbsen || "-";
    var totalSoal = postData.totalSoal || 14;
    var benar = postData.benar || 0;
    var salah = postData.salah || 0;
    var nilai = postData.nilai !== undefined ? postData.nilai : 0;
    var status = postData.status || (nilai >= 70 ? "Lulus" : "Belum Lulus");
    var id = postData.id || ("ID_" + new Date().getTime());
    
    sheet.appendRow([
      timestamp,
      nama,
      kelas,
      nomorAbsen,
      totalSoal,
      benar,
      salah,
      nilai,
      status,
      id
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data hasil tes berhasil direkap di Google Spreadsheet"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      "Timestamp",
      "Nama Siswa",
      "Kelas",
      "Nomor Absen",
      "Total Soal",
      "Jawaban Benar",
      "Jawaban Salah",
      "Nilai Akhir",
      "Status",
      "ID Unik"
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#E2E8F0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
`;
