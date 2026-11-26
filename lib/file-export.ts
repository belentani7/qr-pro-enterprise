import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";

/**
 * Exporta o descarga un Data URL o texto (SVG/PNG) de forma nativa en iOS/Android
 * y mediante descarga directa en navegadores Web.
 */
export async function downloadDataUrl(
  dataUrl: string,
  fileName: string
): Promise<{ savedUri: string; fileName: string }> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return { savedUri: fileName, fileName };
  }

  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
  const fileUri = `${baseDir}${fileName}`;

  if (dataUrl.startsWith("data:image/svg+xml;utf8,")) {
    const svgContent = decodeURIComponent(dataUrl.slice("data:image/svg+xml;utf8,".length));
    await FileSystem.writeAsStringAsync(fileUri, svgContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else if (dataUrl.includes(";base64,")) {
    const base64Data = dataUrl.split(";base64,")[1] ?? "";
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    await FileSystem.writeAsStringAsync(fileUri, dataUrl, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  return { savedUri: fileUri, fileName };
}

export const saveQRDataUrl = downloadDataUrl;

/**
 * Descarga un archivo de texto plano (por ejemplo, exportación JSON de historial).
 */
export async function downloadTextFile(
  content: string,
  fileName: string,
  mimeType = "application/json"
): Promise<{ savedUri: string; fileName: string }> {
  if (Platform.OS === "web" && typeof document !== "undefined" && typeof Blob !== "undefined") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return { savedUri: fileName, fileName };
  }

  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: fileName });
  }

  return { savedUri: fileUri, fileName };
}

/**
 * Comparte un código QR o su contenido en Web, iOS y Android.
 */
export async function shareQRResource(
  dataUrlOrText: string,
  title = "Compartir código QR"
): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    if (typeof navigator.share === "function" && !dataUrlOrText.startsWith("data:")) {
      await navigator.share({ title, text: dataUrlOrText });
      return true;
    }
    await Clipboard.setStringAsync(dataUrlOrText);
    return true;
  }

  if (dataUrlOrText.startsWith("data:")) {
    const ext = dataUrlOrText.startsWith("data:image/svg") ? "svg" : "png";
    const { savedUri } = await downloadDataUrl(dataUrlOrText, `qr_share_${Date.now()}.${ext}`);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(savedUri, {
        mimeType: ext === "svg" ? "image/svg+xml" : "image/png",
        dialogTitle: title,
      });
      return true;
    }
  }

  await Clipboard.setStringAsync(dataUrlOrText);
  return true;
}

export async function shareOrExportQRDataUrl(
  dataUrl: string,
  fileName: string,
  title = "Compartir código QR"
): Promise<boolean> {
  if (Platform.OS === "web") {
    await downloadDataUrl(dataUrl, fileName);
    return true;
  }
  return shareQRResource(dataUrl, title);
}

/**
 * Copia texto al portapapeles del sistema (Web, iOS, Android).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  await Clipboard.setStringAsync(text);
  return true;
}

export const copyTextToClipboard = copyToClipboard;

/**
 * Abre un selector local de imagen en Web devolviendo un Data URL en memoria
 * sin dependencias pesadas ni subida a servidores externos.
 */
export async function pickLocalImageDataUrl(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return null;
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
