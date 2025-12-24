import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { userInfo, saveUserInfo, resetAllData, records } = useHygieneStorage();
  const [userName, setUserName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserName(userInfo.userName || '');
    setFacilityName(userInfo.facilityName || '');
  }, [userInfo]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveUserInfo({
        userName: userName || undefined,
        facilityName: facilityName || undefined,
      });
    } catch (error) {
      console.error('Failed to save user info:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
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
        {/* ユーザー情報 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ユーザー情報
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
