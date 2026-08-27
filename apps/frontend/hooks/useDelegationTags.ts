"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadDelegationTags,
  setDelegationTag as setTagInStorage,
  type DelegationTagRecord,
  type DelegationTagsMap,
} from "../lib/delegationTags";

const STORAGE_KEY = "delego_delegation_tags";

export function useDelegationTags() {
  const [tags, setTags] = useState<DelegationTagsMap>({});

  useEffect(() => {
    setTags(loadDelegationTags());
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setTags(loadDelegationTags());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateTag = useCallback(
    (delegationId: string, record: DelegationTagRecord) => {
      const updated = setTagInStorage(delegationId, record);
      setTags(updated);
    },
    []
  );

  const getTag = useCallback(
    (delegationId: string): DelegationTagRecord | undefined => {
      return tags[delegationId];
    },
    [tags]
  );

  return {
    tags,
    updateTag,
    getTag,
  };
}
