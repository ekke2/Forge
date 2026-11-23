import { redirect } from "next/navigation";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  redirect(`/app/${project}/overview`);
}
