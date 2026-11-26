import { useCallback, useState } from "react";
import {
  MAX_PROMPT_CHARS,
  generateLocalQRPngDataUrl,
  generateLocalQRSVG,
  generateMultiPartQRSVG,
  isValidExtendedPrompt,
  isValidQRPayload,
  svgToDataUrl,
  type MultiQRPart,
  type QRErrorCorrectionLevel,
  type QRFinderStyle,
  type QRModuleShape,
} from "@/lib/qr-engine";

export interface QRGeneratorOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  format?: "png" | "svg";
  moduleShape?: QRModuleShape;
  finderStyle?: QRFinderStyle;
  logoText?: string;
}

export interface QRGeneratorResult {
  dataUrl: string;
  svg?: string;
  width: number;
  height: number;
  isMultiPart?: boolean;
  parts?: MultiQRPart[];
}

export function useQRGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(
    async (
      content: string,
      options: QRGeneratorOptions = {}
    ): Promise<QRGeneratorResult | null> => {
      if (!isValidExtendedPrompt(content)) {
        setError(`El contenido debe tener entre 1 y ${MAX_PROMPT_CHARS} caracteres`);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const width = options.width || 300;
        const margin = options.margin ?? 2;
        const darkColor = options.color?.dark || "#000000";
        const lightColor = options.color?.light || "#FFFFFF";

        // Si supera la capacidad de un único símbolo ISO/IEC 18004 (hasta 5.000 caracteres),
        // encadena automáticamente en partes [QRP i/N] 100% escaneables.
        if (!isValidQRPayload(content) || new TextEncoder().encode(content).byteLength > 2200) {
          const multi = generateMultiPartQRSVG(content, {
            width,
            margin,
            darkColor,
            lightColor,
            errorCorrectionLevel: options.errorCorrectionLevel || "M",
            moduleShape: options.moduleShape ?? "square",
            finderStyle: options.finderStyle,
            logoText: options.logoText,
          });
          setLoading(false);
          return {
            dataUrl: multi.parts[0].dataUrl,
            svg: multi.parts[0].svg,
            width,
            height: width,
            isMultiPart: multi.isMultiPart,
            parts: multi.parts,
          };
        }

        const useVectorRenderer =
          options.format === "svg" ||
          (options.moduleShape && options.moduleShape !== "square") ||
          Boolean(options.logoText);

        if (useVectorRenderer) {
          const svg = generateLocalQRSVG(content, {
            width,
            margin,
            darkColor,
            lightColor,
            errorCorrectionLevel: options.errorCorrectionLevel || "M",
            moduleShape: options.moduleShape ?? "square",
            finderStyle: options.finderStyle,
            logoText: options.logoText,
          });
          setLoading(false);
          return {
            dataUrl: svgToDataUrl(svg),
            svg,
            width,
            height: width,
          };
        }

        const dataUrl = await generateLocalQRPngDataUrl(content, {
          width,
          margin,
          darkColor,
          lightColor,
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
