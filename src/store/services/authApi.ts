import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Type Definitions aligned with your payload inputs
interface LoginRequest {
  login: string; // Map this to your input form's email field
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: any;
  session: any;
}

interface UserAccountProfile {
  id: string;
  email: string;
  role: string;
  name: string;
  tenant_id: string | null;
}

export const authApi = createApi({
  reducerPath: "authApi",
  // Using fakeBaseQuery because we talk straight to the Supabase JS client SDK
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    
    // 1. LOGIN MUTATION
    login: builder.mutation<LoginResponse, LoginRequest>({
      async queryFn({ login, password }) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: login,
            password: password,
          });

          if (error) return { error: { status: "AUTH_ERROR", error: error.message } };

          return {
            data: {
              success: true,
              user: data.user,
              session: data.session,
            },
          };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
    }),

    // 2. GET USER ROLES / WORKSPACE PROFILE
    // Replaces legacy custom HTTP GET endpoint path matching your new multi-tenant layout
    getUserRoles: builder.query<UserAccountProfile, string>({
      async queryFn(userId) {
        try {
          const { data, error } = await supabase
            .from("user_account")
            .select("id, email, role, name, tenant_id")
            .eq("id", userId)
            .maybeSingle();

          if (error) return { error: { status: "SERVER_ERROR", error: error.message } };
          if (!data) return { error: { status: "NOT_FOUND", error: "User account profile missing." } };

          return { data };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
    }),

    // 3. LOGOUT MUTATION
    logout: builder.mutation<void, void>({
      async queryFn() {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) return { error: { status: "SIGNOUT_ERROR", error: error.message } };
          
          return { data: undefined };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetUserRolesQuery,
} = authApi;