'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, login, register, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/chat');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                if (!displayName) {
                    setError('Display name is required');
                    setLoading(false);
                    return;
                }
                await register(username, displayName, password);
            }
            router.push('/chat');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginContainer}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>💬</div>
                        <div className={styles.logoText}>COE Messenger</div>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.loginPage}>
            {/* Animated Background */}
            <div className={styles.backgroundGlow}>
                <div className={styles.glowOrb}></div>
                <div className={styles.glowOrb}></div>
                <div className={styles.glowOrb}></div>
            </div>

            <div className={styles.loginContainer}>
                <a href="/" className={styles.backLink}>
                    ← Back to home
                </a>

                <div className={styles.logo}>
                    <div className={styles.logoIcon}>💬</div>
                    <div className={styles.logoText}>COE Messenger</div>
                    <div className={styles.logoSubtext}>Controller of Examination</div>
                </div>

                <h1 className={styles.title}>
                    {isLogin ? 'Welcome back!' : 'Create an account'}
                </h1>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Display Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="How should we call you?"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className={styles.toggleMode}>
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button
                        className={styles.toggleButton}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
