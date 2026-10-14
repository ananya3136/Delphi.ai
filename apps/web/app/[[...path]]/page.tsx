import { Launchpad } from "@/components/launchpad";
import { Landing } from "@/components/landing";

export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return !path?.length ? <Landing /> : <Launchpad />;
}
