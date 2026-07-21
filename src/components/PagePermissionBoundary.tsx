import { createContext, useContext, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { permissionForLocation } from "../app/routePermissions";
import {
  canReadPage,
  canWritePage,
  hasAnySettingsReadAccess,
  type PagePermissionKey,
} from "../domain/pagePermissions";
import { CURRENT_REVIEW_OPERATOR_ID } from "../domain/reviewOperators";
import { usePrototypeStore } from "../store/prototypeStore";
import PermissionDenied from "./PermissionDenied";

interface CurrentPagePermission {
  permissionKey?: PagePermissionKey;
  canRead: boolean;
  canWrite: boolean;
}

const PagePermissionContext = createContext<CurrentPagePermission>({
  canRead: true,
  canWrite: true,
});

export const useCurrentPagePermission = () =>
  useContext(PagePermissionContext);

export default function PagePermissionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const store = usePrototypeStore();
  const location = useLocation();
  const operator = store.operators.find(
    (candidate) => candidate.id === CURRENT_REVIEW_OPERATOR_ID,
  );
  const routePermission = permissionForLocation(
    location.pathname,
    location.search,
  );

  if (!operator?.enabled) {
    return <PermissionDenied description="当前操作者不存在或账号已停用。" />;
  }

  if (routePermission.kind === "multilingual-review") {
    const authorized = store.languageReviewPolicies.some(
      (policy) =>
        policy.enabled && policy.authorizedReviewerIds.includes(operator.id),
    );
    if (!authorized) {
      return (
        <PermissionDenied description="当前账号未被授权审核任何语言。" />
      );
    }
    return (
      <PagePermissionContext.Provider
        value={{ canRead: true, canWrite: true }}
      >
        {children}
      </PagePermissionContext.Provider>
    );
  }

  if (routePermission.kind === "operator-permissions") {
    if (!operator.isSuperAdmin) return <PermissionDenied />;
    return (
      <PagePermissionContext.Provider
        value={{ canRead: true, canWrite: true }}
      >
        {children}
      </PagePermissionContext.Provider>
    );
  }

  if (routePermission.kind === "settings-root") {
    if (!operator.isSuperAdmin && !hasAnySettingsReadAccess(operator)) {
      return <PermissionDenied />;
    }
    return (
      <PagePermissionContext.Provider
        value={{ canRead: true, canWrite: operator.isSuperAdmin }}
      >
        {children}
      </PagePermissionContext.Provider>
    );
  }

  const canRead = canReadPage(operator, routePermission.key);
  const canWrite = canWritePage(operator, routePermission.key);
  if (!canRead || (routePermission.writeRequired && !canWrite)) {
    return (
      <PermissionDenied
        description={
          routePermission.writeRequired && canRead
            ? "当前账号只有读取权限，不能直接进入新建或编辑页面。"
            : undefined
        }
      />
    );
  }

  return (
    <PagePermissionContext.Provider
      value={{ permissionKey: routePermission.key, canRead, canWrite }}
    >
      {children}
    </PagePermissionContext.Provider>
  );
}
