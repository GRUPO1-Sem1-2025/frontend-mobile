import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Uso de require para obtener la función correctamente sin esModuleInterop
const jwtDecode: (token: string) => { exp: number } = require('jwt-decode');

// --- Tipos del contexto de autenticación
export type AuthContextType = {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Contexto con valores iniciales vacíos
export const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: async () => {},
});

// Props del AuthProvider: children es obligatorio
interface AuthProviderProps {
  children: ReactNode;
}

// --- Componente proveedor de autenticación
export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  // Función para iniciar sesión y almacenar el JWT
  const login = async (username: string, password: string) => {
    const response = await fetch('https://api.tuempresa.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }
    const { token: jwt } = await response.json();
    await AsyncStorage.setItem('userToken', jwt);
    setToken(jwt);
  };

  // Función para cerrar sesión
  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setToken(null);
  };

  // Verifica si el token está expirado
  const isTokenExpired = (jwt: string): boolean => {
    try {
      const { exp } = jwtDecode(jwt);
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  // Valida y restaura el token desde AsyncStorage
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

  useEffect(() => {
    // Al montar, validamos el token
    validateToken();

    // Revalidar cuando la app vuelve al foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        validateToken();
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
