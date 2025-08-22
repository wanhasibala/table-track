// src/app/components/user-form.tsx
"use client";

import { useActionState } from "react";
import { createUser } from "@/app/actions/user-actions";

const initialState = {
  name: "",
  email: "",
};

export default function UserForm() {
  const [state, formAction] = useActionState(createUser, initialState);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    await createUser({});
  };

  return (
    <form action={formAction} className="form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Enter name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="Enter email"
        />
      </div>

      <button type="submit" className="button" onClick={handleSubmit}>
        Add User
      </button>

      {state.message && <p className="message">{state.message}</p>}
    </form>
  );
}
