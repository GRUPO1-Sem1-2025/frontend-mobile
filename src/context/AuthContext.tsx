import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const jwtDecode: (token: string) => { exp: number } = require('jwt-decode');

import Constants from 'expo-constants';

const config = Constants.expoConfig ?? Constants.manifest;
const { API_URL, LAN_IP } = config.extra as {
  API_URL: string;
  LAN_IP:  string;
};

function resolveBaseUrl() {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return API_URL.replace('localhost', '10.0.2.2');
    }
    if (Platform.OS === 'ios' && Constants.isDevice) {
      return API_URL.replace('localhost', LAN_IP);
    }
    return API_URL;
  }
  return API_URL;
}

export const BASE_URL = resolveBaseUrl();
console.log('[AuthContext] BASE_URL =', BASE_URL);
export type AuthContextType = {
  token: string | null;
  register: (
    nombre: string,
    apellido: string,
    email: string,
    password: string
  ) => Promise<void>;
  requestCode: (email: string, password: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  register: async () => {},
  requestCode: async () => {},
  verifyCode: async () => {},
  logout: async () => {},
});

interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  const isTokenExpired = (jwt: string): boolean => {
    try {
      const { exp } = jwtDecode(jwt);
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setToken(null);
  };

  const validateToken = async () => {
    const stored = await AsyncStorage.getItem('userToken');
    if (stored) {
      if (isTokenExpired(stored)) {
        await logout();
        Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión.');
      } else {
        setToken(stored);
      }
    }
  };

  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    password: string
  ) => {
    const resp = await fetch(`${BASE_URL}/usuarios/registrarse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password }),
    });
    if (!resp.ok) {
      throw new Error('No se pudo registrar. Verifica tus datos.');
    }
    // backend envía código por mail
  };

  const requestCode = async (email: string, password: string) => {
    const resp = await fetch(`${BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      throw new Error('E‑mail o contraseña inválidos');
    }
    // backend envía código por mail
  };

  const verifyCode = async (email: string, code: string) => {
    const resp = await fetch(`${BASE_URL}/usuarios/verificarCodigo?email=${email}&codigo=${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!resp.ok) {
      throw new Error('Código inválido');
    }
    const { token: jwt } = await resp.json();
    await AsyncStorage.setItem('userToken', jwt);
    setToken(jwt);
  };

  useEffect(() => {
    validateToken();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') validateToken();
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, register, requestCode, verifyCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}