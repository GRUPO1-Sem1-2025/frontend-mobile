import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const jwtDecode: (token: string) => { exp: number } = require('jwt-decode');

// Leer API_URL y LAN_IP de app.json (expo.extra)
const config = Constants.expoConfig ?? Constants.manifest!;
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

export type AuthContextType = {
  token: string | null;
  register: (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    ci: string,
    fecNac: string
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

  // Comprueba si el JWT expiró
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

  // Valida token al iniciar la app
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

  // Registro: devuelve { token } directamente
  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    ci : string
  ) => {
    const resp = await fetch(`${BASE_URL}/usuarios/registrarse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password }),
    });
    if (!resp.ok) {
      throw new Error('No se pudo registrar. Verifica tus datos.');
    }
    const { token: jwt } = await resp.json();
    await AsyncStorage.setItem('userToken', jwt);
    setToken(jwt);
  };

  // Paso 1: login envía código
  const requestCode = async (email: string, password: string) => {
    const resp = await fetch(`${BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      console.log(resp);
      throw new Error('E-mail o contraseña inválidos');
    }
    // backend envía código por mail
  };

  // Paso 2: verifica código y guarda token
  const verifyCode = async (email: string, code: string) => {
    const resp = await fetch(`${BASE_URL}/usuarios/verificarCodigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo: code }),
    });
    let data: any;
    try {
      data = await resp.json();
    } catch {
      throw new Error('Respuesta inesperada del servidor');
    }
    if (!resp.ok || !data.token) {
      throw new Error(data.error || 'Código inválido');
    }
    await AsyncStorage.setItem('userToken', data.token);
    setToken(data.token);
  };

  useEffect(() => {
    validateToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, register, requestCode, verifyCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}