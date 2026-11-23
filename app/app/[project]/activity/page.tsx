import type { Metadata } from "next";
import { Suspense } from "react";
import { requireProjectAccess } from "@/lib/auth";
import { listActivity } from "@/lib/data/activity";
import { PageHeader, PageBody } from "@/components/page-header";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { FeedSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: slug } = await params;
  return (
    <>
      <PageHeader
        title="Activity"
        description="GitHub and Forge events, newest first."
      />
      <PageBody className="max-w-3xl">
        <Suspense fallback={<FeedSkeleton rows={12} />}>
          <Feed slug={slug} />
        </Suspense>
      </PageBody>
    </>
  );
}

async function Feed({ slug }: { slug: string }) {
  const { project } = await requireProjectAccess(slug);
  const items = await listActivity(project.id, 80);
  return <ActivityFeed items={items} projectSlug={slug} />;
}
