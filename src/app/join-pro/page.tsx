import { redirect } from "next/navigation";

export default function JoinProRedirectPage() {
  redirect("/auth/register?role=PROFESSIONAL");
}
