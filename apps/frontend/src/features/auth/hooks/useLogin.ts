import { useMutation } from '@tanstack/react-query';
import type { LoginRequest } from '@home-owners-hub/shared-types';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const { login: setSession } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      setSession(data.accessToken);
    },
  });
}
