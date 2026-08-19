import { redirect } from "next/navigation";

export default function ProRegisterRedirectPage() {
  redirect("/auth/register?role=PROFESSIONAL");
}
