import React, { useState } from 'react';
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

type AuthMode = 'login' | 'signup' | 'reset';

export function AuthScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { login, signup, resetPassword, loading, error } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLocalError(null);
        setSuccessMessage(null);

        if (!email) {
            setLocalError('メールアドレスを入力してください');
            return;
        }

        if (mode === 'reset') {
            try {
                await resetPassword(email);
                setSuccessMessage('パスワードリセットメールを送信しました');
            } catch (err: any) {
                setLocalError(err.message);
            }
            return;
        }

        if (!password) {
            setLocalError('パスワードを入力してください');
            return;
        }

        if (mode === 'signup' && password !== confirmPassword) {
            setLocalError('パスワードが一致しません');
            return;
        }

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err: any) {
            setLocalError(err.message);
        }
    };

    const displayError = localError || error;

    return (
        <ThemedView
            style={[
                styles.container,
                {
                    paddingTop: Math.max(insets.top, 40),
                    paddingBottom: Math.max(insets.bottom, 20),
                    paddingLeft: Math.max(insets.left, 20),
                    paddingRight: Math.max(insets.right, 20),
                },
            ]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* ヘッダー */}
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>
                            手指衛生記録
                        </ThemedText>
                        <ThemedText type="default" style={styles.subtitle}>
                            5つのタイミングを記録
                        </ThemedText>
                    </View>

                    {/* フォーム */}
                    <View style={styles.form}>
                        <ThemedText type="subtitle" style={styles.formTitle}>
                            {mode === 'login' ? 'ログイン' : mode === 'signup' ? '新規登録' : 'パスワードリセット'}
                        </ThemedText>

                        <TextInput
                            style={[
                                styles.input,
                                { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                            ]}
                            placeholder="メールアドレス"
                            placeholderTextColor={colors.text + '80'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        {mode !== 'reset' && (
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                                ]}
                                placeholder="パスワード"
                                placeholderTextColor={colors.text + '80'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password"
                            />
                        )}

                        {mode === 'signup' && (
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                                ]}
                                placeholder="パスワード（確認）"
                                placeholderTextColor={colors.text + '80'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        )}

                        {displayError && (
                            <ThemedText type="default" style={styles.errorText}>
                                {displayError}
                            </ThemedText>
                        )}

                        {successMessage && (
                            <ThemedText type="default" style={styles.successText}>
                                {successMessage}
                            </ThemedText>
                        )}

                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading}
                            style={[
                                styles.button,
                                { backgroundColor: colors.tint },
                                loading && styles.buttonDisabled,
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
                                    {mode === 'login' ? 'ログイン' : mode === 'signup' ? '登録' : 'リセットメールを送信'}
                                </ThemedText>
                            )}
                        </Pressable>

                        {/* モード切り替え */}
                        <View style={styles.switchContainer}>
                            {mode === 'login' && (
                                <>
                                    <Pressable onPress={() => setMode('signup')}>
                                        <ThemedText type="default" style={[styles.switchText, { color: colors.tint }]}>
                                            アカウントを作成
                                        </ThemedText>
                                    </Pressable>
                                    <Pressable onPress={() => setMode('reset')}>
                                        <ThemedText type="default" style={[styles.switchText, { color: colors.tint }]}>
                                            パスワードを忘れた
                                        </ThemedText>
                                    </Pressable>
                                </>
                            )}
                            {mode === 'signup' && (
                                <Pressable onPress={() => setMode('login')}>
                                    <ThemedText type="default" style={[styles.switchText, { color: colors.tint }]}>
                                        既にアカウントをお持ちの方
                                    </ThemedText>
                                </Pressable>
                            )}
                            {mode === 'reset' && (
                                <Pressable onPress={() => setMode('login')}>
                                    <ThemedText type="default" style={[styles.switchText, { color: colors.tint }]}>
                                        ログインに戻る
                                    </ThemedText>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        marginTop: 8,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    formTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        marginBottom: 12,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    successText: {
        color: '#34C759',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 20,
    },
    switchText: {
        fontSize: 14,
    },
});
