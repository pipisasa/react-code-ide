import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

function Layout({loginPage: LoginPage, children}) {
  const { id } = useSelector(
    state => ({
      id: state.auth.userData.id
    }),
    shallowEqual
  );

  if(!id) return (
    <LoginPage/>
  );

  return children;
}

export default Layout
