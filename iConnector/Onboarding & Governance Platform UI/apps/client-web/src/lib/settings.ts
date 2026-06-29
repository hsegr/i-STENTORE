import type { ResolvedRequest } from "@dataspace-onboarding/shared";
import { getRequestsForOwner } from "@/lib/governance";

export interface OrganisationSettings {
  accountId: string;
  organizationName: string;
  website: string;
  contactEmail: string;
  country: string;
  did: string;
}

const STORAGE_KEY = "wf.organisation-settings.v1";

function loadAllSettings(): Record<string, OrganisationSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OrganisationSettings>) : {};
  } catch {
    return {};
  }
}

function saveAllSettings(settings: Record<string, OrganisationSettings>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getLatestOnboardingRequest(ownerId: string): ResolvedRequest | undefined {
  const requests = getRequestsForOwner(ownerId);
  return requests.resolved.find((request) => request.status === "accepted") ?? requests.resolved[0];
}

export function getOrganisationSettings(accountId: string): OrganisationSettings {
  const allSettings = loadAllSettings();
  const existing = allSettings[accountId];
  const onboardingRequest = getLatestOnboardingRequest(accountId);

  return {
    accountId,
    organizationName:
      existing?.organizationName ||
      onboardingRequest?.participantProfile?.organizationName ||
      onboardingRequest?.organizationName ||
      "",
    website: existing?.website || onboardingRequest?.participantProfile?.website || "",
    contactEmail: existing?.contactEmail || onboardingRequest?.participantProfile?.contactEmail || accountId,
    country: existing?.country || onboardingRequest?.participantProfile?.country || "",
    did: existing?.did || onboardingRequest?.did || "",
  };
}

export function saveOrganisationSettings(settings: OrganisationSettings): OrganisationSettings {
  const allSettings = loadAllSettings();
  allSettings[settings.accountId] = settings;
  saveAllSettings(allSettings);
  return settings;
}
