// src/app/actions/user-actions.ts - Fixed version
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserFormData } from "@/app/types/user";

export async function createUser(formData: UserFormData) {
  try {
    // Fixed: The data object was incorrect
    await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
      },
    });

    console.log("User created successfully");
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user: " + (error as Error).message);
  }

  revalidatePath("/");
  redirect("/");
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users: " + (error as Error).message);
  }
}

export async function deleteUser(id: string) {
  try {
    // Fixed: ID needs to be converted to number if your schema uses Int
    await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Failed to delete user: " + (error as Error).message);
  }

  revalidatePath("/");
}
