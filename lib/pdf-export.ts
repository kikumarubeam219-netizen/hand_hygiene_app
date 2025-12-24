import { Platform, Alert } from 'react-native';
import { HygieneRecord, TIMING_INFO, TimingType } from './types';

interface FacilityInfo {
  facilityName: string;
  department: string;
  ward: string;
  section: string;
  periodNumber: string;
  date: string;
  sessionNumber: string;
  observer: string;
  pageNumber: string;
  address: string;
}

const TIMINGS = {
  1: { name: '患者接触前', description: '患者に接触する前' },
  2: { name: '清潔/無菌操作前', description: '清潔/無菌操作の前' },
  3: { name: '体液曝露後', description: '体液曝露の可能性のある場合' },
  4: { name: '患者接触後', description: '患者に接触した後' },
  5: { name: '患者周辺物品接触後', description: '患者周辺物品に接触した後' },
};

/**
 * 観察フォーム形式のHTMLを生成
 */
export function generateObservationFormHTML(
  records: HygieneRecord[],
  facilityInfo: FacilityInfo,
  startDate: Date,
  endDate: Date
): string {
  // 期間内の記録をフィルタリング
  const filteredRecords = records.filter(
    (r) => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime()
  );

  // 記録を日付別にグループ化
  const recordsByDate: Record<string, HygieneRecord[]> = {};
  filteredRecords.forEach((record) => {
    const date = new Date(record.timestamp);
    const dateKey = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = [];
    }
    recordsByDate[dateKey].push(record);
  });

  // HTMLを生成
  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>手指衛生直接観察用フォーム</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 14px;
      color: #666;
    }
    
    .facility-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
    }
    
    .info-label {
      font-weight: bold;
      color: #333;
    }
    
    .info-value {
      color: #666;
    }
    
    .observation-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .observation-table th,
    .observation-table td {
      border: 1px solid #999;
      padding: 12px;
      text-align: left;
    }
    
    .observation-table th {
      background-color: #e8d4c0;
      font-weight: bold;
      color: #333;
    }
    
    .session-row {
      background-color: #fff5f0;
    }
    
    .timing-name {
      font-weight: bold;
      color: #333;
    }
    
    .action-icon {
      display: inline-block;
      margin-right: 5px;
    }
    
    .checkbox-checked::before {
      content: "☑ ";
      color: #4CAF50;
      font-weight: bold;
    }
    
    .checkbox-unchecked::before {
      content: "☐ ";
      color: #999;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
    }
    
    .print-button {
      display: block;
      margin: 20px auto;
      padding: 12px 30px;
      background-color: #007AFF;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      text-align: center;
    }
    
    .print-button:hover {
      background-color: #0051D5;
    }
    
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 0;
      }
      
      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>泉州感染防止ネットワーク</h1>
      <p>手指衛生直接観察用フォーム</p>
    </div>
    
    <div class="facility-info">
      <div class="info-item">
        <span class="info-label">施設名:</span>
        <span class="info-value">${facilityInfo.facilityName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">部局:</span>
        <span class="info-value">${facilityInfo.department}</span>
      </div>
      <div class="info-item">
        <span class="info-label">病棟:</span>
        <span class="info-value">${facilityInfo.ward}</span>
      </div>
      <div class="info-item">
        <span class="info-label">科:</span>
        <span class="info-value">${facilityInfo.section}</span>
      </div>
      <div class="info-item">
        <span class="info-label">期間番号:</span>
        <span class="info-value">${facilityInfo.periodNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">日付:</span>
        <span class="info-value">${facilityInfo.date}</span>
      </div>
      <div class="info-item">
        <span class="info-label">観察者:</span>
        <span class="info-value">${facilityInfo.observer}</span>
      </div>
      <div class="info-item">
        <span class="info-label">住所:</span>
        <span class="info-value">${facilityInfo.address}</span>
      </div>
    </div>
    
    <table class="observation-table">
      <thead>
        <tr>
          <th style="width: 30%">セッション/タイミング</th>
          <th style="width: 20%">適応</th>
          <th style="width: 50%">手指衛生実施内容</th>
        </tr>
      </thead>
      <tbody>
`;

  // セッションデータを生成（最大8セッション）
  let sessionNum = 0;
  for (const dateKey of Object.keys(recordsByDate).sort().slice(0, 8)) {
    sessionNum++;
    const sessionRecords = recordsByDate[dateKey];

    // 5つのタイミングの行を生成
    for (let timing = 1; timing <= 5; timing++) {
      const timingRecords = sessionRecords.filter((r) => r.timing === timing);
      const timingInfo = TIMINGS[timing as keyof typeof TIMINGS];

      const applicable = timingRecords.length > 0 ? '☑' : '☐';

      let actionHtml = '';
      if (timingRecords.length === 0) {
        actionHtml = '☐手指消毒 ☐手洗い ☐実施なし';
      } else {
        const actions: string[] = [];
        for (const record of timingRecords) {
          if (record.action === 'hand_sanitizer') {
            actions.push('☑手指消毒');
          } else if (record.action === 'hand_wash') {
            actions.push('☑手洗い');
          } else if (record.action === 'no_action') {
            actions.push('☑実施なし');
          }
        }
        actionHtml = actions.join(' ');
      }

      html += `
        <tr class="session-row">
          <td>
            <span class="timing-name">${sessionNum}. ${timingInfo.name}</span><br>
            <small>${timingInfo.description}</small>
          </td>
          <td style="text-align: center; font-size: 18px;">${applicable}</td>
          <td>${actionHtml}</td>
        </tr>
`;
    }
  }

  html += `
      </tbody>
    </table>
    
    <button class="print-button" onclick="window.print()">PDFで印刷</button>
    
    <div class="footer">
      <p>WHO観察フォーム一部変換 | 生成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * HTMLをダウンロード
 * Web環境ではブラウザのダウンロード機能を使用
 * React Native環境ではShare APIを使用
 */
export async function downloadPDF(html: string, filename: string): Promise<void> {
  try {
    // Platform.OSの値を確認
    console.log('[PDF] Platform.OS:', Platform.OS);
    console.log('[PDF] typeof window:', typeof window);

    // Web環境での処理（ブラウザ）
    if (Platform.OS === 'web') {
      console.log('[PDF] Web環境での処理を開始');
      try {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `${filename}.html`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('[PDF] Web環境でのダウンロード成功');
          return;
        }
      } catch (webError) {
        console.error('[PDF] Web environment error:', webError);
        Alert.alert('エラー', 'PDFのダウンロードに失敗しました');
        throw webError;
      }
    }

    // React Native環境での処理（iOS/Android）
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      console.log('[PDF] React Native環境での処理を開始');
      try {
        // 動的インポート
        const FileSystemModule = await import('expo-file-system');
        const SharingModule = await import('expo-sharing');

        const FileSystem = FileSystemModule.default || FileSystemModule;
        const Sharing = SharingModule.default || SharingModule;

        console.log('[PDF] モジュール読み込み成功');

        // キャッシュディレクトリを取得
        const cacheDir = (FileSystem as any).cacheDirectory;
        if (!cacheDir) {
          throw new Error('キャッシュディレクトリが取得できません');
        }

        const fileUri = `${cacheDir}${filename}.html`;
        console.log('[PDF] ファイルパス:', fileUri);

        // HTMLファイルを保存
        const writeAsync = (FileSystem as any).writeAsStringAsync;
        await writeAsync(fileUri, html, {
          encoding: 'utf8',
        });
        console.log('[PDF] ファイル保存成功');

        // Share APIを使用してファイルを共有
        const isAvailable = await (Sharing as any).isAvailableAsync();
        console.log('[PDF] Share API利用可能:', isAvailable);

        if (isAvailable) {
          await (Sharing as any).shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'PDFを共有',
          });
          console.log('[PDF] Share API実行成功');
        } else {
          Alert.alert(
            '共有できません',
            'このデバイスでは共有機能が利用できません。ファイルは以下に保存されました:\n' + fileUri
          );
        }
      } catch (nativeError) {
        console.error('[PDF] React Native error:', nativeError);
        const errorMessage = nativeError instanceof Error ? nativeError.message : '不明なエラー';
        Alert.alert('エラー', 'PDFの生成に失敗しました: ' + errorMessage);
        throw nativeError;
      }
    }

    // その他のプラットフォーム
    console.warn('[PDF] サポートされていないプラットフォーム:', Platform.OS);
    Alert.alert('エラー', 'このプラットフォームではPDF出力がサポートされていません');
  } catch (error) {
    console.error('[PDF] Failed to generate PDF:', error);
    throw error;
  }
}

export function getPDFFilename(startDate: Date): string {
  const dateStr = startDate.toISOString().split('T')[0];
  return `hygiene_observation_form_${dateStr}`;
}
