// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const jwtDecode: (token: string) => { exp: number } = require('jwt-decode');

const extra = (Constants.expoConfig?.extra || {}) as {
  API_URL: string;
  LAN_IP: string;
};

const { API_URL, LAN_IP } = extra;

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
    fecNac: string,
    categoria: string[],
    matricula?: string
  ) => Promise<string>;
  requestCode: (
    email: string,
    password: string
  ) => Promise<{ login_directo: string; mensaje: string }>;
  verifyCode: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (
    email: string,
    old_pass: string,
    new_pass: string,
    new_pass1: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resendCode: (email: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  register: async () => '',
  requestCode: async () => ({ login_directo: '0', mensaje: '' }),
  verifyCode: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
  logout: async () => {},
  resendCode: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

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
    password: string,
    ci: string,
    fecNac: string,
    categoria: string[],
    matricula?: string
  ): Promise<string> => {
    const resp = await fetch(`${BASE_URL}/usuarios/registrarse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        password,
        ci,
        fecha_nac: fecNac
      }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json?.mensaje || 'No se pudo registrar.');
    }

    return json?.mensaje || 'Registro exitoso';
  };

  const requestCode = async (
    email: string,
    password: string
  ): Promise<{ login_directo: string; mensaje: string }> => {
    const resp = await fetch(`${BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.mensaje || 'E-mail o contraseña inválidos');
    }

    return {
      login_directo: data?.Login_directo ?? '0',
      mensaje: data?.mensaje ?? '',
    };
  };

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

  const resetPassword = async (email: string) => {
    const resetUrl = `${BASE_URL}/usuarios/resetearcontrasenia?para=${email}`;
    const resp = await fetch(resetUrl, {
      method: 'POST',
    });

    if (!resp.ok) {
      let errorMessage = 'Error al solicitar el reseteo de contraseña.';
      try {
        const data = await resp.json();
        if (data?.mensaje) {
          errorMessage = data.mensaje;
        }
      } catch {
        // Si no es JSON, mantener el mensaje por defecto
      }
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (
    email: string,
    old_pass: string,
    new_pass: string,
    new_pass1: string
  ) => {
    const resp = await fetch(`${BASE_URL}/usuarios/cambiarContrasenia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, old_pass, new_pass, new_pass1 }),
    });

    if (!resp.ok) {
      let errorMessage = 'Error al cambiar la contraseña.';
      try {
        const data = await resp.json();
        if (data?.mensaje) {
          errorMessage = data.mensaje;
        }
      } catch {
        // Si no es JSON, mantener el mensaje por defecto
      }
      throw new Error(errorMessage);
    }
  };

  const resendCode = async (email: string) => {
    const response = await fetch(
      `${BASE_URL}/usuarios/reenviarCodigo?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.mensaje || 'No se pudo reenviar el código.';
      throw new Error(message);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        register,
        requestCode,
        verifyCode,
        resetPassword,
        changePassword,
        logout,
        resendCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
