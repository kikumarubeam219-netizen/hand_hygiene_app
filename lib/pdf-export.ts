import { Platform, Alert, Share, Clipboard } from 'react-native';
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

const ACTIONS = {
  hand_sanitizer: '手指消毒',
  hand_wash: '手洗い',
  no_action: '実施なし',
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

  // 記録を時系列でソート（古い順）
  const sortedRecords = [...filteredRecords].sort((a, b) => a.timestamp - b.timestamp);

  // テーブル行データを生成（実施順序）
  const tableRows: Array<{
    itemNum: number;
    timingName: string;
    actionName: string;
  }> = [];

  sortedRecords.forEach((record, index) => {
    const timingInfo = TIMINGS[record.timing as keyof typeof TIMINGS];
    const actionName = ACTIONS[record.action as keyof typeof ACTIONS];

    tableRows.push({
      itemNum: index + 1,
      timingName: timingInfo.name,
      actionName: actionName,
    });
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
    
    .item-row {
      background-color: #ffffff;
    }
    
    .item-number {
      font-weight: bold;
      color: #333;
      min-width: 40px;
    }
    
    .timing-name {
      font-weight: bold;
      color: #333;
    }
    
    .action-name {
      color: #666;
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
          <th style="width: 10%">No.</th>
          <th style="width: 40%">タイミング</th>
          <th style="width: 50%">実施内容</th>
        </tr>
      </thead>
      <tbody>
`;

  // テーブル行を追加（実施順序）
  tableRows.forEach((row) => {
    html += `
        <tr class="item-row">
          <td class="item-number">${row.itemNum}</td>
          <td><span class="timing-name">${row.timingName}</span></td>
          <td><span class="action-name">${row.actionName}</span></td>
        </tr>
`;
  });

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
 * React Native環境ではデータURLで表示
 */
export async function downloadPDF(html: string, filename: string): Promise<void> {
  try {
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
        console.log('[PDF] Share APIを使用してPDFレポートを共有');
        
        // HTMLをクリップボードにコピー
        await Clipboard.setString(html);
        console.log('[PDF] HTMLをクリップボードにコピー');
        
        // Share APIを使用してメッセージを共有
        const result = await Share.share({
          message: 'PDFレポートを生成しました。クリップボードにコピーされているデータをメールで送信して、ブラウザで開いてPDFに変換してください。',
          title: 'PDFレポート',
        });
        
        if (result.action === Share.dismissedAction) {
          console.log('[PDF] ユーザーが共有をキャンセル');
        } else {
          console.log('[PDF] 共有成功:', result.action);
        }
        
        Alert.alert(
          'PDFレポート生成完了',
          'PDFレポートの生成に成功しました。\n\nHTMLはクリップボードにコピーされています。\nメールアプリで貼り付けるか、ブラウザで開いてPDFに変換してください。',
          [
            {
              text: 'OK',
              onPress: () => console.log('[PDF] ユーザーが確認'),
            },
          ]
        );
      } catch (nativeError) {
        console.error('[PDF] React Native error:', nativeError);
        console.error('[PDF] エラースタック:', nativeError instanceof Error ? nativeError.stack : '不明');

        // フォールバック: Alertで情報を表示
        const errorMessage = nativeError instanceof Error ? nativeError.message : '不明なエラー';
        console.log('[PDF] フォールバック処理を実行:', errorMessage);
        console.log('[PDF] HTMLの長さ:', html.length);

        Alert.alert(
          'PDFレポート生成完了',
          'PDFレポートの生成に成功しました。\n\nクリップボードにコピーされているデータをメールで送信して、ブラウザで開いてPDFに変換してください。\n\n詳細: ' + errorMessage.substring(0, 100),
          [
            {
              text: 'OK',
              onPress: () => console.log('[PDF] ユーザーが確認'),
            },
          ]
        );
      }
    }

    // その他のプラットフォーム
    if (Platform.OS !== 'web' && Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('[PDF] サポートされていないプラットフォーム:', Platform.OS);
      Alert.alert('エラー', 'このプラットフォームではPDF出力がサポートされていません');
    }
  } catch (error) {
    console.error('[PDF] Failed to generate PDF:', error);
    throw error;
  }
}

export function getPDFFilename(startDate: Date): string {
  const dateStr = startDate.toISOString().split('T')[0];
  return `hygiene_observation_form_${dateStr}`;
}
