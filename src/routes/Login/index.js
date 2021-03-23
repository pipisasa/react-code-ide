import React from 'react'
import firebaseApi from 'firebaseApi';
import { uiConfig } from 'utils';
import { toastr } from 'react-redux-toastr';

import {
  authWithSocialMedia,
} from 'store/slices/auth.slice';
import { useDispatch } from 'react-redux';
import { StyledFirebaseAuth } from 'react-firebaseui';

function Login() {

  const dispatch = useDispatch();

  const onSignInSuccessHandler = (authResult) => {
    dispatch(authWithSocialMedia(authResult));
  };

  const onSignInFailHandler = (signInEror) => {
    toastr.error('', signInEror.code);
  };

  return (
    <div>
      <StyledFirebaseAuth
        uiConfig={uiConfig(
          onSignInSuccessHandler,
          onSignInFailHandler
        )}
        firebaseAuth={firebaseApi.auth()}
      />
    </div>
  )
}

export default Login
