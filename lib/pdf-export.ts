import { HygieneRecord, TIMING_INFO, ACTION_LABELS, TimingType } from './types';

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

/**
 * 観察フォーム形式のHTML/PDFを生成
 * 泉州感染防止ネットワーク手指衛生直接観察用フォーム
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

  // 日付別にグループ化
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

  // セッション数を計算（最大8セッション）
  const sessions = Object.entries(recordsByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(0, 8);

  // HTMLを生成
  const html = `
<!DOCTYPE html>
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
      font-family: 'MS Pゴシック', 'Hiragino Sans', sans-serif;
      font-size: 10px;
      line-height: 1.2;
      color: #333;
      background: white;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      margin: 10mm auto;
      padding: 10mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
    }
    
    @media print {
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
    
    .title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .subtitle {
      text-align: center;
      font-size: 10px;
      margin-bottom: 8px;
    }
    
    .header-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 9px;
    }
    
    .header-item {
      border: 1px solid #999;
      padding: 4px;
      display: flex;
      align-items: center;
    }
    
    .header-label {
      font-weight: bold;
      min-width: 60px;
      margin-right: 4px;
    }
    
    .header-value {
      flex: 1;
      border-bottom: 1px solid #999;
      padding: 2px 4px;
      min-height: 16px;
    }
    
    .table-container {
      margin-bottom: 10px;
      border: 1px solid #999;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    
    th {
      background-color: #E8D4C0;
      border: 1px solid #999;
      padding: 4px;
      text-align: center;
      font-weight: bold;
    }
    
    td {
      border: 1px solid #999;
      padding: 4px;
      text-align: center;
    }
    
    .session-header {
      background-color: #E8D4C0;
      font-weight: bold;
    }
    
    .timing-row {
      background-color: #FFF5F0;
    }
    
    .checkbox {
      width: 14px;
      height: 14px;
      border: 1px solid #999;
      display: inline-block;
      margin: 0 2px;
    }
    
    .checkbox.checked::after {
      content: '✓';
      display: block;
      text-align: center;
      line-height: 14px;
      font-size: 10px;
    }
    
    .timing-label {
      text-align: left;
      font-size: 8px;
      line-height: 1.1;
    }
    
    .action-options {
      font-size: 8px;
      line-height: 1.1;
    }
    
    .footer {
      margin-top: 10px;
      text-align: right;
      font-size: 8px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="title">泉州感染防止ネットワーク手指衛生直接観察用フォーム</div>
    <div class="subtitle">観察フォーム</div>
    
    <!-- ヘッダー情報 -->
    <div class="header-section">
      <div class="header-item">
        <span class="header-label">施設名：</span>
        <span class="header-value">${escapeHtml(facilityInfo.facilityName)}</span>
      </div>
      <div class="header-item">
        <span class="header-label">期間番号：</span>
        <span class="header-value">${escapeHtml(facilityInfo.periodNumber)}</span>
      </div>
      <div class="header-item">
        <span class="header-label">セッション番号：</span>
        <span class="header-value">${escapeHtml(facilityInfo.sessionNumber)}</span>
      </div>
    </div>
    
    <div class="header-section">
      <div class="header-item">
        <span class="header-label">部局：</span>
        <span class="header-value">${escapeHtml(facilityInfo.department)}</span>
      </div>
      <div class="header-item">
        <span class="header-label">日付：</span>
        <span class="header-value">${facilityInfo.date}</span>
      </div>
      <div class="header-item">
        <span class="header-label">観察者：</span>
        <span class="header-value">${escapeHtml(facilityInfo.observer)}</span>
      </div>
    </div>
    
    <div class="header-section">
      <div class="header-item">
        <span class="header-label">病棟：</span>
        <span class="header-value">${escapeHtml(facilityInfo.ward)}</span>
      </div>
      <div class="header-item">
        <span class="header-label">開始/終了時間：</span>
        <span class="header-value"></span>
      </div>
      <div class="header-item">
        <span class="header-label">ページ№：</span>
        <span class="header-value">${escapeHtml(facilityInfo.pageNumber)}</span>
      </div>
    </div>
    
    <div class="header-section">
      <div class="header-item">
        <span class="header-label">科：</span>
        <span class="header-value">${escapeHtml(facilityInfo.section)}</span>
      </div>
      <div class="header-item">
        <span class="header-label">セッション時間：</span>
        <span class="header-value"></span>
      </div>
      <div class="header-item">
        <span class="header-label">住所：</span>
        <span class="header-value">${escapeHtml(facilityInfo.address)}</span>
      </div>
    </div>
    
    <!-- 観察テーブル -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th colspan="2">専門職種</th>
            <th colspan="2">専門職種</th>
            <th colspan="2">専門職種</th>
            <th colspan="2">専門職種</th>
          </tr>
          <tr>
            <th>コード</th>
            <th>人数</th>
            <th>コード</th>
            <th>人数</th>
            <th>コード</th>
            <th>人数</th>
            <th>コード</th>
            <th>人数</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows(sessions, recordsByDate)}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      WHO観察フォーム一部変換
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

function generateTableRows(
  sessions: Array<[string, HygieneRecord[]]>,
  recordsByDate: Record<string, HygieneRecord[]>
): string {
  let html = '';

  // 最大8セッション分のテーブル行を生成
  for (let sessionIdx = 0; sessionIdx < 8; sessionIdx++) {
    const [dateKey, records] = sessions[sessionIdx] || ['', []];

    // タイミング別に記録をグループ化
    const recordsByTiming: Record<TimingType, HygieneRecord[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    records.forEach((record) => {
      recordsByTiming[record.timing].push(record);
    });

    // 各タイミングの行を生成
    for (let timing = 1; timing <= 5; timing++) {
      const timingRecords = recordsByTiming[timing as TimingType];
      const timingInfo = TIMING_INFO[timing as TimingType];

      // 手指消毒の数
      const sanitizerCount = timingRecords.filter((r) => r.action === 'hand_sanitizer').length;
      // 手洗いの数
      const washCount = timingRecords.filter((r) => r.action === 'hand_wash').length;
      // 実施なしの数
      const noActionCount = timingRecords.filter((r) => r.action === 'no_action').length;

      html += `
        <tr class="timing-row">
          <td colspan="2">
            <div class="timing-label">
              <div>☐ ${timingInfo.name}</div>
              <div>☐ ${timingInfo.description}</div>
            </div>
          </td>
          <td>
            <div class="action-options">
              ${sanitizerCount > 0 ? '☑' : '☐'} 手指消毒<br>
              ${washCount > 0 ? '☑' : '☐'} 手洗い<br>
              ${noActionCount > 0 ? '☑' : '☐'} 実施なし
            </div>
          </td>
          <td>${sanitizerCount + washCount}</td>
          <td colspan="2">
            <div class="timing-label">
              <div>☐ ${timingInfo.name}</div>
              <div>☐ ${timingInfo.description}</div>
            </div>
          </td>
          <td>
            <div class="action-options">
              ${sanitizerCount > 0 ? '☑' : '☐'} 手指消毒<br>
              ${washCount > 0 ? '☑' : '☐'} 手洗い<br>
              ${noActionCount > 0 ? '☑' : '☐'} 実施なし
            </div>
          </td>
          <td>${sanitizerCount + washCount}</td>
        </tr>
      `;
    }
  }

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * HTMLをPDFに変換してダウンロード
 * React Native環境とWeb環境の両方に対応
 */
export async function downloadPDF(html: string, filename: string): Promise<void> {
  try {
    // Web環境での処理
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // 新しいウィンドウを開く
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // 少し遅延させてから印刷ダイアログを表示
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

export function getPDFFilename(startDate: Date): string {
  const dateStr = startDate.toISOString().split('T')[0];
  return `hygiene_observation_form_${dateStr}.pdf`;
}
