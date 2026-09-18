import { appstraxAuth, AuthStatus } from '@appstrax/services/auth';

const POLL_MS = 50;

export async function waitForAuthReady(): Promise<void> {
  while (true) {
    const status = await appstraxAuth.getAuthStatus();
    if (status === AuthStatus.initializing || appstraxAuth.isSessionUnconfirmed()) {
      await sleep(POLL_MS);
      continue;
    }
    return;
  }
}

export async function isAuthenticatedAfterReady(): Promise<boolean> {
  await waitForAuthReady();
  return appstraxAuth.isAuthenticated();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
