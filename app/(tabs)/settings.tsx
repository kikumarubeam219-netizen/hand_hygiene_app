import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateObservationFormHTML } from '@/lib/pdf-export';

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

      const today = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

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

      // ブラウザ環境でのPDF表示
      try {
        const printWindow = window.open('', '', 'width=900,height=700');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          // 少し遅延させてから印刷ダイアログを表示
          setTimeout(() => {
            printWindow.print();
          }, 500);
          
          Alert.alert('成功', 'PDFを生成しました。ブラウザで表示されます。\n印刷ダイアログからPDFとして保存できます。');
        } else {
          Alert.alert('エラー', 'ブラウザウィンドウを開けませんでした。ポップアップをブロックしていないか確認してください。');
        }
      } catch (windowError) {
        console.error('Window open error:', windowError);
        Alert.alert('エラー', 'ブラウザウィンドウの作成に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('エラー', 'PDFの生成に失敗しました');
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
              保存
            </ThemedText>
          </Pressable>
        </View>

        {/* PDF出力 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            観察フォーム出力
          </ThemedText>

          <Pressable
            onPress={handleGeneratePDF}
            style={[
              styles.button,
              styles.pdfButton,
              { backgroundColor: '#FF6B6B' },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              本日のPDFを生成
            </ThemedText>
          </Pressable>

          <ThemedText type="default" style={styles.helpText}>
            本日の記録を観察フォーム形式でPDFに変換します。ブラウザで表示されたら、印刷またはPDFとして保存できます。
          </ThemedText>
        </View>

        {/* 統計情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            統計情報
          </ThemedText>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <ThemedText type="default">総記録数</ThemedText>
              <ThemedText type="defaultSemiBold">{records.length}件</ThemedText>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">本日の記録数</ThemedText>
              <ThemedText type="defaultSemiBold">
                {
                  records.filter((r) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return r.timestamp >= today.getTime() && r.timestamp < tomorrow.getTime();
                  }).length
                }
                件
              </ThemedText>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">最終記録日時</ThemedText>
              <ThemedText type="defaultSemiBold">
                {records.length > 0
                  ? new Date(Math.max(...records.map((r) => r.timestamp))).toLocaleString(
                      'ja-JP'
                    )
                  : 'なし'}
              </ThemedText>
            </View>
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
              { borderColor: colors.error },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: colors.error }}>
              すべてのデータをリセット
            </ThemedText>
          </Pressable>

          <ThemedText type="default" style={styles.warningText}>
            この操作は取り消せません。すべての記録データが削除されます。
          </ThemedText>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            アプリ情報
          </ThemedText>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <ThemedText type="default">アプリ名</ThemedText>
              <ThemedText type="defaultSemiBold">Hand Hygiene Tracker</ThemedText>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">バージョン</ThemedText>
              <ThemedText type="defaultSemiBold">1.0.0</ThemedText>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">参考資料</ThemedText>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 12 }}>
                WHO Hand Hygiene
              </ThemedText>
            </View>
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
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  pdfButton: {
    backgroundColor: '#FF6B6B',
  },
  resetButton: {
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
