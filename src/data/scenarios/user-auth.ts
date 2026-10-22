import type { ScenarioBundle } from '../types'

export const userAuth: ScenarioBundle = {
  meta: {
    id: 'user-auth',
    label: 'Login & sessions',
    blurb: 'Let users sign up and log in safely, and remember who they are on every request.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'au-challenge',
      type: 'challenge',
      title: 'Secure sign-up, login, and sessions',
      summary:
        'Users create accounts with email and password, log in from web and phone, and stay logged in. A database leak must not expose their passwords.',
      scenario: 'user-auth',
      tags: ['auth', 'security', 'fundamentals'],
      requirements: [
        'Passwords never stored in readable form',
        'Every request knows who the user is',
        'Users can log out everywhere',
      ],
      scaleHint: '~2M users · ~20k logins/hour peak',
    },
    {
      id: 'au-solution-hashing',
      type: 'solution',
      title: 'Slow password hashing with salt',
      summary:
        'Store only a hash made with a slow algorithm (bcrypt, scrypt, Argon2) and a random salt per user. Login hashes the attempt and compares.',
      scenario: 'user-auth',
      tags: ['hashing', 'passwords'],
      requirements: ['Never use fast hashes like MD5/SHA-1 for passwords', 'Tune cost as hardware improves'],
      whenToUse: 'Always, for any stored password.',
    },
    {
      id: 'au-solution-session',
      type: 'solution',
      title: 'Server-side sessions',
      summary:
        'After login, create a random session id stored in a database/Redis and send it in a secure, HttpOnly cookie. Logout deletes the row.',
      scenario: 'user-auth',
      tags: ['sessions', 'cookies'],
      requirements: ['Secure + HttpOnly + SameSite cookie', 'Session expiry'],
      whenToUse: 'Web apps; easiest to revoke.',
      tradeoffs: ['A lookup on every request'],
    },
    {
      id: 'au-solution-token',
      type: 'solution',
      title: 'Signed tokens (JWT) + refresh tokens',
      summary:
        'Give a short-lived signed access token (~15 min) that servers verify without a database lookup, plus a long-lived refresh token to get new ones.',
      scenario: 'user-auth',
      tags: ['jwt', 'tokens', 'stateless'],
      requirements: ['Short access-token lifetime', 'Refresh tokens stored and revocable'],
      whenToUse: 'Mobile apps and many services verifying the same user.',
      tradeoffs: ['Cannot instantly revoke an access token before it expires'],
    },
    {
      id: 'au-solution-mfa',
      type: 'solution',
      title: 'Multi-factor authentication',
      summary:
        'Require a second proof (authenticator app code, passkey) so a stolen password alone is not enough.',
      scenario: 'user-auth',
      tags: ['mfa', 'security'],
      requirements: ['Recovery codes', 'Remember trusted devices'],
      whenToUse: 'Accounts with money, personal data, or admin rights.',
    },
    {
      id: 'au-blocker-stuffing',
      type: 'blocker',
      title: 'Credential stuffing',
      summary:
        'Attackers try millions of email/password pairs leaked from other sites against your login.',
      scenario: 'user-auth',
      tags: ['rate-limit', 'abuse'],
      requirements: ['Rate limit per IP and per account', 'Check against known-breached passwords'],
    },
    {
      id: 'au-blocker-reset',
      type: 'blocker',
      title: 'Password reset becomes the weak spot',
      summary:
        'Guessable reset links or links that never expire let attackers take over accounts.',
      scenario: 'user-auth',
      tags: ['security', 'account-recovery'],
      requirements: ['Random single-use tokens', 'Expire in ~30 min', 'Log out other sessions after reset'],
    },
    {
      id: 'au-blocker-revoke',
      type: 'blocker',
      title: 'Cannot kick out a stolen token',
      summary:
        'A stolen JWT stays valid until it expires, even after the user changes their password.',
      scenario: 'user-auth',
      tags: ['jwt', 'revocation'],
      requirements: ['Keep access tokens short-lived', 'Deny-list for emergencies'],
    },
  ],
  edges: [
    { id: 'e-au-1', source: 'au-challenge', target: 'au-solution-hashing', relation: 'addresses' },
    { id: 'e-au-2', source: 'au-challenge', target: 'au-solution-session', relation: 'addresses' },
    { id: 'e-au-3', source: 'au-challenge', target: 'au-solution-token', relation: 'addresses' },
    { id: 'e-au-4', source: 'au-solution-session', target: 'au-solution-token', relation: 'trades_off_with' },
    { id: 'e-au-5', source: 'au-solution-hashing', target: 'au-solution-mfa', relation: 'enables' },
    { id: 'e-au-6', source: 'au-solution-hashing', target: 'au-blocker-stuffing', relation: 'blocked_by' },
    { id: 'e-au-7', source: 'au-solution-mfa', target: 'au-blocker-stuffing', relation: 'addresses' },
    { id: 'e-au-8', source: 'au-challenge', target: 'au-blocker-reset', relation: 'blocked_by' },
    { id: 'e-au-9', source: 'au-solution-token', target: 'au-blocker-revoke', relation: 'blocked_by' },
  ],
}
