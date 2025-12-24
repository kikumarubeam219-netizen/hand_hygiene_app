import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { HygieneRecord, TimingType, ActionType } from '@/lib/types';

const STORAGE_KEY = 'hygiene_records';
const USER_INFO_KEY = 'user_info';

export interface UserInfo {
  userName?: string;
  facilityName?: string;
}

export function useHygieneStorage() {
  const [records, setRecords] = useState<HygieneRecord[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);

  // ローカルストレージから記録を読み込む
  const loadRecords = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setRecords(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  }, []);

  // ローカルストレージからユーザー情報を読み込む
  const loadUserInfo = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(USER_INFO_KEY);
      if (data) {
        setUserInfo(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }, []);

  // 初期化時にデータを読み込む
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadRecords(), loadUserInfo()]);
      setLoading(false);
    };
    init();
  }, [loadRecords, loadUserInfo]);

  // 新しい記録を追加
  const addRecord = useCallback(
    async (timing: TimingType, action: ActionType, notes?: string) => {
      try {
        const newRecord: HygieneRecord = {
          id: Date.now().toString(),
          timing,
          action,
          timestamp: Date.now(),
          notes,
          userName: userInfo.userName,
          facilityName: userInfo.facilityName,
        };

        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        return newRecord;
      } catch (error) {
        console.error('Failed to add record:', error);
        throw error;
      }
    },
    [records, userInfo]
  );

  // 記録を削除
  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        const updatedRecords = records.filter((r) => r.id !== id);
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      } catch (error) {
        console.error('Failed to delete record:', error);
        throw error;
      }
    },
    [records]
  );

  // 記録を更新
  const updateRecord = useCallback(
    async (id: string, updates: Partial<HygieneRecord>) => {
      try {
        const updatedRecords = records.map((r) => (r.id === id ? { ...r, ...updates } : r));
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      } catch (error) {
        console.error('Failed to update record:', error);
        throw error;
      }
    },
    [records]
  );

  // ユーザー情報を保存
  const saveUserInfo = useCallback(async (info: UserInfo) => {
    try {
      setUserInfo(info);
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      console.error('Failed to save user info:', error);
      throw error;
    }
  }, []);

  // すべてのデータをリセット
  const resetAllData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, USER_INFO_KEY]);
      setRecords([]);
      setUserInfo({});
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  }, []);

  // 日付範囲内の記録を取得
  const getRecordsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      return records.filter((r) => r.timestamp >= startTime && r.timestamp <= endTime);
    },
    [records]
  );

  // タイミング別の記録を取得
  const getRecordsByTiming = useCallback(
    (timing: TimingType) => {
      return records.filter((r) => r.timing === timing);
    },
    [records]
  );

  // 統計情報を計算
  const getStatistics = useCallback(
    (startDate: Date, endDate: Date) => {
      const rangeRecords = getRecordsByDateRange(startDate, endDate);
      const stats = {
        total: rangeRecords.length,
        byTiming: {} as Record<TimingType, number>,
        byAction: {} as Record<ActionType, number>,
        completionRate: 0,
      };

      // タイミング別集計
      for (let i = 1; i <= 5; i++) {
        const timing = i as TimingType;
        stats.byTiming[timing] = rangeRecords.filter((r) => r.timing === timing).length;
      }

      // アクション別集計
      stats.byAction.hand_sanitizer = rangeRecords.filter(
        (r) => r.action === 'hand_sanitizer'
      ).length;
      stats.byAction.hand_wash = rangeRecords.filter((r) => r.action === 'hand_wash').length;
      stats.byAction.no_action = rangeRecords.filter((r) => r.action === 'no_action').length;

      return stats;
    },
    [getRecordsByDateRange]
  );

  return {
    records,
    userInfo,
    loading,
    addRecord,
    deleteRecord,
    updateRecord,
    saveUserInfo,
    resetAllData,
    getRecordsByDateRange,
    getRecordsByTiming,
    getStatistics,
  };
}
