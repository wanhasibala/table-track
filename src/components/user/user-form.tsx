// src/app/components/user-form.tsx
"use client";

import { prisma } from "@/lib/db";
import React from "react";
import { Button } from "../ui/button";

export default function UserForm() {
  const handleSubmit = React.useCallback(async ({}) => {
    try {
      await prisma.user.create({
        data: {
          name: "asoy",
          email: "asoy2@gmail.com",
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }, []);
  return (
    <form className="form">
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

      <Button type="submit" className="button" onClick={handleSubmit}>
        Add User
      </Button>
    </form>
  );
}
