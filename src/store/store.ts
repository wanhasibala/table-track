import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './services/authApi';
import { api } from './services/flexible-querry';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      api.middleware // Fixed the variable name here
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;