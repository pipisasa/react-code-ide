import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import { verifyAuth } from 'store/slices/auth.slice';
import { rootReducer } from './reducer';

const confStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
  });
  store.dispatch(verifyAuth());
  const persistor = persistStore(store);
  return { store, persistor };
};

export default confStore;