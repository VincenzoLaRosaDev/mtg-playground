"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";

/**
 * Registers the collection page so successful modal adds close the sheet
 * and let the collection list act as feedback.
 */
export function CollectionCardDetailWorkspace() {
  const router = useRouter();
  const { setCollectionWorkspace } = useCardDetailModal();

  useEffect(() => {
    setCollectionWorkspace({
      onCollectionMutated: () => router.refresh(),
    });
    return () => setCollectionWorkspace(null);
  }, [router, setCollectionWorkspace]);

  return null;
}
