import React from 'react';

interface WhatsAppAlertBannerProps {
  isConnected: boolean;
  onConnectClick?: () => void;
}

export const WhatsAppAlertBanner: React.FC<WhatsAppAlertBannerProps> = ({
  isConnected,
  onConnectClick,
}) => {
  if (isConnected) return null;

  return (
    <div
      data-testid="whatsapp-disconnected-banner"
      className="bg-rose-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-fade-in"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">⚠️</span>
        <span>
          WhatsApp Desconectado! Seus lembretes automáticos e confirmações estão pausados.
        </span>
      </div>

      {onConnectClick && (
        <button
          type="button"
          onClick={onConnectClick}
          className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition active:scale-95"
        >
          Conectar Agora
        </button>
      )}
    </div>
  );
};
