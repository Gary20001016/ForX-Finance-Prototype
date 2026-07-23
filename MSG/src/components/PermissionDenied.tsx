import { Button, Result } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";

export default function PermissionDenied({
  description = "当前账号没有该页面的读取权限，请联系超级管理员配置。",
}: {
  description?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="surface permission-denied">
      <Result
        status="403"
        title="无权访问"
        subTitle={description}
        extra={
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            返回工作台
          </Button>
        }
      />
    </div>
  );
}
