import { api } from "./client";
import type { UserWithProfile } from "@/types";

export const getUsers = () =>
  api.get<UserWithProfile[]>("/users").then((res) => res.data);
