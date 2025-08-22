// src/app/page.tsx
import { getUsers } from "./actions/user-actions";
import UserForm from "@/components/user/user-form";
import UserList from "@/components/user/user-list";
import { User } from "./types/user";

export default async function Home() {
  const users: User[] = await getUsers();

  return (
    <div className="container">
      <h1>Next.js App Router with Prisma</h1>
      <p>Server Actions + PostgreSQL + Prisma ORM</p>

      <div className="grid">
        <div>
          <h2>Add New User</h2>
          <UserForm />
        </div>

        <div>
          <h2>Users</h2>
          <UserList users={users} />
        </div>
      </div>

      <div className="instructions">
        <h3>Setup Instructions:</h3>
        <ol>
          <li>
            Install PostgreSQL: <code>brew install postgresql</code>
          </li>
          <li>
            Start PostgreSQL: <code>brew services start postgresql</code>
          </li>
          <li>
            Create database: <code>createdb nextjs_app_router</code>
          </li>
          <li>
            Install dependencies: <code>npm install @prisma/client</code> and{" "}
            <code>npm install prisma --save-dev</code>
          </li>
          <li>
            Initialize Prisma: <code>npx prisma init</code>
          </li>
          <li>Configure DATABASE_URL in .env file</li>
          <li>
            Run migrations: <code>npx prisma migrate dev --name init</code>
          </li>
          <li>
            Generate Prisma Client: <code>npx prisma generate</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
