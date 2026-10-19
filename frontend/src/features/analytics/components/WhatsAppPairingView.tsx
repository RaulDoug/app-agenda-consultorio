import React, { useState, useEffect } from 'react';

interface WhatsAppPairingViewProps {
  isConnected: boolean;
  qrCodeBase64?: string | null;
  connectedNumber?: string | null;
  onRefreshQrCode?: () => void;
  onDisconnect?: () => void;
}

export const WhatsAppPairingView: React.FC<WhatsAppPairingViewProps> = ({
  isConnected,
  qrCodeBase64,
  connectedNumber,
  onRefreshQrCode,
  onDisconnect,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [qrCodeBase64]);
  return (
    <div
      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 max-w-md mx-auto"
      data-testid="whatsapp-pairing-view"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Integração WhatsApp</h3>
          <p className="text-xs text-slate-500">Lembretes automáticos e mensagens</p>
        </div>

        <span
          data-testid="whatsapp-status-badge"
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {isConnected ? 'Conectado (Verde)' : 'Desconectado'}
        </span>
      </div>

      {isConnected ? (
        /* Sessão Conectada */
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 text-sm">
              WhatsApp Conectado e Operacional
            </h4>
            {connectedNumber && (
              <p className="text-xs text-emerald-700 font-mono mt-0.5">
                Número conectado: {connectedNumber}
              </p>
            )}
            <p className="text-xs text-emerald-700 mt-1">
              Os lembretes e confirmações estão sendo despachados automaticamente.
            </p>
          </div>

          {onDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              className="text-xs text-rose-600 hover:text-rose-800 underline font-medium pt-1"
            >
              Desconectar este aparelho
            </button>
          )}
        </div>
      ) : (
        /* Sessão Desconectada - Exibe QR Code */
        <div className="space-y-4 text-center">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
            {qrCodeBase64 && !imageError ? (
              <img
                src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto rounded-lg shadow-2xs"
                data-testid="whatsapp-qrcode-image"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                data-testid="whatsapp-qrcode-placeholder"
                className="w-48 h-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-slate-500 text-xs text-center"
              >
                <div className="w-8 h-8 mb-2 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold text-slate-700">Aguardando QR Code</span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Gerando sessão com a Evolution API...
                </span>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="text-left text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 mb-1">Como conectar:</div>
            <div>1. Abra o WhatsApp no seu smartphone.</div>
            <div>2. Toque em <strong>Aparelhos Conectados</strong>.</div>
            <div>3. Toque em <strong>Conectar um aparelho</strong> e aponte a câmera.</div>
          </div>

          {onRefreshQrCode && (
            <button
              type="button"
              onClick={onRefreshQrCode}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs transition active:scale-95"
            >
              Atualizar QR Code
            </button>
          )}
        </div>
      )}
    </div>
  );
};
