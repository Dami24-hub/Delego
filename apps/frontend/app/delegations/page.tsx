"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Delegation } from "@delegolabs/types";
import { Button } from "@delegolabs/ui";
import { useDelegations } from "../../hooks/useDelegations";
import { useWallet } from "../../hooks/useWallet";
import { useNetworkMismatch } from "../../hooks/useNetworkMismatch";
import { useQueryParamState } from "../../hooks/useQueryParamState";
import { useAnnounce } from "../../hooks/useAnnounce";
import { DelegationWizard } from "../../components/delegations/DelegationWizard";
import { DelegationFilters } from "../../components/delegations/DelegationFilters";
import { DelegationList } from "../../components/delegations/DelegationList";
import { NotificationPermissionPrompt } from "../../components/notifications/NotificationPermissionPrompt";
import { CopyViewLinkButton } from "../../components/filters/CopyViewLinkButton";
import { OPEN_DELEGATION_FORM_KEY } from "../../lib/delegationFormIntent";