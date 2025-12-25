import { Platform, Alert } from 'react-native';
import { HygieneRecord, TIMING_INFO, TimingType } from './types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
      margin-bottom: 10px;
      color: #333;
    }
    
    .header p {
      font-size: 12px;
      color: #666;
    }
    
    .facility-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 100px;
    }
    
    .info-value {
      flex: 1;
      text-align: right;
      padding-right: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 13px;
    }
    
    th {
      background-color: #f0f0f0;
      border: 1px solid #999;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    
    td {
      border: 1px solid #999;
      padding: 10px;
      background-color: #ffffff;
    }
    
    tr:nth-child(even) td {
      background-color: #ffffff;
    }
    
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    
    .print-button {
      display: none;
    }
    
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>手指衛生直接観察用フォーム</h1>
      <p>WHO手指衛生5つのタイミング観察記録</p>
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
        <span class="info-label">観察者:</span>
        <span class="info-value">${facilityInfo.observer}</span>
      </div>
      <div class="info-item">
        <span class="info-label">住所:</span>
        <span class="info-value">${facilityInfo.address}</span>
      </div>
      <div class="info-item">
        <span class="info-label">観察日:</span>
        <span class="info-value">${facilityInfo.date}</span>
      </div>
      <div class="info-item">
        <span class="info-label">セッション:</span>
        <span class="info-value">${facilityInfo.sessionNumber}</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">No.</th>
          <th style="width: 40%;">タイミング</th>
          <th style="width: 50%;">実施内容</th>
        </tr>
      </thead>
      <tbody>
`;

  // テーブル行を追加
  tableRows.forEach((row) => {
    html += `
        <tr>
          <td style="text-align: center;">${row.itemNum}</td>
          <td>${row.timingName}</td>
          <td>${row.actionName}</td>
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
 * HTMLをPDFに変換してダウンロード
 * Web環境ではブラウザの印刷機能でPDF化
 * React Native環境ではHTMLをクリップボードにコピー
 */
export async function downloadPDF(html: string, filename: string): Promise<void> {
  try {
    console.log('[PDF] Platform.OS:', Platform.OS);

    // Web環境での処理（ブラウザ）
    if (Platform.OS === 'web') {
      console.log('[PDF] Web環境での処理を開始');
      try {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          // 新しいウィンドウでHTMLを開く
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();

            // 少し遅延してから印刷ダイアログを表示
            setTimeout(() => {
              newWindow.print();
              console.log('[PDF] 印刷ダイアログを表示');
            }, 250);

            console.log('[PDF] Web環境でのPDF生成成功');
          } else {
            throw new Error('ポップアップウィンドウを開くことができません');
          }
          return;
        }
      } catch (webError) {
        console.error('[PDF] Web environment error:', webError);
        Alert.alert('エラー', 'PDFの生成に失敗しました');
        throw webError;
      }
    }

    // React Native環境での処理（iOS/Android）
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      console.log('[PDF] React Native環境での処理を開始');
      try {
        // HTMLからPDFを生成
        console.log('[PDF] expo-printでPDFを生成中...');
        const { uri } = await Print.printToFileAsync({ html });
        console.log('[PDF] PDFファイル生成完了:', uri);

        // PDFを共有
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'PDFを共有',
            UTI: 'com.adobe.pdf',
          });
          console.log('[PDF] PDF共有ダイアログを表示');
        } else {
          Alert.alert('成功', `PDFが生成されました。\n保存先: ${uri}`);
        }
      } catch (nativeError) {
        console.error('[PDF] React Native error:', nativeError);
        const errorMessage = nativeError instanceof Error ? nativeError.message : '不明なエラー';
        Alert.alert('エラー', `PDFの生成に失敗しました。\n${errorMessage}`);
      }
    }

    // その他のプラットフォーム
    if (Platform.OS !== 'web' && Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('[PDF] サポートされていないプラットフォーム:', Platform.OS);
      Alert.alert('エラー', 'このプラットフォームではPDF出力がサポートされていません');
    }
  } catch (error) {
    console.error('[PDF] Unexpected error:', error);
    Alert.alert('エラー', 'PDFの生成中に予期しないエラーが発生しました');
  }
}
