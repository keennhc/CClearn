import { useMutation } from '@tanstack/react-query';
import type { LoginRequest } from '@home-owners-hub/shared-types';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const { login: setSession } = useAuth();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const data = await login(credentials);
      await setSession(data.accessToken);
      return data;
    },
  });
}
