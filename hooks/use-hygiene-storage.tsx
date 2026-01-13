import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface HygieneStorageContextType {
  records: HygieneRecord[];
  userInfo: UserInfo;
  loading: boolean;
  addRecord: (timing: TimingType, action: ActionType, notes?: string, customDate?: Date) => Promise<HygieneRecord>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, updates: Partial<HygieneRecord>) => Promise<void>;
  saveUserInfo: (info: UserInfo) => Promise<void>;
  resetAllData: () => Promise<void>;
  getRecordsByDateRange: (startDate: Date, endDate: Date) => HygieneRecord[];
  getRecordsByTiming: (timing: TimingType) => HygieneRecord[];
  getStatistics: (startDate: Date, endDate: Date) => {
    total: number;
    byTiming: Record<TimingType, number>;
    byAction: Record<ActionType, number>;
    completionRate: number;
  };
  createTeam: (teamName: string) => Promise<string>;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
}

const HygieneStorageContext = createContext<HygieneStorageContextType | null>(null);

export function HygieneStorageProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<HygieneRecord[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log('[Auth] State changed:', user ? user.email : 'null');
      setCurrentUser(user);
      setAuthInitialized(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authInitialized) {
      console.log('[Storage] Waiting for auth initialization...');
      return;
    }

    console.log('[Storage] Auth initialized, currentUser:', currentUser ? currentUser.email : 'null');

    if (!currentUser) {
      console.log('[Storage] No user, loading from local storage');
      const loadLocalRecords = async () => {
        try {
          const data = await AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            setRecords(JSON.parse(data));
          } else {
            setRecords([]);
          }
        } catch (error) {
          console.error('Failed to load local records:', error);
          setRecords([]);
        } finally {
          setLoading(false);
        }
      };
      loadLocalRecords();
      return;
    }

    let unsubscribeRecords: (() => void) | undefined;

    const loadUserAndRecords = async () => {
      console.log('[Storage] Loading user and records for:', currentUser.uid);
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        console.log('[Storage] User doc exists:', userDoc.exists());

        let teamId = currentUser.uid;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.teamId) {
            teamId = userData.teamId;
          }
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
        } else {
          setUserInfo({
            userName: currentUser.email?.split('@')[0],
            teamId: undefined,
          });
        }

        console.log('[Storage] Using teamId:', teamId);

        const recordsQuery = query(
          collection(db, 'records'),
          where('teamId', '==', teamId)
        );

        unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
          console.log('[Storage] Received snapshot with', snapshot.size, 'records');
          const recordsList: HygieneRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            recordsList.push({
              id: docSnap.id,
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
          recordsList.sort((a, b) => b.timestamp - a.timestamp);
          setRecords(recordsList);
          setLoading(false);
        }, (error) => {
          console.error('[Storage] Failed to load records from Firestore:', error);
          setRecords([]);
          setLoading(false);
        });
      } catch (error) {
        console.error('[Storage] Failed to load user data:', error);
        setRecords([]);
        setLoading(false);
      }
    };

    loadUserAndRecords();

    return () => {
      if (unsubscribeRecords) {
        unsubscribeRecords();
      }
    };
  }, [currentUser, authInitialized]);

  const addRecord = useCallback(
    async (timing: TimingType, action: ActionType, notes?: string, customDate?: Date) => {
      const timestamp = customDate ? customDate.getTime() : Date.now();

      if (!currentUser) {
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

      try {
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

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!currentUser) {
        setRecords((prevRecords) => {
          const updatedRecords = prevRecords.filter((r) => r.id !== id);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords)).catch((error) => {
            console.error('Failed to save after delete:', error);
          });
          return updatedRecords;
        });
        return;
      }

      try {
        await deleteDoc(doc(db, 'records', id));
      } catch (error) {
        console.error('Failed to delete record from Firestore:', error);
        throw error;
      }
    },
    [currentUser]
  );

  const updateRecord = useCallback(
    async (id: string, updates: Partial<HygieneRecord>) => {
      if (!currentUser) {
        const updatedRecords = records.map((r) => (r.id === id ? { ...r, ...updates } : r));
        setRecords(updatedRecords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        return;
      }

      try {
        await updateDoc(doc(db, 'records', id), updates);
      } catch (error) {
        console.error('Failed to update record in Firestore:', error);
        throw error;
      }
    },
    [currentUser, records]
  );

  const saveUserInfo = useCallback(async (info: UserInfo) => {
    setUserInfo(info);

    if (!currentUser) {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
      return;
    }

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
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
    }
  }, [currentUser]);

  const createTeam = useCallback(async (teamName: string) => {
    if (!currentUser) {
      throw new Error('Login required');
    }

    try {
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: teamName,
        ownerId: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

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

  const joinTeam = useCallback(async (teamId: string) => {
    if (!currentUser) {
      throw new Error('Login required');
    }

    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }

      const teamData = teamDoc.data();
      const members = teamData.members || [];
      if (!members.includes(currentUser.uid)) {
        members.push(currentUser.uid);
        await updateDoc(doc(db, 'teams', teamId), { members });
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId: teamId,
      });

      setUserInfo((prev) => ({ ...prev, teamId }));
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  }, [currentUser]);

  const leaveTeam = useCallback(async () => {
    if (!currentUser || !userInfo.teamId) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId: null,
      });

      setUserInfo((prev) => ({ ...prev, teamId: undefined }));
    } catch (error) {
      console.error('Failed to leave team:', error);
      throw error;
    }
  }, [currentUser, userInfo.teamId]);

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

  const getRecordsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      return records.filter((r) => r.timestamp >= startTime && r.timestamp <= endTime);
    },
    [records]
  );

  const getRecordsByTiming = useCallback(
    (timing: TimingType) => {
      return records.filter((r) => r.timing === timing);
    },
    [records]
  );

  const getStatistics = useCallback(
    (startDate: Date, endDate: Date) => {
      const rangeRecords = getRecordsByDateRange(startDate, endDate);
      const stats = {
        total: rangeRecords.length,
        byTiming: {} as Record<TimingType, number>,
        byAction: {} as Record<ActionType, number>,
        completionRate: 0,
      };

      for (let i = 1; i <= 5; i++) {
        const timing = i as TimingType;
        stats.byTiming[timing] = rangeRecords.filter((r) => r.timing === timing).length;
      }

      stats.byAction.hand_sanitizer = rangeRecords.filter(
        (r) => r.action === 'hand_sanitizer'
      ).length;
      stats.byAction.hand_wash = rangeRecords.filter((r) => r.action === 'hand_wash').length;
      stats.byAction.no_action = rangeRecords.filter((r) => r.action === 'no_action').length;

      return stats;
    },
    [getRecordsByDateRange]
  );

  const value: HygieneStorageContextType = {
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

  return (
    <HygieneStorageContext.Provider value={value}>
      {children}
    </HygieneStorageContext.Provider>
  );
}

export function useHygieneStorage() {
  const context = useContext(HygieneStorageContext);
  if (!context) {
    throw new Error('useHygieneStorage must be used within a HygieneStorageProvider');
  }
  return context;
}

