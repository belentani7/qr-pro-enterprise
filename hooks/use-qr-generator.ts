import { useCallback, useState } from "react";
import QRCode from "qrcode";

export interface QRGeneratorOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface QRGeneratorResult {
  dataUrl: string;
  width: number;
  height: number;
}

export function useQRGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(
    async (
      content: string,
      options: QRGeneratorOptions = {}
    ): Promise<QRGeneratorResult | null> => {
      if (!content || content.trim().length === 0) {
        setError("El contenido no puede estar vacío");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const width = options.width || 300;
        const dataUrl = await QRCode.toDataURL(content, {
          width,
          margin: options.margin || 2,
          color: {
            dark: options.color?.dark || "#000000",
            light: options.color?.light || "#FFFFFF",
          },
          errorCorrectionLevel: options.errorCorrectionLevel || "M",
        });

        setLoading(false);
        return {
          dataUrl,
          width,
          height: width,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al generar QR";
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateQR,
    loading,
    error,
    clearError,
  };
}
