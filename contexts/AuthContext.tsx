import { useRouter } from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { api } from "../services/api";

type User = {
  email: string;
  permissions: [];
  roles:[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(creadentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>(null);
  const router = useRouter()
  const isAuthenticated = !!user;

  useEffect(() => {
    const { 'nextauth.token': token  } = parseCookies();
    if(token) {
      api.get('/me').then(response => {
        console.log(response.data, 'Auth');
        const { email, permissions, roles } = response.data;
        setUser({ email, permissions, roles });
      }).catch(() => {
        destroyCookie(undefined, 'nextauth.token');
        destroyCookie(undefined, 'nextauth.refreshToken');
        router.push('/');
      });
    }
  }, [router]);

  async function signIn({ email, password}:SignInCredentials) {
    try {
      const response = await  api.post('/sessions', {
        email,
        password
      });
      const { token, refreshToken,  permissions, roles } = response.data;

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 1 month
        path: '/'
      });
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 1 month
        path: '/'
      });

      setUser({
        email,
        permissions,
        roles
      });
      api.defaults.headers['Authorization'] = `Bearer ${token}`
      router.push('/dashboard');
    } catch(err) {
      console.log(err);
    }
  }

  return(
    <AuthContext.Provider value={{ signIn, isAuthenticated, user  }}>
      {children}
    </AuthContext.Provider>
  );
}