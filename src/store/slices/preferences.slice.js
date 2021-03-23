import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  locale: "en",
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setUserLocale(state, action){
      state.locale = action.payload;
    }
  }
});

const {actions, reducer} = preferencesSlice;

export const { 
  setUserLocale,
} = actions;
export default reducer;