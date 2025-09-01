import React from 'react';
import styles from './Dialog.module.css';

const Dialog = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'info', 'warning', 'danger', 'success', 'confirmation'
    children,
    showCancel = false,
    showConfirm = true,
    cancelText = 'Cancel',
    confirmText = 'OK',
    onConfirm,
    onCancel,
    size = 'medium', // 'small', 'medium', 'large'
    preventBackdropClose = false,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !preventBackdropClose) {
            onClose();
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return '⚠️';
            case 'danger':
                return '❌';
            case 'success':
                return '✅';
            case 'confirmation':
                return '❓';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={`${styles.dialog} ${styles[size]} ${styles[type]}`}>
                <div className={styles.header}>
                    {type !== 'info' && (
                        <div className={styles.icon}>
                            {getIcon()}
                        </div>
                    )}
                    <h3 className={styles.title}>{title}</h3>
                    {!preventBackdropClose && (
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close dialog"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className={styles.content}>
                    {message && <p className={styles.message}>{message}</p>}
                    {children}
                </div>

                <div className={styles.footer}>
                    {showCancel && (
                        <button
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                    )}
                    {showConfirm && (
                        <button
                            className={`${styles.button} ${styles.confirmButton} ${styles[`${type}Button`]}`}
                            onClick={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dialog;