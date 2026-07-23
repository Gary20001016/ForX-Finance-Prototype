import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import {
  parseVariableCsv,
  VARIABLE_CSV_TEMPLATE,
  type VariableCsvError,
  type VariableCsvPreview,
} from "../../domain/manualMessageVariables";
import {
  importControlledVariables,
  usePrototypeStore,
} from "../../store/prototypeStore";

const readFileText = (file: File) => {
  if (typeof file.text === "function") return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("CSV 文件读取失败"));
    reader.readAsText(file, "UTF-8");
  });
};

const downloadTemplate = () => {
  const blob = new Blob(["\uFEFF", VARIABLE_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "template-variable-import.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default function VariableCsvImportModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const store = usePrototypeStore();
  const [fileName, setFileName] = useState<string>();
  const [preview, setPreview] = useState<VariableCsvPreview>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible) {
      setFileName(undefined);
      setPreview(undefined);
      setError(undefined);
    }
  }, [visible]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("请选择 CSV 文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("CSV 文件不能超过 10 MB");
      return;
    }
    try {
      const next = parseVariableCsv(
        await readFileText(file),
        store.templateVariables,
      );
      setFileName(file.name);
      setPreview(next);
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "CSV 解析失败");
    }
  };

  const errorColumns: TableColumnProps<VariableCsvError>[] = [
    { title: "行号", dataIndex: "row", width: 80 },
    { title: "变量名", dataIndex: "name" },
    { title: "错误原因", dataIndex: "reason" },
  ];

  return (
    <Modal
      title="CSV 导入模板变量"
      visible={visible}
      onCancel={onClose}
      footer={null}
      unmountOnExit
      style={{ width: 760 }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Alert
          type="info"
          content="CSV 仅包含 variable_name、description；重复变量名只更新说明。"
        />
        <div className="variable-import-heading">
          <Button onClick={downloadTemplate}>下载 CSV 模板</Button>
        </div>
        <label className="variable-upload-zone">
          <input
            type="file"
            hidden
            accept=".csv,text/csv"
            aria-label="上传变量 CSV"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <strong>点击上传变量 CSV</strong>
          <span>UTF-8 · 最大 10 MB · 导入前先预览</span>
        </label>
        {error && <Alert type="error" content={error} />}
        {fileName && preview && (
          <section className="variable-import-preview">
            <div className="variable-import-file">
              <strong>{fileName}</strong>
              <Tag color="orange">待确认</Tag>
            </div>
            <div className="variable-import-stats">
              <Statistic title="总行数" value={preview.totalRows} />
              <Tag color="green">新增 {preview.createCount}</Tag>
              <Tag color="arcoblue">更新 {preview.updateCount}</Tag>
              <Tag color="red">错误 {preview.errorCount}</Tag>
            </div>
            {preview.errors.length > 0 && (
              <Table
                rowKey="row"
                size="small"
                pagination={false}
                data={preview.errors}
                columns={errorColumns}
              />
            )}
            <div className="variable-import-actions">
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                disabled={!preview.validRows.length}
                onClick={() => {
                  importControlledVariables(preview.validRows, "Gary Ma");
                  onClose();
                }}
              >
                确认导入 {preview.validRows.length} 条有效变量
              </Button>
            </div>
          </section>
        )}
      </Space>
    </Modal>
  );
}
