"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  isLoading = false,
}: ConfirmModalProps) {
  const variantConfig = {
    danger: {
      icon: <AlertCircle size={48} />,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
      buttonColor: "danger" as const,
    },
    warning: {
      icon: <AlertTriangle size={48} />,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50",
      buttonColor: "warning" as const,
    },
    success: {
      icon: <CheckCircle size={48} />,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      buttonColor: "success" as const,
    },
    info: {
      icon: <Info size={48} />,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
      buttonColor: "primary" as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-4">
            <div
              className={`${config.bgColor} p-3 rounded-full ${config.iconColor}`}
            >
              {config.icon}
            </div>
            <div className="flex-1">
              <p className="text-white">{message}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            color={config.buttonColor}
            onClick={onConfirm}
            isLoading={isLoading}
            className={variant === "warning" ? "text-black" : ""}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
