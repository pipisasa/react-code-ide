import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toastr } from 'react-redux-toastr';
import { firebaseError, FIREBASE_RESPONSE } from 'utils';
import { fetchDocument, createDocument } from '../api';
import { clearUsersDataLogout } from './users.slice';// TODO
import firebaseApi from '../../firebaseApi';

export const logout = createAsyncThunk(
  'auth/logout',
  async (_,{ dispatch })=>{
    try {
      dispatch(clearUsersDataLogout());// TODO
      await firebaseApi.auth().signOut();
      return null;
    } catch (e) {
      dispatch(authError(e));
      return null;
    }
  }
);

export const verifyAuth = createAsyncThunk(
  'auth/verifyAuth',
  async (_, {dispatch}) => new Promise((res, rej)=>{
    firebaseApi.auth().onAuthStateChanged((user) => {
      dispatch(authRestoreSessionInit());

      if (user !== null) {
        return res(true);
      }
      rej(user);
      return dispatch(logout());
    });
  })
);

export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (_, { dispatch, rejectWithValue })=>{
    const { uid } = firebaseApi.auth().currentUser;
    let user;
    try {
      user = await fetchDocument('users', uid);
    } catch (e) {
      dispatch(logout());
      return rejectWithValue(e);
    }
    if (!user) return dispatch(logout());
    return {id: uid, ...user};
  }
);

export const checkUserData = createAsyncThunk(
  'auth/checkUserData',
  (_, {dispatch, getState})=>{
    const { id } = getState().auth.userData;
    if(!id){
      dispatch(fetchUserData());
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({email, password}, { dispatch, getState, rejectWithValue })=>{
    const { locale } = getState().preferences;
    try {
      await firebaseApi.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      // console.log(error);
      return rejectWithValue(errorMessage);
    }

    const { emailVerified } = firebaseApi.auth().currentUser;

    if (!emailVerified) {
      const errorMessage = firebaseError(
        FIREBASE_RESPONSE.USER_DISABLED,
        locale
      );
      return rejectWithValue(errorMessage);
    }

    return dispatch(fetchUserData());
  }
);

export const setPassword = createAsyncThunk(
  'auth/setPassword',
  async ({email, password, url}, {dispatch, getState, rejectWithValue})=>{
    const { locale } = getState().preferences;
    try {
      await firebaseApi.auth().signInWithEmailLink(email, url);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      return rejectWithValue(errorMessage);
    }
    const user = firebaseApi.auth().currentUser;
    try {
      await user.updatePassword(password);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      return rejectWithValue(errorMessage);
    }
    dispatch(fetchUserData());
    return null;
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, {getState, rejectWithValue})=>{
    const { locale } = getState().preferences;
    try {
      await firebaseApi.auth().sendPasswordResetEmail(email);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      rejectWithValue(errorMessage);
    }
    return null;
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async ({currentPassword, newPassword}, { getState, rejectWithValue })=>{
    const { locale } = getState().preferences;
    const user = firebaseApi.auth().currentUser;
    const { email } = user;
    const credential = firebaseApi.auth.EmailAuthProvider.credential(
      email,
      currentPassword
    );
    try {
      await user.reauthenticateWithCredential(credential);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }
    try {
      await user.updatePassword(newPassword);
    } catch (error) {
      const errorMessage = firebaseError(error, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }
    toastr.success('', 'Password changed successfully');
    return null;
  }
);

export const authWithSocialMedia = createAsyncThunk(
  'auth/authWithSocialMedia',
  async (authResult, { getState, rejectWithValue })=>{
    const { locale } = getState().preferences;
    const { user, additionalUserInfo } = authResult;
    const { isNewUser, profile } = additionalUserInfo;
    const { uid, photoURL, email, displayName } = user;

    const { location } = profile;

    const userData = {
      isAdmin: false,
      email,
      name: displayName,
      createdAt: new Date().toString(),
      logoUrl: photoURL,
      location: location?.name || null,
    };

    let userFromDb = {};
    if (isNewUser) {
      try {
        await createDocument('users', uid, userData);
      } catch (e) {
        const errorMessage = firebaseError(e.code, locale);
        return rejectWithValue(errorMessage);
      }
    } else {
      try {
        userFromDb = await fetchDocument('users', uid);
      } catch (error) {
        const errorMessage = firebaseError(error.code, locale);
        return rejectWithValue(errorMessage);
      }
    }

    return { id: uid, ...userData, ...userFromDb };
  }
);

const initialState = {
  userData: {
    id: null,
    isAdmin: null
  },
  loading: false,
  error: null,
  restoring: false,
  restoringError: null,
  restoredPassword: false,
  changedPassword: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authError(state, action){
      state.error = action.payload;
      state.loading = false;
    },
    authRestoreSessionInit(state){
      state.restoring = true;
    },
    authCleanUp(state){
      state.error = null;
      state.changedPassword = false;
    },
    authUpdateUserData(state, { payload }){
      state.userData = {
        id: payload.id,
        email: state.userData.email,
        isAdmin: payload.isAdmin,
        name: payload.name,
        location: payload.location,
        logoUrl: payload.logoUrl || state.userData.logoUrl,
        createdAt: payload.createdAt
      };
    }
  },
  extraReducers: {
    [logout.pending]: ()=>({...initialState}),
    [logout.fulfilled]: (state)=>({...state}),

    [verifyAuth.fulfilled]: (state)=>{
      state.restoring = false;
      state.restoringError = null;
    },
    [verifyAuth.rejected]: (state)=>{
      state.restoring = false;
      state.restoringError = true;
    },

    [fetchUserData.pending]: (state)=>{
      state.loading = true;
    },
    [fetchUserData.fulfilled]: (state, {payload})=>{
      state.userData = {
        id: payload.id,
        isAdmin: payload.isAdmin,
        email: payload.email,
        name: payload.name,
        location: payload.location,
        logoUrl: payload.logoUrl,
        createdAt: payload.createdAt
      };
      state.loading = false;
      state.error = null;
    },
    [fetchUserData.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },

    [signIn.pending]: (state)=>{
      state.loading = true;
    },
    [signIn.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },

    [setPassword.pending]: (state)=>{
      state.loading = true;
    },
    [setPassword.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },
    [setPassword.fulfilled]: (state)=>{
      state.loading = false;
      state.error = null;
    },

    [resetPassword.pending]: (state)=>{
      state.loading = true;
    },
    [setPassword.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },
    [setPassword.fulfilled]: (state)=>{
      state.loading = false;
      state.error = null;
      state.restoredPassword = true;
    },

    [changeUserPassword.pending]: (state)=>{
      state.loading = true;
    },
    [changeUserPassword.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },
    [changeUserPassword.fulfilled]: (state)=>{
      state.loading = false;
      state.error = null;
      state.changedPassword = true;
    },

    [authWithSocialMedia.pending]: (state)=>{
      state.loading = true;
    },
    [authWithSocialMedia.rejected]: (state, action)=>{
      state.error = action.payload;
      state.loading = false;
    },
    [authWithSocialMedia.fulfilled]: (state, {payload})=>{
      state.loading = false;
      state.error = null;
      state.userData = {
        id: payload.id,
        isAdmin: payload.isAdmin,
        email: payload.email,
        name: payload.name,
        location: payload.location,
        logoUrl: payload.logoUrl,
        createdAt: payload.createdAt
      };
    },
  }
});

const {actions, reducer} = authSlice;

export const { 
  authError,
  authRestoreSessionInit,
  authCleanUp,
  authUpdateUserData,
} = actions;
export default reducer;