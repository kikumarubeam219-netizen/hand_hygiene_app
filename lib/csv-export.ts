import { HygieneRecord, TIMING_INFO, ACTION_LABELS, TimingType } from './types';
import { Platform, Share, Alert, Clipboard } from 'react-native';

export function generateCSV(records: HygieneRecord[], startDate: Date, endDate: Date): string {
  // ヘッダー
  const headers = [
    '日付',
    '時刻',
    'タイミング',
    'タイミング説明',
    '実施内容',
    'ユーザー名',
    '施設名',
    '備考',
  ];

  // データ行
  const rows = records
    .filter((r) => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((record) => {
      const date = new Date(record.timestamp);
      const dateStr = date.toLocaleDateString('ja-JP');
      const timeStr = date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const timing = TIMING_INFO[record.timing];

      return [
        dateStr,
        timeStr,
        String(record.timing),
        timing.name,
        ACTION_LABELS[record.action],
        record.userName || '',
        record.facilityName || '',
        record.notes || '',
      ];
    });

  // CSV形式に変換
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map((row) => row.map(escapeCSVField).join(',')),
  ].join('\n');

  return csvContent;
}

export function generateStatisticsCSV(
  records: HygieneRecord[],
  startDate: Date,
  endDate: Date
): string {
  const filteredRecords = records.filter(
    (r) => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime()
  );

  // 統計データを計算
  const stats = {
    total: filteredRecords.length,
    byTiming: {} as Record<TimingType, number>,
    byAction: {
      hand_sanitizer: 0,
      hand_wash: 0,
      no_action: 0,
    },
  };

  for (let i = 1; i <= 5; i++) {
    const timing = i as TimingType;
    stats.byTiming[timing] = filteredRecords.filter((r) => r.timing === timing).length;
  }

  stats.byAction.hand_sanitizer = filteredRecords.filter(
    (r) => r.action === 'hand_sanitizer'
  ).length;
  stats.byAction.hand_wash = filteredRecords.filter((r) => r.action === 'hand_wash').length;
  stats.byAction.no_action = filteredRecords.filter((r) => r.action === 'no_action').length;

  // CSV形式に変換
  const completedCount = stats.byAction.hand_sanitizer + stats.byAction.hand_wash;
  const completionRate = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;

  const lines = [
    '手指衛生統計レポート',
    '',
    `期間,${startDate.toLocaleDateString('ja-JP')} ～ ${endDate.toLocaleDateString('ja-JP')}`,
    '',
    '【合計統計】',
    `総実施数,${stats.total}`,
    `実施率,${completionRate}%`,
    '',
    '【タイミング別】',
    'タイミング,実施数,実施率',
  ];

  for (let i = 1; i <= 5; i++) {
    const timing = i as TimingType;
    const timingInfo = TIMING_INFO[timing];
    const count = stats.byTiming[timing] || 0;
    // 画面と同じ計算方法： そのタイミングでno_action以外の割合
    const timingRecords = filteredRecords.filter((r) => r.timing === timing);
    const completedInTiming = timingRecords.filter((r) => r.action !== 'no_action').length;
    const rate = timingRecords.length > 0 ? Math.round((completedInTiming / timingRecords.length) * 100) : 0;
    lines.push(`${timingInfo.name},${count},${rate}%`);
  }

  lines.push('');
  lines.push('【実施内容別】');
  lines.push('実施内容,実施数,実施率');
  lines.push(
    `手指消毒,${stats.byAction.hand_sanitizer},${stats.total > 0 ? Math.round((stats.byAction.hand_sanitizer / stats.total) * 100) : 0
    }%`
  );
  lines.push(
    `手洗い,${stats.byAction.hand_wash},${stats.total > 0 ? Math.round((stats.byAction.hand_wash / stats.total) * 100) : 0
    }%`
  );
  lines.push(
    `実施なし,${stats.byAction.no_action},${stats.total > 0 ? Math.round((stats.byAction.no_action / stats.total) * 100) : 0
    }%`
  );

  return lines.join('\n');
}

function escapeCSVField(field: string): string {
  if (!field) return '';
  // ダブルクォートが含まれている場合はエスケープ
  const escaped = field.replace(/"/g, '""');
  // カンマ、改行、ダブルクォートが含まれている場合はクォートで囲む
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export async function downloadCSV(content: string, filename: string): Promise<void> {
  // BOM（Byte Order Mark）を追加してExcelで日本語が正しく表示されるようにする
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + content;

  // モバイル環境（iOS/Android）での実装
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      // CSVの内容をクリップボードにコピー
      await Clipboard.setString(csvWithBOM);

      // Share APIを使用してCSVを共有
      const result = await Share.share({
        message: csvWithBOM,
        title: filename,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('成功', 'CSVが共有されました');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert(
        'CSVエクスポート',
        'CSVの内容がクリップボードにコピーされました。\nメールなどに貼り付けて使用してください。'
      );
    }
  }
  // ブラウザ環境での実装
  else if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function getCSVFilename(type: 'records' | 'statistics', startDate: Date): string {
  const dateStr = startDate.toISOString().split('T')[0];
  return type === 'records'
    ? `hygiene_records_${dateStr}.csv`
    : `hygiene_statistics_${dateStr}.csv`;
}
