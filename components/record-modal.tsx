import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { TimingType, TIMING_INFO, ActionType, ACTION_LABELS } from '@/lib/types';
import { TimingColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface RecordModalProps {
  visible: boolean;
  timing: TimingType | null;
  onClose: () => void;
  onSave: (action: ActionType, notes?: string) => Promise<void>;
}

export function RecordModal({ visible, timing, onClose, onSave }: RecordModalProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!timing) return null;

  const info = TIMING_INFO[timing];
  const color = Object.values(TimingColors)[timing - 1];

  const handleSave = async () => {
    if (!selectedAction) return;

    try {
      setLoading(true);
      await onSave(selectedAction, notes);
      setSelectedAction(null);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
        <View style={[styles.header, { borderBottomColor: color }]}>
          <View style={[styles.headerBadge, { backgroundColor: color }]}>
            <ThemedText type="defaultSemiBold" style={{ color: '#fff', fontSize: 20 }}>
              {timing}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={{ fontSize: 24 }}>
              {info.name}
            </ThemedText>
            <ThemedText type="default" style={{ opacity: 0.7, marginTop: 4 }}>
              {info.reason}
            </ThemedText>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
              ✕
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 説明 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              状況
            </ThemedText>
            <ThemedText type="default" style={styles.description}>
              {info.description}
            </ThemedText>
          </View>

          {/* 例 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              例
            </ThemedText>
            {info.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <ThemedText type="default" style={styles.bullet}>
                  •
                </ThemedText>
                <ThemedText type="default" style={styles.exampleText}>
                  {example}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* アクション選択 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              実施内容を選択
            </ThemedText>
            {(['hand_sanitizer', 'hand_wash', 'no_action'] as ActionType[]).map((action) => (
              <Pressable
                key={action}
                onPress={() => setSelectedAction(action)}
                style={[
                  styles.actionButton,
                  selectedAction === action && [
                    styles.actionButtonSelected,
                    { backgroundColor: `${color}30`, borderColor: color },
                  ],
                ]}
              >
                <View
                  style={[
                    styles.radioButton,
                    selectedAction === action && { backgroundColor: color },
                  ]}
                />
                <ThemedText type="default">{ACTION_LABELS[action]}</ThemedText>
              </Pressable>
            ))}
          </View>

          {/* 備考 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              備考（オプション）
            </ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="備考を入力"
              placeholderTextColor={colors.text + '80'}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* 時刻表示 */}
          <View style={styles.section}>
            <ThemedText type="default" style={{ opacity: 0.6, fontSize: 12 }}>
              記録時刻: {new Date().toLocaleString('ja-JP')}
            </ThemedText>
          </View>
        </ScrollView>

        {/* ボタン */}
        <View style={styles.footer}>
          <Pressable
            onPress={onClose}
            style={[styles.button, styles.cancelButton]}
            disabled={loading}
          >
            <ThemedText type="defaultSemiBold">キャンセル</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!selectedAction || loading}
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: color },
              (!selectedAction || loading) && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
                保存
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: 12,
    marginBottom: 16,
    gap: 12,
  },
  headerBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
  },
  description: {
    lineHeight: 22,
    opacity: 0.8,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    opacity: 0.6,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    gap: 12,
  },
  actionButtonSelected: {
    borderWidth: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
