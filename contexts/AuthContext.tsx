import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const AUTH_KEY = '@vault/auth';

interface AuthData {
  pinHash: string;
  idleTimeout: number;
}

interface AuthContextValue {
  isLoading: boolean;
  hasPin: boolean;
  isUnlocked: boolean;
  idleTimeout: number;
  createPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  setIdleTimeout: (minutes: number) => Promise<void>;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'vault_salt_2024'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const lastActivity = useRef(Date.now());
  const idleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        setAuthData(JSON.parse(raw));
      }
    } catch {}
    setIsLoading(false);
  }

  async function saveAuth(data: AuthData) {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuthData(data);
  }

  useEffect(() => {
    if (idleTimer.current) clearInterval(idleTimer.current);
    if (!isUnlocked || !authData || authData.idleTimeout === 0) return;

    idleTimer.current = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle > authData.idleTimeout * 60 * 1000) {
        setIsUnlocked(false);
      }
    }, 15000);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
    };
  }, [isUnlocked, authData?.idleTimeout]);

  function updateActivity() {
    lastActivity.current = Date.now();
  }

  async function createPin(pin: string) {
    const pinHash = await hashPin(pin);
    const data: AuthData = { pinHash, idleTimeout: 5 };
    await saveAuth(data);
    setIsUnlocked(true);
  }

  async function unlock(pin: string): Promise<boolean> {
    if (!authData) return false;
    const hash = await hashPin(pin);
    if (hash === authData.pinHash) {
      setIsUnlocked(true);
      lastActivity.current = Date.now();
      return true;
    }
    return false;
  }

  function lock() {
    setIsUnlocked(false);
  }

  async function changePin(oldPin: string, newPin: string): Promise<boolean> {
    if (!authData) return false;
    const oldHash = await hashPin(oldPin);
    if (oldHash !== authData.pinHash) return false;
    const newHash = await hashPin(newPin);
    await saveAuth({ ...authData, pinHash: newHash });
    return true;
  }

  async function setIdleTimeout(minutes: number) {
    if (!authData) return;
    await saveAuth({ ...authData, idleTimeout: minutes });
  }

  const value = useMemo<AuthContextValue>(() => ({
    isLoading,
    hasPin: !!authData?.pinHash,
    isUnlocked,
    idleTimeout: authData?.idleTimeout ?? 5,
    createPin,
    unlock,
    lock,
    changePin,
    setIdleTimeout,
    updateActivity,
  }), [isLoading, authData, isUnlocked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
