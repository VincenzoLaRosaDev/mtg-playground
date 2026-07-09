import { SyncSource, SyncStatus } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";

const EDHREC_JOBS = ["commanders_hot", "cards_hot"] as const;
const STALE_AFTER_DAYS = 8;

export type EdhrecSyncHealth = {
  showNotice: boolean;
  lastSuccessAt: Date | null;
  hasRecentFailure: boolean;
  isStale: boolean;
};

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export async function getEdhrecSyncHealth(): Promise<EdhrecSyncHealth> {
  const logs = await prisma.syncLog.findMany({
    where: {
      source: SyncSource.EDHREC,
      jobType: { in: [...EDHREC_JOBS] },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  const latestByJob = new Map<string, (typeof logs)[number]>();

  for (const log of logs) {
    if (!latestByJob.has(log.jobType)) {
      latestByJob.set(log.jobType, log);
    }
  }

  const hasRecentFailure = [...latestByJob.values()].some(
    (log) => log.status === SyncStatus.FAILED,
  );

  const successLogs = logs.filter((log) => log.status === SyncStatus.SUCCESS && log.completedAt);
  const lastSuccessAt =
    successLogs.length > 0
      ? successLogs.reduce(
          (latest, log) =>
            log.completedAt && (!latest || log.completedAt > latest) ? log.completedAt : latest,
          null as Date | null,
        )
      : null;

  const isStale = lastSuccessAt ? daysSince(lastSuccessAt) > STALE_AFTER_DAYS : true;
  const showNotice = hasRecentFailure || isStale;

  return {
    showNotice,
    lastSuccessAt,
    hasRecentFailure,
    isStale,
  };
}
