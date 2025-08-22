// src/app/components/user-list.tsx
"use client";

import { deleteUser } from "@/app/actions/user-actions";
import { User } from "@/app/types/user";

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser(id);
    }
  };

  if (users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <div className="user-list">
      {users.map((user) => (
        <div key={user.id} className="user-card">
          <div className="user-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <small>
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </small>
          </div>
          <button
            onClick={() => handleDelete(user.id)}
            className="delete-button"
            aria-label={`Delete user ${user.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
