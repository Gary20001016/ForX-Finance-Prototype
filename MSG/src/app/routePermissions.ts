import {
  canReadPage,
  type PagePermissionKey,
  type PagePermissionSubject,
} from "../domain/pagePermissions";

export const settingsTabPermissionMap: Record<string, PagePermissionKey> = {
  categories: "settings.categories",
  links: "settings.links",
  "language-review": "settings.languageReview",
  "test-accounts": "settings.testAccounts",
  audit: "settings.audit",
};

export const settingsTabOrder = Object.keys(settingsTabPermissionMap);

export type RoutePermission =
  | { kind: "page"; key: PagePermissionKey; writeRequired?: boolean }
  | { kind: "settings-root" }
  | { kind: "operator-permissions" }
  | { kind: "multilingual-review" };

export const permissionForLocation = (
  pathname: string,
  search = "",
): RoutePermission => {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return { kind: "page", key: "dashboard" };
  }
  if (pathname.startsWith("/tasks/create")) {
    return { kind: "page", key: "manual.tasks", writeRequired: true };
  }
  if (pathname.startsWith("/tasks")) {
    return { kind: "page", key: "manual.tasks" };
  }
  if (pathname.startsWith("/templates")) {
    const scope = new URLSearchParams(search).get("scope");
    return {
      kind: "page",
      key: scope === "event" ? "event.templates" : "manual.templates",
    };
  }
  if (pathname.startsWith("/template-variables")) {
    return { kind: "page", key: "manual.variables" };
  }
  if (pathname.startsWith("/automation")) {
    return { kind: "page", key: "event.rules" };
  }
  if (pathname.startsWith("/events")) {
    return { kind: "page", key: "event.catalog" };
  }
  if (pathname.startsWith("/triggers")) {
    return { kind: "page", key: "event.triggers" };
  }
  if (pathname.startsWith("/multilingual-review")) {
    return { kind: "multilingual-review" };
  }
  if (pathname.startsWith("/approvals")) {
    return { kind: "page", key: "operations.approvals" };
  }
  if (pathname.startsWith("/deliveries")) {
    return { kind: "page", key: "operations.deliveries" };
  }
  if (pathname.startsWith("/analytics")) {
    return { kind: "page", key: "operations.analytics" };
  }
  if (pathname.startsWith("/segments")) {
    return { kind: "page", key: "audiences" };
  }
  if (pathname.startsWith("/settings")) {
    const tab = new URLSearchParams(search).get("tab");
    if (!tab) return { kind: "settings-root" };
    if (tab === "operator-permissions") {
      return { kind: "operator-permissions" };
    }
    const key = settingsTabPermissionMap[tab];
    return key ? { kind: "page", key } : { kind: "settings-root" };
  }
  return { kind: "page", key: "dashboard" };
};

export const firstReadableSettingsTab = (
  operator: PagePermissionSubject | undefined,
) =>
  settingsTabOrder.find((tab) =>
    canReadPage(operator, settingsTabPermissionMap[tab]),
  );

export const firstReadableSettingsPath = (
  operator: PagePermissionSubject | undefined,
) => {
  const tab = firstReadableSettingsTab(operator);
  return tab ? `/settings?tab=${tab}` : "/settings";
};
