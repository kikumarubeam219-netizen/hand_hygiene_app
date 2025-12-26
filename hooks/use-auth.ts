import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, onAuthStateChanged } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface TeamInfo {
  teamId: string | null;
  teamName: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    teamId: null,
    teamName: null,
  });

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ユーザーのチーム情報を取得
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.teamId) {
              const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
              if (teamDoc.exists()) {
                setTeamInfo({
                  teamId: userData.teamId,
                  teamName: teamDoc.data().name,
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to get user info:', error);
        }
      } else {
        setTeamInfo({ teamId: null, teamName: null });
      }
      setAuthState({ user, loading: false, error: null });
    });

    return () => unsubscribe();
  }, []);

  // ログイン
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let message = 'ログインに失敗しました';
      if (error.code === 'auth/user-not-found') {
        message = 'ユーザーが見つかりません';
      } else if (error.code === 'auth/wrong-password') {
        message = 'パスワードが間違っています';
      } else if (error.code === 'auth/invalid-email') {
        message = 'メールアドレスの形式が正しくありません';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'メールアドレスまたはパスワードが間違っています';
      }
      setAuthState((prev) => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // 新規登録
  const signup = useCallback(async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        createdAt: serverTimestamp(),
        teamId: null,
      });
    } catch (error: any) {
      let message = '登録に失敗しました';
      if (error.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスは既に使用されています';
      } else if (error.code === 'auth/weak-password') {
        message = 'パスワードは6文字以上で入力してください';
      } else if (error.code === 'auth/invalid-email') {
        message = 'メールアドレスの形式が正しくありません';
      }
      setAuthState((prev) => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, []);

  // パスワードリセット
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let message = 'パスワードリセットに失敗しました';
      if (error.code === 'auth/user-not-found') {
        message = 'このメールアドレスは登録されていません';
      }
      throw new Error(message);
    }
  }, []);

  // 認証済みかどうか
  const isAuthenticated = authState.user !== null;

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated,
    teamInfo,
    login,
    signup,
    logout,
    resetPassword,
  };
}
