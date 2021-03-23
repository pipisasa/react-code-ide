import { createSlice, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit';
import { toastr } from 'react-redux-toastr';
import { firebaseError } from 'utils';
import {
  fetchCollection,
  fetchDocument,
  createDocument,
  deleteDocument,
  updateDocument,
} from 'store/api';
import { checkUserData, authUpdateUserData } from './auth.slice';
import firebaseApi from '../../firebaseApi';

const usersAdapter = createEntityAdapter({
  // ? Keep the "all IDs" array sorted based on user emails
  sortComparer: (a, b) => a.email.localeCompare(b.email)
});
// const localUsersSelectors = usersAdapter.getSelectors();
export const usersSelectors = usersAdapter.getSelectors();

const getInitialState = () => usersAdapter.getInitialState({
  loading: false,
  error: null,
  success: false,
  deleted: false,
});


const deleteLogo = (oldLogo) => {
  if (!oldLogo.includes('firebasestorage')) {
    return null;
  }
  const logoPath = oldLogo.split('users%2F').pop().split('?alt=media').shift();
  return firebaseApi.storage().ref(`users/${logoPath}`).delete();
};


const uploadLogo = (uid, file) => {
  const storageRef = firebaseApi.storage().ref();

  const fileExtension = file.name.split('.').pop();

  const fileName = `${uid}.${fileExtension}`;

  return storageRef.child(`users/${fileName}`).put(file);
};

const getLogoUrl = (uid, file) => {
  const fileExtension = file.name.split('.').pop();

  const bucketUrl = `${process.env.REACT_APP_FIRE_BASE_STORAGE_API}`;

  return `${bucketUrl}/o/users%2F${uid}_200x200.${fileExtension}?alt=media`;
};


export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (userId = '', {dispatch, rejectWithValue, getState})=>{
    dispatch(checkUserData());
    if (userId) {
      let user;
      try {
        user = await fetchDocument('users', userId);
      } catch (error) {
        toastr.error('', error);
        return rejectWithValue(error);
      }

      if (!user) {
        const errorMessage = 'User not available';
        toastr.error('', errorMessage);
        return rejectWithValue(errorMessage);
      }

      // const users = getState().users.data;
      // users.push(user);
      usersAdapter.addOne(getState().users, user);
      const users = usersSelectors.selectAll(getState().users);
      return { data: users };
    }

    const { id } = getState().auth.userData;
    let users;
    try {
      users = await fetchCollection('users');
    } catch (error) {
      toastr.error('', error);
      return rejectWithValue(error);
    }

    return { data: users.filter((user) => user.id !== id) };
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, {rejectWithValue, getState})=>{
    const { locale } = getState().preferences;
    // const { logoUrl } = getState()
    //   .users.data.filter((user) => user.id === id)
    //   .pop();
    const { logoUrl } = usersSelectors.selectById(getState().users, id);

    const deleteLogoTask = logoUrl ? deleteLogo(logoUrl) : null;
    const deleteUserTask = deleteDocument('users', id);

    try {
      await Promise.all([deleteLogoTask, deleteUserTask]);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }
    toastr.success('', 'The user was deleted.');
    return { id };
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async ({
    name,
    email,
    location,
    file,
    createdAt,
    isAdmin,
  }, { getState, rejectWithValue })=>{
    const { locale } = getState().preferences;
    let response;
    try {
      const createUserAuth = firebaseApi
        .functions()
        .httpsCallable('httpsCreateUser');

      response = await createUserAuth({ email, isAdmin });
    } catch (error) {
      const errorMessage = firebaseError(error.message, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }
    const { uid } = response.data;
    let uploadLogoTask = null;
    let logoUrl = null;
    if (file) {
      logoUrl = getLogoUrl(uid, file);
      uploadLogoTask = uploadLogo(uid, file);
    }
    const userData = { name, email, location, logoUrl, createdAt, isAdmin };
    const createUserDbTask = createDocument('users', uid, userData);
    const actionCodeSettings = {
      url: process.env.REACT_APP_LOGIN_PAGE_URL,
      handleCodeInApp: true,
    };
    const sendSignInLinkToEmailTask = firebaseApi
      .auth()
      .sendSignInLinkToEmail(email, actionCodeSettings);
    try {
      await Promise.all([
        uploadLogoTask,
        createUserDbTask,
        sendSignInLinkToEmailTask,
      ]);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }

    toastr.success('', 'User created successfully');
    return { user: response.data };
  }
);

export const modifyUser = createAsyncThunk(
  'user/modifyUser',
  async ({
    name,
    location,
    isAdmin,
    file,
    createdAt,
    id,
    isEditing,
    isProfile,
  }, {dispatch, getState, rejectWithValue})=>{
    const { locale } = getState().preferences;
    const user = isProfile
      ? getState().auth.userData
      : usersSelectors.selectById(getState().users, id);
    const { logoUrl } = user;
    let deleteLogoTask;
    let uploadLogoTask;
    let newLogoUrl = null;
    if (file) {
      newLogoUrl = getLogoUrl(id, file);
      deleteLogoTask = logoUrl && deleteLogo(logoUrl);
      uploadLogoTask = uploadLogo(id, file);
    }
    const userData = {
      name,
      location,
      createdAt,
      isAdmin: isAdmin || user.isAdmin,
      logoUrl: logoUrl || newLogoUrl,
    };
    const updateUserDbTask = updateDocument('users', id, userData);
    try {
      await Promise.all([deleteLogoTask, uploadLogoTask, updateUserDbTask]);
    } catch (error) {
      const errorMessage = firebaseError(error.code, locale);
      toastr.error('', errorMessage);
      return rejectWithValue(errorMessage);
    }
    const { uid } = firebaseApi.auth().currentUser;
    if (id === uid) {
      dispatch(authUpdateUserData({ ...userData, id }));
    }
    if (isProfile) {
      toastr.success('', 'Profile updated successfully');
    } else if (isEditing) {
      toastr.success('', 'User updated successfully');
    }
    return { user: userData, id };
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: getInitialState(),
  reducers: {
    clearUsersDataLogout: () => getInitialState(),
    usersCleanUp(state){
      state.loading = false;
      state.error = null;
      state.success = false;
      state.deleted = false;
    }
  },
  extraReducers: {
    [fetchUsers.pending]: (state)=>{
      state.loading = true;
    },
    [fetchUsers.rejected]: (state, action)=>{
      state.loading = false;
      state.error = action.payload;
    },
    [fetchUsers.fulfilled]: (state, action)=>{
      usersAdapter.setAll(state, action.payload.data);
      state.loading = false;
      state.error = null;
    },

    [deleteUser.pending]: (state)=>{
      state.loading = true;
    },
    [deleteUser.rejected]: (state, action)=>{
      state.loading = false;
      state.error = action.payload;
    },
    [deleteUser.fulfilled]: (state, {payload})=>{
      usersAdapter.removeOne(state, payload.id);
      state.loading = false;
      state.error = null;
      state.deleted = true;
    },

    [createUser.pending]: (state)=>{
      state.loading = true;
    },
    [createUser.rejected]: (state, action)=>{
      state.loading = false;
      state.error = action.payload;
    },
    [createUser.fulfilled]:(state, { payload })=>{
      usersAdapter.addOne(state, payload.user);
      state.loading = false;
      state.error = null;
      state.success = true;
    },

    [modifyUser.pending]: (state)=>{
      state.loading = true;
    },
    [modifyUser.rejected]: (state, action)=>{
      state.loading = false;
      state.error = action.payload;
    },
    [modifyUser.fulfilled]: (state, { payload })=>{
      if(state.ids.length) return usersAdapter.getInitialState({
        loading: false,
        error: null,
        success: true,  //
        deleted: false,
      });
      usersAdapter.updateOne(state, {
        id: payload.id,
        name: payload.user.name,
        location: payload.user.location,
        logoUrl: payload.user.logoUrl,
        createdAt: payload.user.createdAt,
      });
      state.loading = false;
      state.error = null;
      state.success = true;
      return null;
    }
  }
});

const {actions, reducer} = usersSlice;

export const {
  clearUsersDataLogout,
  usersCleanUp,
} = actions;
export default reducer;