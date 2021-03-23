import firebaseApi from 'firebaseApi.js';

export const FIREBASE_RESPONSE = {
  EMAIL_IN_USE: 'auth/email-already-exists',
  EMAIL_INVALID: 'auth/invalid-email',
  EMAIL_NOT_FOUND: 'auth/user-not-found',
  PASSWORD_INVALID: 'auth/wrong-password',
  USER_DISABLED: 'auth/user-disabled',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  EXPIRED_ACTION_CODE: 'auth/expired-action-code',
  INVALID_ACTION_CODE: 'auth/invalid-action-code',
  QUOTA_EXCEEDED_STORAGE: 'storage/quota-exceeded',
  UNAUTHENTICATED_STORAGE: 'storage/unauthenticated',
  UNAUTHORIZED_STORAGE: 'storage/unauthorized',
};

export const firebaseError = (error, locale) => {
  return error;
};
export const uiConfig = (onSignInSuccessHandler, onSignInFailHandler) => {
  return {
    callbacks: {
      signInSuccessWithAuthResult: onSignInSuccessHandler,
      signInFailure: onSignInFailHandler,
    },
    signInFlow: 'popup',
    signInSuccessUrl: '/home',
    signInOptions: [
      {
        provider: firebaseApi.auth.GoogleAuthProvider.PROVIDER_ID,
        fullLabel: 'Continue with Google',
        scopes: [
          'https://www.googleapis.com/auth/user.addresses.read',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      },
      // {
      //   provider: firebaseApi.auth.FacebookAuthProvider.PROVIDER_ID,
      //   fullLabel: 'Continue with Facebook',
      //   scopes: ['email'],
      // },
      // { provider: 'microsoft.com', fullLabel: 'Continue with Microsoft' },
    ],
  };
};
