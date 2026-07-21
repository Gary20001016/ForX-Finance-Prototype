import {
  Button,
  Tooltip,
  type ButtonProps,
} from "@arco-design/web-react";
import { useCurrentPagePermission } from "./PagePermissionBoundary";

export default function WritePermissionButton({
  disabled,
  ...props
}: ButtonProps) {
  const { canWrite } = useCurrentPagePermission();
  const permissionDisabled = !canWrite;
  const button = (
    <Button {...props} disabled={permissionDisabled || disabled} />
  );
  if (!permissionDisabled) return button;
  return (
    <Tooltip content="当前账号无写权限">
      <span className="permission-button-wrap">{button}</span>
    </Tooltip>
  );
}
