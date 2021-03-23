import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { reducer as toastrReducer } from 'react-redux-toastr';
import preferencesReducer from './slices/preferences.slice';
import authReducer from './slices/auth.slice';
import usersReducer from './slices/users.slice';

// export const rootReducer = combineReducers({
//   preferences: preferencesReducer,
//   auth: authReducer,
//   users: usersReducer
// });

export const rootReducer = combineReducers({
  auth: persistReducer(
    {
      key: 'auth',
      storage,
      blacklist: ['error', 'loading'],
    },
    authReducer
  ),
  preferences: persistReducer(
    { key: 'preferences', storage },
    preferencesReducer
  ),
  users: persistReducer(
    {
      key: 'users',
      storage,
      blacklist: ['error', 'loading'],
    },
    usersReducer
  ),
  toastr: toastrReducer,
});
