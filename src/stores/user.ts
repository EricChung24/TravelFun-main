import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiUserCheckSignin, apiUserLogout, apiUserSignin, successMsg } from '@/utils/api';

export interface UserInfo {
  id: number
  username: string
  email: string
  full_name: string
  avatar?: string
  last_login?: string
  updated_at?: string
  balance?: number
}

const STORAGE_KEYS = {
  userInfo: 'userInfo',
  loginStatus: 'loginStatus',
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

export const useUserStore = defineStore('user', () => {
  const router = useRouter();
  const userInfo = ref<UserInfo | null>(null);
  const loginStatus = ref(false);
  const isLoading = ref(false);

  const displayName = computed(() => {
    return userInfo.value?.full_name || userInfo.value?.username || '';
  });

  const clearUserStateStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.userInfo);
    localStorage.removeItem(STORAGE_KEYS.loginStatus);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);

    sessionStorage.removeItem(STORAGE_KEYS.userInfo);
    sessionStorage.removeItem(STORAGE_KEYS.loginStatus);

    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  };

  const updateUserState = (user: UserInfo | null, status = true) => {
    userInfo.value = user;
    loginStatus.value = status;

    if (user && status) {
      const serializedUser = JSON.stringify(user);
      localStorage.setItem(STORAGE_KEYS.userInfo, serializedUser);
      localStorage.setItem(STORAGE_KEYS.loginStatus, 'true');
      sessionStorage.setItem(STORAGE_KEYS.userInfo, serializedUser);
      sessionStorage.setItem(STORAGE_KEYS.loginStatus, 'true');
      return;
    }

    clearUserStateStorage();
  };

  const initializeUserState = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) {
      updateUserState(null, false);
      return;
    }

    try {
      const response = await apiUserCheckSignin();
      if (response.data?.isAuthenticated && response.data?.user) {
        updateUserState(response.data.user, true);
        return;
      }
      updateUserState(null, false);
    }
    catch {
      updateUserState(null, false);
    }
  };

  const signin = async (data: { username: string; password: string; rememberMe?: boolean }) => {
    isLoading.value = true;

    try {
      const res = await apiUserSignin({
        username: data.username,
        password: data.password,
      });

      const responseData = res.data;
      if (!responseData?.success)
        return false;

      const expires = data.rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
        : '';

      document.cookie = `token=${responseData.data.token};path=/;expires=${expires}`;
      if (responseData.data.refresh)
        document.cookie = `refresh_token=${responseData.data.refresh};path=/;expires=${expires}`;

      updateUserState(responseData.data.user, true);
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }
    catch (error) {
      updateUserState(null, false);
      throw error;
    }
    finally {
      isLoading.value = false;
    }
  };

  const checkLoginStatus = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) {
      updateUserState(null, false);
      return false;
    }

    try {
      const response = await apiUserCheckSignin();
      const isAuthenticated = Boolean(response.data?.isAuthenticated);
      const user = response.data?.user as UserInfo | undefined;

      if (isAuthenticated && user) {
        updateUserState(user, true);
        return true;
      }

      updateUserState(null, false);
      return false;
    }
    catch {
      updateUserState(null, false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiUserLogout();
    }
    catch {
      // Clear local state even when API logout fails.
    }

    updateUserState(null, false);
    successMsg('已成功登出');
    router.push('/');
    return true;
  };

  void initializeUserState();

  return {
    userInfo,
    loginStatus,
    isLoading,
    displayName,
    signin,
    logout,
    checkLoginStatus,
    updateUserState,
  };
});
