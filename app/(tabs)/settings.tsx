import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateObservationFormHTML, downloadPDF } from '@/lib/pdf-export';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { userInfo, saveUserInfo, resetAllData, records } = useHygieneStorage();
  const [userName, setUserName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [department, setDepartment] = useState('');
  const [ward, setWard] = useState('');
  const [section, setSection] = useState('');
  const [observer, setObserver] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    setUserName(userInfo.userName || '');
    setFacilityName(userInfo.facilityName || '');
    setDepartment(userInfo.department || '');
    setWard(userInfo.ward || '');
    setSection(userInfo.section || '');
    setObserver(userInfo.observer || '');
    setAddress(userInfo.address || '');
  }, [userInfo]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveUserInfo({
        userName: userName || undefined,
        facilityName: facilityName || undefined,
        department: department || undefined,
        ward: ward || undefined,
        section: section || undefined,
        observer: observer || undefined,
        address: address || undefined,
      });
      Alert.alert('完了', '設定を保存しました');
    } catch (error) {
      console.error('Failed to save user info:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (!facilityName) {
        Alert.alert('エラー', '施設名を入力してください');
        return;
      }

      setIsGeneratingPDF(true);

      const today = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      // 観察フォーム形式HTMLを生成
      const html = generateObservationFormHTML(
        records,
        {
          facilityName,
          department,
          ward,
          section,
          periodNumber: '',
          date: today.toLocaleDateString('ja-JP'),
          sessionNumber: '',
          observer,
          pageNumber: '1',
          address,
        },
        startDate,
        endDate
      );

      // HTMLをダウンロード
      const filename = `手指衰理記録_${today.toISOString().split('T')[0]}`;
      await downloadPDF(html, filename);

      Alert.alert('成功', 'PDFを生成しました。ファイルを共有できます。');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      Alert.alert('エラー', 'PDFの生成に失敗しました: ' + errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'データをリセット',
      'すべての記録データを削除してもよろしいですか？この操作は取り消せません。',
      [
        { text: 'キャンセル', onPress: () => {}, style: 'cancel' },
        {
          text: 'リセット',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert('完了', 'すべてのデータがリセットされました');
            } catch (error) {
              console.error('Failed to reset data:', error);
              Alert.alert('エラー', 'データのリセットに失敗しました');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // 統計情報を計算
  const totalRecords = records.length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayRecords = records.filter(
    (r) => r.timestamp >= todayStart.getTime() && r.timestamp <= todayEnd.getTime()
  ).length;

  const lastRecord = records.length > 0 ? records[records.length - 1] : null;
  const lastRecordTime = lastRecord
    ? new Date(lastRecord.timestamp).toLocaleString('ja-JP')
    : '記録なし';

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: 28 }}>
          設定
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            基本情報
          </ThemedText>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              ユーザー名
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="ユーザー名を入力"
              placeholderTextColor={colors.text + '80'}
              value={userName}
              onChangeText={setUserName}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              施設名
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="施設名を入力"
              placeholderTextColor={colors.text + '80'}
              value={facilityName}
              onChangeText={setFacilityName}
            />
          </View>
        </View>

        {/* 観察フォーム情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            観察フォーム情報
          </ThemedText>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              部局
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="部局を入力"
              placeholderTextColor={colors.text + '80'}
              value={department}
              onChangeText={setDepartment}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              病棟
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="病棟を入力"
              placeholderTextColor={colors.text + '80'}
              value={ward}
              onChangeText={setWard}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              科
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="科を入力"
              placeholderTextColor={colors.text + '80'}
              value={section}
              onChangeText={setSection}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              観察者
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="観察者名を入力"
              placeholderTextColor={colors.text + '80'}
              value={observer}
              onChangeText={setObserver}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              住所
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="住所を入力"
              placeholderTextColor={colors.text + '80'}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: colors.tint },
              isSaving && styles.buttonDisabled,
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              {isSaving ? '保存中...' : '保存'}
            </ThemedText>
          </Pressable>
        </View>

        {/* PDF出力 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            PDF出力
          </ThemedText>

          <Pressable
            onPress={handleGeneratePDF}
            disabled={isGeneratingPDF}
            style={[
              styles.button,
              styles.pdfButton,
              { backgroundColor: '#FF6B6B' },
              isGeneratingPDF && styles.buttonDisabled,
            ]}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
                本日のPDFを生成
              </ThemedText>
            )}
          </Pressable>

          <ThemedText type="default" style={styles.helpText}>
            本日の観察フォームをPDF形式で生成します。泉州感染防止ネットワーク公式フォーム形式で出力されます。
          </ThemedText>
        </View>

        {/* 統計情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            統計情報
          </ThemedText>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="default" style={styles.statLabel}>
                総記録数
              </ThemedText>
              <ThemedText type="title" style={styles.statValue}>
                {totalRecords}
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <ThemedText type="default" style={styles.statLabel}>
                本日の記録数
              </ThemedText>
              <ThemedText type="title" style={styles.statValue}>
                {todayRecords}
              </ThemedText>
            </View>
          </View>

          <View style={styles.lastRecordContainer}>
            <ThemedText type="defaultSemiBold" style={styles.lastRecordLabel}>
              最終記録日時
            </ThemedText>
            <ThemedText type="default" style={styles.lastRecordValue}>
              {lastRecordTime}
            </ThemedText>
          </View>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            データ管理
          </ThemedText>

          <Pressable
            onPress={handleResetData}
            style={[
              styles.button,
              styles.resetButton,
              { backgroundColor: '#FF3B30' },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              すべてのデータをリセット
            </ThemedText>
          </Pressable>

          <ThemedText type="default" style={[styles.helpText, { color: '#FF3B30' }]}>
            ⚠️ この操作は取り消せません。すべての記録データが削除されます。
          </ThemedText>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            アプリ情報
          </ThemedText>

          <View style={styles.infoContainer}>
            <ThemedText type="default" style={styles.infoText}>
              手指衛生5つのタイミング記録アプリ
            </ThemedText>
            <ThemedText type="default" style={[styles.infoText, { fontSize: 12 }]}>
              バージョン 1.0.0
            </ThemedText>
            <ThemedText type="default" style={[styles.infoText, { fontSize: 12 }]}>
              WHO観察フォーム対応
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButton: {
    marginTop: 8,
  },
  pdfButton: {
    marginBottom: 8,
  },
  resetButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    marginTop: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
  },
  lastRecordContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  lastRecordLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastRecordValue: {
    fontSize: 12,
  },
  infoContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
