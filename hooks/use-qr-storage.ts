import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoredQR {
  id: string;
  type: "generated" | "scanned";
  qrType: string;
  content: string;
  dataUrl?: string;
  timestamp: number;
  isFavorite: boolean;
  customColors?: {
    dark: string;
    light: string;
  };
}

const STORAGE_KEYS = {
  HISTORY: "@qr_pro_history",
  FAVORITES: "@qr_pro_favorites",
  LEGACY_HISTORY: "qr_history",
  LEGACY_FAVORITES: "qr_favorites",
} as const;

export function useQRStorage() {
  const [history, setHistory] = useState<StoredQR[]>([]);
  const [favorites, setFavorites] = useState<StoredQR[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, favoritesData, legacyHistory, legacyFavorites] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.LEGACY_FAVORITES),
      ]);

      const resolvedHistory = historyData ?? legacyHistory;
      const resolvedFavorites = favoritesData ?? legacyFavorites;

      if (resolvedHistory) {
        const parsed = JSON.parse(resolvedHistory) as StoredQR[];
        setHistory(parsed);
        if (!historyData && legacyHistory) {
          await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, resolvedHistory);
          await AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
        }
      }
      if (resolvedFavorites) {
        const parsed = JSON.parse(resolvedFavorites) as StoredQR[];
        setFavorites(parsed);
        if (!favoritesData && legacyFavorites) {
          await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, resolvedFavorites);
          await AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_FAVORITES);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const addToHistory = useCallback(
    async (qr: Omit<StoredQR, "id" | "timestamp">) => {
      try {
        const newQR: StoredQR = {
          ...qr,
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        };

        const updatedHistory = [newQR, ...history];
        setHistory(updatedHistory);
        await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

        if (newQR.isFavorite) {
          const updatedFavorites = [newQR, ...favorites];
          setFavorites(updatedFavorites);
          await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
        }

        return newQR;
      } catch (error) {
        console.error("Error añadiendo a historial:", error);
        return null;
      }
    },
    [history, favorites]
  );

  const toggleFavorite = useCallback(
    async (qrId: string) => {
      try {
        const qrInHistory = history.find((q) => q.id === qrId) ?? favorites.find((q) => q.id === qrId);
        if (!qrInHistory) return;

        const isFavorite = favorites.some((q) => q.id === qrId);
        const updatedFavorites = isFavorite
          ? favorites.filter((q) => q.id !== qrId)
          : [{ ...qrInHistory, isFavorite: true }, ...favorites];

        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));

        const updatedHistory = history.map((q) =>
          q.id === qrId ? { ...q, isFavorite: !isFavorite } : q
        );
        setHistory(updatedHistory);
        await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [history, favorites]
  );

  const deleteFromHistory = useCallback(
    async (qrId: string) => {
      try {
        const updatedHistory = history.filter((q) => q.id !== qrId);
        setHistory(updatedHistory);
        await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

        const updatedFavorites = favorites.filter((q) => q.id !== qrId);
        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
      } catch (error) {
        console.error("Error eliminando del historial:", error);
      }
    },
    [history, favorites]
  );

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      setFavorites([]);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HISTORY,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.LEGACY_HISTORY,
        STORAGE_KEYS.LEGACY_FAVORITES,
      ]);
    } catch (error) {
      console.error("Error limpiando historial:", error);
    }
  }, []);

  const searchHistory = useCallback(
    (query: string) => {
      if (!query.trim()) return history;
      const lowerQuery = query.toLowerCase();
      return history.filter(
        (q) =>
          q.content.toLowerCase().includes(lowerQuery) ||
          q.qrType.toLowerCase().includes(lowerQuery)
      );
    },
    [history]
  );

  return {
    history,
    favorites,
    loading,
    addToHistory,
    toggleFavorite,
    deleteFromHistory,
    clearHistory,
    searchHistory,
    loadData,
  };
}
