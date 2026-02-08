'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/login.module.css';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, register, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/chat');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(username, displayName, password);
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
                <Link href="/" className={styles.backLink}>
                    ← Back to home
                </Link>

                <div className={styles.logo}>
                    <div className={styles.logoIcon}>💬</div>
                    <div className={styles.logoText}>COE Messenger</div>
                    <div className={styles.logoSubtext}>Controller of Examination</div>
                </div>

                <h1 className={styles.title}>Create your account</h1>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Create a password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className={styles.toggleMode}>
                    Already have an account?
                    <Link href="/login" className={styles.toggleButton}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
