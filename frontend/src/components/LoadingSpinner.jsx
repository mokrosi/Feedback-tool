import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({
    size = 'medium',
    text = 'Loading...',
    showText = true,
    variant = 'primary',
    fullScreen = false
}) => {
    const sizeClass = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    }[size];

    const variantClass = {
        primary: styles.primary,
        secondary: styles.secondary,
        accent: styles.accent,
        white: styles.white
    }[variant];

    if (fullScreen) {
        return (
            <div className={styles.fullScreenOverlay}>
                <div className={styles.fullScreenContent}>
                    <div className={`${styles.loadingSpinner} ${sizeClass} ${variantClass}`}>
                        <div className={styles.spinnerRing}>
                            <div className={styles.spinnerCircle}></div>
                            <div className={styles.spinnerCircle}></div>
                            <div className={styles.spinnerCircle}></div>
                            <div className={styles.spinnerDot}></div>
                        </div>
                    </div>
                    {showText && (
                        <div className={styles.loadingText}>
                            <span className={styles.text}>{text}</span>
                            <div className={styles.dots}>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.loadingContainer}>
            <div className={`${styles.loadingSpinner} ${sizeClass} ${variantClass}`}>
                <div className={styles.spinnerRing}>
                    <div className={styles.spinnerCircle}></div>
                    <div className={styles.spinnerCircle}></div>
                    <div className={styles.spinnerCircle}></div>
                    <div className={styles.spinnerDot}></div>
                </div>
            </div>
            {showText && (
                <div className={styles.loadingText}>
                    <span className={styles.text}>{text}</span>
                    <div className={styles.dots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Alternative simple spinner for inline use
export const SimpleSpinner = ({ size = 'small', variant = 'primary' }) => {
    const sizeClass = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    }[size];

    const variantClass = {
        primary: styles.primary,
        secondary: styles.secondary,
        accent: styles.accent,
        white: styles.white
    }[variant];

    return (
        <div className={`${styles.simpleSpinner} ${sizeClass} ${variantClass}`}>
            <div className={styles.simpleDot}></div>
            <div className={styles.simpleDot}></div>
            <div className={styles.simpleDot}></div>
        </div>
    );
};

// Pulse loading animation for skeleton screens
export const PulseLoader = ({ width = '100%', height = '20px', className = '' }) => {
    return (
        <div
            className={`${styles.pulseLoader} ${className}`}
            style={{ width, height }}
        ></div>
    );
};

// Wave loading animation
export const WaveLoader = ({ variant = 'primary', size = 'medium' }) => {
    const sizeClass = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    }[size];

    const variantClass = {
        primary: styles.primary,
        secondary: styles.secondary,
        accent: styles.accent,
        white: styles.white
    }[variant];

    return (
        <div className={`${styles.waveLoader} ${sizeClass} ${variantClass}`}>
            <div className={styles.waveDot}></div>
            <div className={styles.waveDot}></div>
            <div className={styles.waveDot}></div>
            <div className={styles.waveDot}></div>
            <div className={styles.waveDot}></div>
        </div>
    );
};

export default LoadingSpinner;