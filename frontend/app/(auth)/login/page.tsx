import { readFileSync } from "fs";
import { join } from "path";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const imagePath = join(process.cwd(), "public", "19728.jpg");
  const imageBuffer = readFileSync(imagePath);
  const imageSrc = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  return <LoginForm imageSrc={imageSrc} />;
}
