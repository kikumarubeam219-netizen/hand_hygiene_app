import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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

interface HygieneRecord {
  timestamp: number;
  timing: number;
  action: string;
  notes?: string;
}

const TIMINGS = {
  1: { name: '患者接触前', description: '患者に接触する前' },
  2: { name: '清潔/無菌操作前', description: '清潔/無菌操作の前' },
  3: { name: '体液曝露後', description: '体液曝露の可能性のある場合' },
  4: { name: '患者接触後', description: '患者に接触した後' },
  5: { name: '患者周辺物品接触後', description: '患者周辺物品に接触した後' },
};

/**
 * PDFバッファを生成
 */
export async function generatePDFBuffer(
  facilityInfo: FacilityInfo,
  records: HygieneRecord[]
): Promise<Buffer> {
  try {
    console.log('[PDF] Starting PDF generation');

    // PDFドキュメントを作成
    const pdfDoc = await PDFDocument.create();

    // ページを追加
    const page = pdfDoc.addPage([595, 842]); // A4サイズ
    const { width, height } = page.getSize();

    // テキストを描画
    drawHeader(page, width, height, facilityInfo);
    drawObservationTable(page, width, height, records);
    drawFooter(page, width, height);

    // PDFをバッファに変換
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    console.log('[PDF] PDF generation completed, size:', buffer.length);
    return buffer;
  } catch (error) {
    console.error('[PDF] PDF generation error:', error);
    throw error;
  }
}

/**
 * ヘッダーを描画
 */
function drawHeader(
  page: PDFPage,
  width: number,
  height: number,
  facilityInfo: FacilityInfo
): void {
  const margin = 20;
  const fontSize = 12;
  const smallFontSize = 10;

  // タイトル
  page.drawText('泉州感染防止ネットワーク手指衛生直接観察用フォーム', {
    x: margin,
    y: height - margin - 20,
    size: fontSize,
    color: rgb(0, 0, 0),
  });

  // 小タイトル
  page.drawText('観察フォーム', {
    x: margin,
    y: height - margin - 40,
    size: smallFontSize,
    color: rgb(0, 0, 0),
  });

  // ヘッダー情報
  let yPos = height - margin - 60;
  const fieldHeight = 15;

  const fields = [
    { label: '施設名:', value: facilityInfo.facilityName },
    { label: '部局:', value: facilityInfo.department },
    { label: '病棟:', value: facilityInfo.ward },
    { label: '科:', value: facilityInfo.section },
    { label: '期間番号:', value: facilityInfo.periodNumber },
    { label: '日付:', value: facilityInfo.date },
    { label: 'セッション番号:', value: facilityInfo.sessionNumber },
    { label: '観察者:', value: facilityInfo.observer },
    { label: 'ページ№:', value: facilityInfo.pageNumber },
    { label: '住所:', value: facilityInfo.address },
  ];

  const colWidth = width / 2;

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = margin + col * colWidth;
    const y = yPos - row * fieldHeight;

    // ラベル
    page.drawText(field.label, {
      x,
      y,
      size: smallFontSize,
      color: rgb(0, 0, 0),
    });

    // 値
    page.drawText(field.value, {
      x: x + 70,
      y,
      size: smallFontSize,
      color: rgb(0, 0, 0),
    });

    // 下線
    page.drawLine({
      start: { x: x + 70, y: y - 2 },
      end: { x: x + colWidth - 10, y: y - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }
}

/**
 * 観察テーブルを描画
 */
function drawObservationTable(
  page: PDFPage,
  width: number,
  height: number,
  records: HygieneRecord[]
): void {
  const margin = 20;
  const tableTop = height - 200;
  const tableWidth = width - 2 * margin;
  const colWidth = tableWidth / 4;
  const rowHeight = 20;

  let yPos = tableTop;

  // テーブルヘッダー
  const headers = ['機会', '適応', '手指衛生', '機会'];
  const headerBgColor = rgb(0.93, 0.84, 0.75); // ベージュ色

  // ヘッダー背景
  page.drawRectangle({
    x: margin,
    y: yPos - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: headerBgColor,
  });

  // ヘッダーテキスト
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: margin + i * colWidth + 5,
      y: yPos - rowHeight + 5,
      size: 9,
      color: rgb(0, 0, 0),
    });
  }

  yPos -= rowHeight;

  // 記録データを日付別にグループ化
  const recordsByDate: Record<string, HygieneRecord[]> = {};
  records.forEach((record) => {
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

  // セッション番号（最大8）
  let sessionNum = 0;
  for (const dateKey of Object.keys(recordsByDate).sort().slice(0, 8)) {
    sessionNum++;
    const sessionRecords = recordsByDate[dateKey];

    // 5つのタイミングの行を描画
    for (let timing = 1; timing <= 5; timing++) {
      const timingRecords = sessionRecords.filter((r: HygieneRecord) => r.timing === timing);
      const timingInfo = TIMINGS[timing as keyof typeof TIMINGS];

      // 行背景（薄いピンク）
      page.drawRectangle({
        x: margin,
        y: yPos - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(1.0, 0.96, 0.94),
      });

      // セッション番号とタイミング
      const timingText = `${sessionNum}. ${timingInfo.name}`;
      page.drawText(timingText, {
        x: margin + 5,
        y: yPos - rowHeight + 5,
        size: 8,
        color: rgb(0, 0, 0),
      });

      // 適応状況
      const applicable = timingRecords.length > 0 ? '☑' : '☐';
      page.drawText(applicable, {
        x: margin + colWidth + 5,
        y: yPos - rowHeight + 5,
        size: 8,
        color: rgb(0, 0, 0),
      });

      // 手指衛生実施内容
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

      if (actions.length === 0) {
        actions.push('☐手指消毒 ☐手洗い ☐実施なし');
      }

      const actionText = actions.join(' ');
      page.drawText(actionText, {
        x: margin + 2 * colWidth + 5,
        y: yPos - rowHeight + 5,
        size: 8,
        color: rgb(0, 0, 0),
      });

      // 罫線
      page.drawRectangle({
        x: margin,
        y: yPos - rowHeight,
        width: tableWidth,
        height: rowHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });

      yPos -= rowHeight;
    }
  }
}

/**
 * フッターを描画
 */
function drawFooter(page: PDFPage, width: number, height: number): void {
  const margin = 20;
  const footerText = 'WHO観察フォーム一部変換';

  page.drawText(footerText, {
    x: width - margin - 80,
    y: margin,
    size: 8,
    color: rgb(0, 0, 0),
  });
}
