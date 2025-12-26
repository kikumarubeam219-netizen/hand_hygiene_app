import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { HygieneRecord, TimingType, ActionType } from '@/lib/types';

const STORAGE_KEY = 'hygiene_records';
const USER_INFO_KEY = 'user_info';

export interface UserInfo {
  userName?: string;
  facilityName?: string;
  department?: string;
  ward?: string;
  section?: string;
  observer?: string;
  address?: string;
  teamId?: string;
}

export function useHygieneStorage() {
  const [records, setRecords] = useState<HygieneRecord[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);

  // 現在のユーザーを取得
  const currentUser = auth.currentUser;

  // Firestoreから記録をリアルタイムで取得
  useEffect(() => {
    if (!currentUser) {
      // 未ログイン時はローカルストレージを使用
      const loadLocalRecords = async () => {
        try {
          const data = await AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            setRecords(JSON.parse(data));
          }
        } catch (error) {
          console.error('Failed to load local records:', error);
        } finally {
          setLoading(false);
        }
      };
      loadLocalRecords();
      return;
    }

    // ユーザー情報を取得してチームIDを確認
    const loadUserAndRecords = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        let teamId = currentUser.uid; // デフォルトは自分のUID

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.teamId) {
            teamId = userData.teamId;
          }
          // ユーザー情報を設定
          setUserInfo({
            userName: userData.userName || currentUser.email?.split('@')[0],
            facilityName: userData.facilityName,
            department: userData.department,
            ward: userData.ward,
            section: userData.section,
            observer: userData.observer,
            address: userData.address,
            teamId: userData.teamId,
          });
        }

        // チームの記録をリアルタイムで監視（orderByは複合インデックスが必要なので削除）
        const recordsQuery = query(
          collection(db, 'records'),
          where('teamId', '==', teamId)
        );

        const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
          const recordsList: HygieneRecord[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            recordsList.push({
              id: doc.id,
              timing: data.timing,
              action: data.action,
              timestamp: data.timestamp instanceof Timestamp
                ? data.timestamp.toMillis()
                : data.timestamp,
              notes: data.notes,
              userName: data.userName,
              facilityName: data.facilityName,
            });
          });
          // クライアント側でソート（新しい順）
          recordsList.sort((a, b) => b.timestamp - a.timestamp);
          setRecords(recordsList);
          setLoading(false);
        }, (error) => {
          console.error('Failed to load records from Firestore:', error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to load user data:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = loadUserAndRecords();

    return () => {
      unsubscribePromise?.then((unsub) => unsub?.());
    };
  }, [currentUser]);

  // 新しい記録を追加
  const addRecord = useCallback(
    async (timing: TimingType, action: ActionType, notes?: string, customDate?: Date) => {
      const timestamp = customDate ? customDate.getTime() : Date.now();

      if (!currentUser) {
        // 未ログイン時はローカルストレージに保存
        const newRecord: HygieneRecord = {
          id: Date.now().toString(),
          timing,
          action,
          timestamp,
          notes,
          userName: userInfo.userName,
          facilityName: userInfo.facilityName,
        };
        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        return newRecord;
      }

      // ログイン時はFirestoreに保存
      try {
        // チームIDを取得
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        let teamId = currentUser.uid;
        if (userDoc.exists() && userDoc.data().teamId) {
          teamId = userDoc.data().teamId;
        }

        const docRef = await addDoc(collection(db, 'records'), {
          teamId,
          userId: currentUser.uid,
          timing,
          action,
          timestamp: Timestamp.fromMillis(timestamp),
          notes: notes || null,
          userName: userInfo.userName || currentUser.email?.split('@')[0],
          facilityName: userInfo.facilityName || null,
          createdAt: serverTimestamp(),
        });

        return {
          id: docRef.id,
          timing,
          action,
          timestamp,
          notes,
          userName: userInfo.userName,
          facilityName: userInfo.facilityName,
        } as HygieneRecord;
      } catch (error) {
        console.error('Failed to add record to Firestore:', error);
        throw error;
      }
    },
    [currentUser, records, userInfo]
  );

  // 記録を削除
  const deleteRecord = useCallback(
    async (id: string) => {
      if (!currentUser) {
        // 未ログイン時はローカルストレージから削除
        setRecords((prevRecords) => {
          const updatedRecords = prevRecords.filter((r) => r.id !== id);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords)).catch((error) => {
            console.error('Failed to save after delete:', error);
          });
          return updatedRecords;
        });
        return;
      }

      // ログイン時はFirestoreから削除
      try {
        await deleteDoc(doc(db, 'records', id));
      } catch (error) {
        console.error('Failed to delete record from Firestore:', error);
        throw error;
      }
    },
    [currentUser]
  );

  // 記録を更新
  const updateRecord = useCallback(
    async (id: string, updates: Partial<HygieneRecord>) => {
      if (!currentUser) {
        // 未ログイン時はローカルストレージを更新
        const updatedRecords = records.map((r) => (r.id === id ? { ...r, ...updates } : r));
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        return;
      }

      // ログイン時はFirestoreを更新
      try {
        await updateDoc(doc(db, 'records', id), updates);
      } catch (error) {
        console.error('Failed to update record in Firestore:', error);
        throw error;
      }
    },
    [currentUser, records]
  );

  // ユーザー情報を保存
  const saveUserInfo = useCallback(async (info: UserInfo) => {
    setUserInfo(info);

    if (!currentUser) {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
      return;
    }

    // Firestoreにも保存
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        userName: info.userName || null,
        facilityName: info.facilityName || null,
        department: info.department || null,
        ward: info.ward || null,
        section: info.section || null,
        observer: info.observer || null,
        address: info.address || null,
      });
    } catch (error) {
      console.error('Failed to save user info to Firestore:', error);
      // ローカルにも保存
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
    }
  }, [currentUser]);

  // チームを作成
  const createTeam = useCallback(async (teamName: string) => {
    if (!currentUser) {
      throw new Error('ログインが必要です');
    }

    try {
      // チームを作成
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: teamName,
        ownerId: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      // ユーザーにチームIDを設定
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId: teamRef.id,
      });

      setUserInfo((prev) => ({ ...prev, teamId: teamRef.id }));
      return teamRef.id;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }, [currentUser]);

  // チームに参加
  const joinTeam = useCallback(async (teamId: string) => {
    if (!currentUser) {
      throw new Error('ログインが必要です');
    }

    try {
      // チームが存在するか確認
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (!teamDoc.exists()) {
        throw new Error('チームが見つかりません');
      }

      // チームにメンバーを追加
      const teamData = teamDoc.data();
      const members = teamData.members || [];
      if (!members.includes(currentUser.uid)) {
        members.push(currentUser.uid);
        await updateDoc(doc(db, 'teams', teamId), { members });
      }

      // ユーザーにチームIDを設定
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId: teamId,
      });

      setUserInfo((prev) => ({ ...prev, teamId }));
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  }, [currentUser]);

  // チームから離脱
  const leaveTeam = useCallback(async () => {
    if (!currentUser || !userInfo.teamId) {
      return;
    }

    try {
      // ユーザーからチームIDを削除
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId: null,
      });

      setUserInfo((prev) => ({ ...prev, teamId: undefined }));
    } catch (error) {
      console.error('Failed to leave team:', error);
      throw error;
    }
  }, [currentUser, userInfo.teamId]);

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
    createTeam,
    joinTeam,
    leaveTeam,
  };
}
