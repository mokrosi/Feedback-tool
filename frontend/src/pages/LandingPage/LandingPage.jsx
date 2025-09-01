import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './LandingPage.module.css';

// Icons as components for better performance
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.featureIcon}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.arrowIcon}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.serviceIcon}>
        <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const SecurityIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.serviceIcon}>
        <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.814 3.519 10.798 9.495 12.897a.75.75 0 00.51 0C18.231 20.548 21.75 15.564 21.75 9.75a12.74 12.74 0 00-.635-4.435.75.75 0 00-.722-.515 11.209 11.209 0 01-7.877-3.08z" clipRule="evenodd" />
    </svg>
);

const SpeedIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.serviceIcon}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
    </svg>
);

const CollaborationIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.serviceIcon}>
        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
    </svg>
);

export default function LandingPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredFeature, setHoveredFeature] = useState(null);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true);

        // If user is already authenticated, redirect to appropriate dashboard
        if (isAuthenticated()) {
            navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    const features = [
        {
            id: 1,
            title: "Intelligent Analytics",
            description: "AI-powered reporting that surfaces trends and highlights so you can act on feedback faster.",
            icon: AnalyticsIcon
        },
        {
            id: 2,
            title: "Secure Data Handling",
            description: "Privacy-first storage and access controls to keep respondent data safe.",
            icon: SecurityIcon
        },
        {
            id: 3,
            title: "AI-Assisted Survey Creation",
            description: "Get help drafting questions and improving phrasing with built-in AI suggestions.",
            icon: SpeedIcon
        },
        {
            id: 4,
            title: "Ready-made Templates",
            description: "Start quickly with professionally designed, customizable survey templates.",
            icon: CollaborationIcon
        }
    ];

    const benefits = [
        "Create professional surveys in minutes",
        "AI-assisted question drafting and phrasing",
        "Ready-made, customizable templates",
        "Real-time response tracking and analytics",
        "Automated report generation",

    ];

    return (
        <div className={styles.landingPage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
                <div className={styles.floatingShape4}></div>
                <div className={styles.floatingShape5}></div>
                <div className={styles.floatingShape6}></div>
            </div>

            {/* Navigation Header */}
            <nav className={`${styles.navigation} ${isVisible ? styles.slideDown : ''}`}>
                <div className={styles.navContainer}>
                    <div className={styles.logoSection}>
                        <div className={styles.logo}>
                            <svg viewBox="0 0 50 50" className={styles.logoSvg}>
                                <circle cx="25" cy="25" r="20" className={styles.logoCircle} />
                                <path d="M15 25 L22 32 L35 18" className={styles.logoCheck} />
                            </svg>
                        </div>
                        <span className={styles.logoText}>FeedbackPro</span>
                    </div>

                    <div className={styles.navActions}>
                        <Link to="/login" className={styles.loginBtn}>
                            Sign In
                        </Link>
                        <Link to="/signup" className={styles.signupBtn}>
                            Get Started
                            <ArrowRightIcon />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={`${styles.heroSection} ${isVisible ? styles.fadeInUp : ''}`}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            Transform Your Feedback Into
                            <span className={styles.gradientText}> Actionable Insights</span>
                        </h1>
                        <p className={styles.heroDescription}>
                            Create powerful surveys, collect valuable feedback, and turn data into decisions
                            with our intelligent analytics platform. Trusted by thousands of organizations worldwide.
                        </p>

                        <div className={styles.heroActions}>
                            {/* Removed "Start Free Trial" and "Watch Demo" per product availability.
                                Keep a neutral Get Started link for signups. */}
                            <Link to="/signup" className={styles.primaryCta}>
                                Get Started
                                <ArrowRightIcon />
                            </Link>
                        </div>

                    </div>

                    <div className={styles.heroVisual}>
                        <div className={styles.dashboardMockup}>
                            <div className={styles.mockupWindow}>
                                <div className={styles.windowHeader}>
                                    <div className={styles.windowControls}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                                <div className={styles.mockupContent}>
                                    <div className={styles.mockupChart}>
                                        <div className={styles.chartBars}>
                                            <div className={styles.chartBar} style={{ height: '60%' }}></div>
                                            <div className={styles.chartBar} style={{ height: '80%' }}></div>
                                            <div className={styles.chartBar} style={{ height: '45%' }}></div>
                                            <div className={styles.chartBar} style={{ height: '90%' }}></div>
                                            <div className={styles.chartBar} style={{ height: '70%' }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.mockupStats}>
                                        <div className={styles.statItem}>
                                            <div className={styles.statDot}></div>
                                            <span>Response Rate: 94%</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statDot}></div>
                                            <span>Completion Time: 2.3m</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={`${styles.featuresSection} ${isVisible ? styles.fadeInUp : ''}`}>
                <div className={styles.sectionContainer}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            Why teams choose FeedbackPro
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Helpful features that simplify how you collect and analyze feedback
                        </p>
                    </div>

                    <div className={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`${styles.featureCard} ${hoveredFeature === feature.id ? styles.hovered : ''}`}
                                onMouseEnter={() => setHoveredFeature(feature.id)}
                                onMouseLeave={() => setHoveredFeature(null)}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles.featureIconWrapper}>
                                    <feature.icon />
                                </div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDescription}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className={`${styles.benefitsSection} ${isVisible ? styles.fadeInUp : ''}`}>
                <div className={styles.sectionContainer}>
                    <div className={styles.benefitsGrid}>
                        <div className={styles.benefitsContent}>
                            <h2 className={styles.benefitsTitle}>
                                Everything you need to succeed
                            </h2>
                            <p className={styles.benefitsDescription}>
                                From survey creation to advanced analytics, FeedbackPro provides all the tools
                                you need to gather meaningful insights and drive better decisions.
                            </p>

                            <div className={styles.benefitsList}>
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className={styles.benefitItem}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <CheckIcon />
                                        <span>{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/signup" className={styles.benefitsCta}>
                                Get Started Today
                                <ArrowRightIcon />
                            </Link>
                        </div>

                        <div className={styles.benefitsVisual}>
                            <div className={styles.benefitsIllustration}>
                                <div className={styles.illustrationElement1}></div>
                                <div className={styles.illustrationElement2}></div>
                                <div className={styles.illustrationElement3}></div>
                                <div className={styles.illustrationCenter}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`${styles.ctaSection} ${isVisible ? styles.fadeInUp : ''}`}>
                <div className={styles.ctaContainer}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>
                            Ready to Transform Your Feedback Process?
                        </h2>
                        <p className={styles.ctaDescription}>
                            Join thousands of organizations already using FeedbackPro to make better decisions
                        </p>

                        <div className={styles.ctaActions}>
                            <Link to="/signup" className={styles.ctaPrimary}>
                                Get Started
                                <ArrowRightIcon />
                            </Link>
                            <Link to="/login" className={styles.ctaSecondary}>
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContainer}>
                    <div className={styles.footerContent}>
                        <div className={styles.footerLogo}>
                            <div className={styles.logo}>
                                <svg viewBox="0 0 50 50" className={styles.logoSvg}>
                                    <circle cx="25" cy="25" r="20" className={styles.logoCircle} />
                                    <path d="M15 25 L22 32 L35 18" className={styles.logoCheck} />
                                </svg>
                            </div>
                            <span className={styles.logoText}>FeedbackPro</span>
                        </div>

                        <div className={styles.footerText}>
                            <p>&copy; 2024 FeedbackPro. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
