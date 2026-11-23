import { redirect } from "next/navigation";
import { listMyProjects } from "@/lib/data/projects";

export default async function AppIndexPage() {
  const projects = await listMyProjects();
  if (projects.length === 0) redirect("/onboarding");
  redirect(`/app/${projects[0].slug}/overview`);
}
