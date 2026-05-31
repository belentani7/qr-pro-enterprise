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
  HISTORY: "qr_history",
  FAVORITES: "qr_favorites",
};

export function useQRStorage() {
  const [history, setHistory] = useState<StoredQR[]>([]);
  const [favorites, setFavorites] = useState<StoredQR[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos del almacenamiento al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, favoritesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      ]);

      if (historyData) {
        setHistory(JSON.parse(historyData));
      }
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToHistory = useCallback(
    async (qr: Omit<StoredQR, "id" | "timestamp">) => {
      try {
        const newQR: StoredQR = {
          ...qr,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };

        const updatedHistory = [newQR, ...history];
        setHistory(updatedHistory);
        await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
        return newQR;
      } catch (error) {
        console.error("Error añadiendo a historial:", error);
        return null;
      }
    },
    [history]
  );

  const toggleFavorite = useCallback(
    async (qrId: string) => {
      try {
        const qrInHistory = history.find((q) => q.id === qrId);
        if (!qrInHistory) return;

        const isFavorite = favorites.some((q) => q.id === qrId);

        let updatedFavorites: StoredQR[];
        if (isFavorite) {
          updatedFavorites = favorites.filter((q) => q.id !== qrId);
        } else {
          updatedFavorites = [...favorites, { ...qrInHistory, isFavorite: true }];
        }

        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));

        // Actualizar en historial también
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

        // También eliminar de favoritos si estaba
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
      await AsyncStorage.multiRemove([STORAGE_KEYS.HISTORY, STORAGE_KEYS.FAVORITES]);
    } catch (error) {
      console.error("Error limpiando historial:", error);
    }
  }, []);

  const searchHistory = useCallback(
    (query: string) => {
      if (!query) return history;
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
