'use client';

import { useCallback, useEffect, useState } from 'react';

export type SheetRow = {
  rowIndex: number;
  name: string;
  date: string;
  email: string;
  password: string;
  recovery: string;
  oldRecovery?: string;
  newPassword?: string;
  newMkCapital?: string;
  mkCapital: string;
  code: string;
  isDone: boolean;
  isPasswordError?: boolean;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
};

export function extractSheetId(url: string): string {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : url.trim();
}

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('[Storage] Cannot read localStorage:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('[Storage] Cannot write localStorage:', e);
    }
  }
};

export function useSheet(initialSheetId: string, initialSheetName = 'Sheet1', initialMode: 'default' | 'capital' = 'default') {
  const [sheetId, setSheetId] = useState(initialSheetId);
  const [sheetName, setSheetName] = useState(initialSheetName);
  const [mode, setMode] = useState<'default' | 'capital'>(initialMode);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Khởi tạo thông tin từ localStorage sau khi component mounted để tránh hydration mismatch
  useEffect(() => {
    const savedId = safeLocalStorage.getItem('sheetId');
    const savedName = safeLocalStorage.getItem('sheetName');
    const savedMode = safeLocalStorage.getItem('sheetMode');
    if (savedId && savedId !== 'null' && savedId.trim() !== '') setSheetId(savedId);
    if (savedName && savedName !== 'null' && savedName.trim() !== '') setSheetName(savedName);
    if (savedMode && savedMode !== 'null' && savedMode.trim() !== '') setMode(savedMode as any);
    setIsReady(true);
  }, []);

  const fetchRows = useCallback(async () => {
    if (!isReady || !sheetId) {
      return [];
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/read-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, sheetName, mode }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Không đọc được sheet (Vui lòng kiểm tra lại Tên Trang Tính)');
        setRows([]);
        return [];
      } else {
        const list = data.rows ?? [];
        setRows(list);
        return list;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, [sheetId, sheetName, mode, isReady]);

  useEffect(() => {
    if (isReady && sheetId) void fetchRows();
  }, [isReady, sheetId, fetchRows]);

  const patchRow = useCallback((rowIndex: number, patch: Partial<SheetRow>) => {
    setRows(prev =>
      prev.map(r => (r.rowIndex === rowIndex ? { ...r, ...patch } : r))
    );
  }, []);

  return { sheetId, setSheetId, sheetName, setSheetName, mode, setMode, rows, loading, error, fetchRows, patchRow };
}
