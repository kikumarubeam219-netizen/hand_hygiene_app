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

/**
 * バックエンドのPDF生成APIを呼び出す
 */
export async function generatePDFViaBackend(
  records: HygieneRecord[],
  facilityInfo: FacilityInfo,
  startDate: Date,
  endDate: Date
): Promise<Blob> {
  try {
    // 期間内の記録をフィルタリング
    const filteredRecords = records.filter(
      (r) => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime()
    );

    // tRPCクライアントを動的にインポート
    const { trpc } = await import('@/lib/trpc');

    const response = await (trpc.generatePDF as any).mutate({
      facilityInfo,
      records: filteredRecords.map((r) => ({
        timestamp: r.timestamp,
        timing: r.timing,
        action: r.action,
        notes: r.notes,
      })),
    });

    console.log('[PDF] PDF generated successfully, size:', response.size);

    // Base64データをBlobに変換
    const binaryString = atob(response.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    return blob;
  } catch (error) {
    console.error('[PDF] Backend PDF generation error:', error);
    throw error;
  }
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

/**
 * PDFをBlobからダウンロード
 */
export async function downloadPDFBlob(blob: Blob, filename: string): Promise<void> {
  try {
    console.log('[PDF] Platform.OS:', Platform.OS);

    // Web環境での処理
    if (Platform.OS === 'web') {
      console.log('[PDF] Web環境でのPDFダウンロードを開始');
      try {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `${filename}.pdf`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('[PDF] Web環境でのPDFダウンロード成功');
          return;
        }
      } catch (webError) {
        console.error('[PDF] Web environment error:', webError);
        Alert.alert('エラー', 'PDFのダウンロードに失敗しました');
        throw webError;
      }
    }

    // React Native環境での処理
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      console.log('[PDF] React Native環境でのPDFダウンロードを開始');
      try {
        const FileSystemModule = await import('expo-file-system');
        const SharingModule = await import('expo-sharing');

        const FileSystem = FileSystemModule.default || FileSystemModule;
        const Sharing = SharingModule.default || SharingModule;

        // BlobをArrayBufferに変換
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const base64String = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');

        const cacheDir = (FileSystem as any).cacheDirectory;
        const fileUri = `${cacheDir}${filename}.pdf`;

        // ファイルを保存
        const writeAsync = (FileSystem as any).writeAsStringAsync;
        await writeAsync(fileUri, base64String, {
          encoding: 'base64',
        });

        console.log('[PDF] ファイル保存成功:', fileUri);

        // Share APIを使用
        const isAvailable = await (Sharing as any).isAvailableAsync();
        if (isAvailable) {
          await (Sharing as any).shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'PDFを共有',
          });
        } else {
          Alert.alert('ファイル保存完了', 'PDFは以下に保存されました:\n' + fileUri);
        }
      } catch (nativeError) {
        console.error('[PDF] React Native error:', nativeError);
        const errorMessage = nativeError instanceof Error ? nativeError.message : '不明なエラー';
        Alert.alert('エラー', 'PDFの処理に失敗しました: ' + errorMessage);
        throw nativeError;
      }
    }
  } catch (error) {
    console.error('[PDF] Failed to download PDF:', error);
    throw error;
  }
}

export function getPDFFilename(startDate: Date): string {
  const dateStr = startDate.toISOString().split('T')[0];
  return `hygiene_observation_form_${dateStr}`;
}
