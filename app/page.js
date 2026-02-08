'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './landing.module.css';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.landing}>
      {/* Animated Background */}
      <div className={styles.backgroundGlow}>
        <div className={styles.glowOrb}></div>
        <div className={styles.glowOrb}></div>
        <div className={styles.glowOrb}></div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>💬</div>
          <span>COE Messenger</span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#contact" className={styles.navLink}>Contact</a>
        </div>

        <div className={styles.navButtons}>
          <Link href="/login" className={styles.btnSecondary}>
            Sign In
          </Link>
          <Link href="/register" className={styles.btnPrimary}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            Now with real-time messaging
          </div>

          <h1 className={styles.heroTitle}>
            Communication for <span className={styles.highlight}>Excellence</span>
          </h1>

          <p className={styles.heroSubtitle}>
            The official internal messaging platform for the Controller of Examination.
            Secure, fast, and designed for seamless collaboration across departments.
          </p>

          <div className={styles.heroButtons}>
            <Link href="/register" className={`${styles.btnPrimary} ${styles.btnLarge}`}>
              Start Free Today
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/login" className={`${styles.btnSecondary} ${styles.btnLarge}`}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Features</p>
          <h2 className={styles.sectionTitle}>Everything you need to collaborate</h2>
          <p className={styles.sectionSubtitle}>
            Built specifically for the Controller of Examination with security and efficiency in mind.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Real-time Messaging</h3>
            <p className={styles.featureDesc}>
              Instant message delivery with typing indicators and read receipts. Stay connected in real-time.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Enterprise Security</h3>
            <p className={styles.featureDesc}>
              End-to-end encryption and role-based access control to protect sensitive examination data.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Team Channels</h3>
            <p className={styles.featureDesc}>
              Organize conversations by department, project, or topic with dedicated channels.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>File Sharing</h3>
            <p className={styles.featureDesc}>
              Share documents, images, and files securely with your team. All files organized and searchable.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Powerful Search</h3>
            <p className={styles.featureDesc}>
              Find any message, file, or conversation instantly with our advanced search functionality.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Role Management</h3>
            <p className={styles.featureDesc}>
              Assign roles and permissions to control access levels across your organization.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className={styles.cta}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to get started?</h2>
          <p className={styles.ctaSubtitle}>
            Join the COE Messenger today and transform how your team communicates.
          </p>
          <Link href="/register" className={`${styles.btnPrimary} ${styles.btnLarge}`}>
            Create Your Account
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © 2024 Controller of Examination. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <a href="#" className={styles.footerLink}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
