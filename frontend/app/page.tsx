import { redirect } from "next/navigation";

// Root redirects to login by default
export default function Home() {
  redirect("/login");
}
