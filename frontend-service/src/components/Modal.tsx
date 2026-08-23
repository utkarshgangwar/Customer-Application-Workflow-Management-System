"use client";

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  maxWidth = "max-w-md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full ${maxWidth} border border-[#d0d7de] bg-white p-5 shadow-lg`}
      >
        <div className="flex justify-between items-center border-b border-[#d0d7de] pb-2 mb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-sm font-mono font-bold"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
