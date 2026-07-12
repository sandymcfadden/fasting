import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { db } from '../db/db';
import type { Schedule, DayLog } from '../types';

interface BackupFile {
  version: number;
  exportedAt: string;
  schedules: Schedule[];
  dayLogs: DayLog[];
}

function isValidBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    Array.isArray(d.schedules) &&
    Array.isArray(d.dayLogs)
  );
}

type ImportMode = 'replace' | 'merge';

interface ImportPreview {
  file: BackupFile;
  mode: ImportMode;
}

export function DataPortability() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleExport() {
    const [schedules, dayLogs] = await Promise.all([
      db.schedules.toArray(),
      db.dayLogs.toArray(),
    ]);
    const backup: BackupFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schedules,
      dayLogs,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fasting-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMsg(`Exported ${schedules.length} schedule(s) and ${dayLogs.length} log(s).`);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!isValidBackup(parsed)) {
          setError('Invalid backup file. Make sure you selected a file exported from this app.');
          return;
        }
        setPreview({ file: parsed, mode: 'replace' });
      } catch {
        setError('Could not parse file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    const { file, mode } = preview;

    function stripId<T extends { id?: number }>({ id: _id, ...rest }: T): Omit<T, 'id'> {
      return rest;
    }

    if (mode === 'replace') {
      await db.transaction('rw', db.schedules, db.dayLogs, async () => {
        await db.schedules.clear();
        await db.dayLogs.clear();
        await db.schedules.bulkAdd(file.schedules.map(stripId) as Schedule[]);
        await db.dayLogs.bulkAdd(file.dayLogs.map(stripId) as DayLog[]);
      });
    } else {
      // Merge: imported records win on conflict (same startDate / same date)
      await db.transaction('rw', db.schedules, db.dayLogs, async () => {
        for (const s of file.schedules.map(stripId) as Schedule[]) {
          const existing = await db.schedules.where('startDate').equals(s.startDate).first();
          if (existing) {
            await db.schedules.update(existing.id!, { ...s } as Partial<Schedule>);
          } else {
            await db.schedules.add(s);
          }
        }
        for (const l of file.dayLogs.map(stripId) as DayLog[]) {
          const existing = await db.dayLogs.where('date').equals(l.date).first();
          if (existing) {
            await db.dayLogs.update(existing.id!, { ...l } as Partial<DayLog>);
          } else {
            await db.dayLogs.add(l);
          }
        }
      });
    }

    setImporting(false);
    setPreview(null);
    setSuccessMsg(
      mode === 'replace'
        ? `Replaced all data with ${file.schedules.length} schedule(s) and ${file.dayLogs.length} log(s).`
        : `Merged ${file.schedules.length} schedule(s) and ${file.dayLogs.length} log(s).`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-5">
      <p className="text-xs font-medium text-gray-600 mb-3">Backup & restore</p>

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          ↓ Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          ↑ Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
      {successMsg && (
        <p className="mt-2 text-xs text-green-600">{successMsg}</p>
      )}

      {/* Import preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm mx-auto p-5 pb-8 sm:pb-5">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Import backup</h3>
            <p className="text-xs text-gray-500 mb-4">
              Found <strong>{preview.file.schedules.length}</strong> schedule(s) and{' '}
              <strong>{preview.file.dayLogs.length}</strong> logged day(s) from{' '}
              {format(new Date(preview.file.exportedAt), 'MMM d, yyyy')}.
            </p>

            <p className="text-xs font-medium text-gray-600 mb-2">How to import</p>
            <div className="space-y-2 mb-5">
              {(['replace', 'merge'] as ImportMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPreview(p => p ? { ...p, mode: m } : p)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-colors ${
                    preview.mode === m
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {m === 'replace' ? 'Replace all' : 'Merge'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {m === 'replace'
                      ? 'Deletes all existing data first, then imports. Use this when moving to a new browser.'
                      : 'Adds imported records and updates conflicts with imported values. Keeps records not in the file.'}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                {importing ? 'Importing…' : `Confirm ${preview.mode}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
