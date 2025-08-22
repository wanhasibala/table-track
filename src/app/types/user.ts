// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export type UserFormData = Omit<User, "id" | "created_at">;
