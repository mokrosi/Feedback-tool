import { useState, useCallback } from "react";

/**
 * Custom hook for managing dialog state and actions
 * @returns {object} Dialog state and control functions
 */
export const useDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    showCancel: false,
    showConfirm: true,
    cancelText: "Cancel",
    confirmText: "OK",
    onConfirm: null,
    onCancel: null,
    size: "medium",
    preventBackdropClose: false,
    isLoading: false,
    children: null,
  });

  const openDialog = useCallback((config) => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: true,
      ...config,
    }));
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  }, []);

  const setLoading = useCallback((loading) => {
    setDialogState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  // Promise-based dialog method
  const showDialog = useCallback(
    (config) => {
      return new Promise((resolve) => {
        const handleConfirm = () => {
          resolve(true);
          closeDialog();
        };

        const handleCancel = () => {
          resolve(false);
          closeDialog();
        };

        openDialog({
          ...config,
          onConfirm: handleConfirm,
          onCancel: handleCancel,
          showCancel: config.type === "danger" || config.showCancel !== false,
        });
      });
    },
    [openDialog, closeDialog]
  );

  // Convenience methods for different dialog types
  const showAlert = useCallback(
    (title, message, confirmText = "OK") => {
      openDialog({
        type: "info",
        title,
        message,
        confirmText,
        showCancel: false,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  const showWarning = useCallback(
    (title, message, confirmText = "OK") => {
      openDialog({
        type: "warning",
        title,
        message,
        confirmText,
        showCancel: false,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  const showDanger = useCallback(
    (title, message, confirmText = "OK") => {
      openDialog({
        type: "danger",
        title,
        message,
        confirmText,
        showCancel: false,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  const showSuccess = useCallback(
    (title, message, confirmText = "OK") => {
      openDialog({
        type: "success",
        title,
        message,
        confirmText,
        showCancel: false,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  const showConfirmation = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = null,
      confirmText = "Confirm",
      cancelText = "Cancel"
    ) => {
      openDialog({
        type: "confirmation",
        title,
        message,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
        showCancel: true,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  const showDangerConfirmation = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = null,
      confirmText = "Delete",
      cancelText = "Cancel"
    ) => {
      openDialog({
        type: "danger",
        title,
        message,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
        showCancel: true,
        showConfirm: true,
      });
    },
    [openDialog]
  );

  return {
    dialogState,
    openDialog,
    closeDialog,
    setLoading,
    showDialog,
    showAlert,
    showWarning,
    showDanger,
    showSuccess,
    showConfirmation,
    showDangerConfirmation,
  };
};
