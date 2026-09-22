import { appstraxAuth, AuthStatus } from '@appstrax/services/auth';

const POLL_MS = 50;

export const MAX_AUTH_READY_WAIT_MS = 15_000;

export async function waitForAuthReady(): Promise<void> {
  const deadline = Date.now() + MAX_AUTH_READY_WAIT_MS;

  while (Date.now() < deadline) {
    const status = await appstraxAuth.getAuthStatus();
    if (
      status !== AuthStatus.initializing &&
      !appstraxAuth.isSessionUnconfirmed()
    ) {
      return;
    }
    await sleep(POLL_MS);
  }
}

export async function isAuthenticatedAfterReady(): Promise<boolean> {
  await waitForAuthReady();
  return appstraxAuth.isAuthenticated();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
