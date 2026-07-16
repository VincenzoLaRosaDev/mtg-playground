import { SyncSource, SyncStatus } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";

/** Weekly EDHREC jobs that must stay fresh for browse + detail. */
const EDHREC_JOBS = ["commanders_hot", "cards_hot", "top_lists"] as const;

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
    take: 40,
  });

  const latestByJob = new Map<string, (typeof logs)[number]>();
  const latestSuccessByJob = new Map<string, Date>();

  for (const log of logs) {
    if (!latestByJob.has(log.jobType)) {
      latestByJob.set(log.jobType, log);
    }
    if (
      log.status === SyncStatus.SUCCESS &&
      log.completedAt &&
      !latestSuccessByJob.has(log.jobType)
    ) {
      latestSuccessByJob.set(log.jobType, log.completedAt);
    }
  }

  const hasRecentFailure = [...latestByJob.values()].some(
    (log) => log.status === SyncStatus.FAILED,
  );

  // Stale if any watched job has never succeeded or is older than the threshold.
  const isStale = EDHREC_JOBS.some((jobType) => {
    const successAt = latestSuccessByJob.get(jobType);
    return !successAt || daysSince(successAt) > STALE_AFTER_DAYS;
  });

  const successDates = [...latestSuccessByJob.values()];
  const lastSuccessAt =
    successDates.length > 0
      ? successDates.reduce((latest, date) => (date > latest ? date : latest))
      : null;

  const showNotice = hasRecentFailure || isStale;

  return {
    showNotice,
    lastSuccessAt,
    hasRecentFailure,
    isStale,
  };
}
