import { AuthErrors, AuthStatus } from '@appstrax/services/auth';

import { AuthErrorUtil } from './auth-error.util';

const SSO_DOMAIN_NOT_ALLOWED_MESSAGE =
  'This Google account is not allowed for this app. Sign in with your work account.';
const SSO_REQUIRED_MESSAGE = 'This account must sign in with Google SSO.';

describe('AuthErrorUtil', () => {
  let util: AuthErrorUtil;

  beforeEach(() => {
    util = new AuthErrorUtil();
  });

  it('maps SSO domain restriction to readable copy', () => {
    expect(util.getMessage('sso_account_domain_not_allowed')).toBe(
      SSO_DOMAIN_NOT_ALLOWED_MESSAGE,
    );
  });

  it('maps ssoRequired to Google SSO guidance', () => {
    expect(util.getMessage('ssoRequired')).toBe(SSO_REQUIRED_MESSAGE);
  });

  it('maps password login errors from AuthErrors', () => {
    expect(util.getMessage(AuthErrors.invalidEmailOrPassword)).toBe(
      'Invalid Email Or Password',
    );
  });

  it('maps OAuth user cancellation', () => {
    expect(util.getMessage('access_denied')).toContain('cancelled');
  });

  it('maps oauth_failed', () => {
    expect(util.getMessage(new Error('oauth_failed'))).toContain('could not be completed');
  });

  it('maps pending 2FA status from login result throws', () => {
    expect(util.getMessage(new Error(AuthStatus.pendingTwoFactorAuthCode))).toContain(
      'authenticator',
    );
  });

  it('hides unknown machine codes behind a generic sign-in message', () => {
    const message = util.getMessage('some_future_api_code');
    expect(message).not.toContain('some_future_api_code');
    expect(message).toContain('Something went wrong');
  });

  it('passes through SDK messages that are already human-readable', () => {
    const sdkMessage =
      'This SSO sign-in could not be completed because the browser did not keep the sign-in state. Please sign in again.';
    expect(util.getMessage(new Error(sdkMessage))).toBe(sdkMessage);
  });

  it('reads nested API error shapes', () => {
    expect(util.getMessage({ error: { message: 'ssoRequired' } })).toBe(
      SSO_REQUIRED_MESSAGE,
    );
  });
});
