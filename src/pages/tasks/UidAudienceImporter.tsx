import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Statistic,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import {
  createUidErrorCsv,
  maskUid,
  mergeUidAudience,
  parseManualUids,
  parseUidCsv,
  UID_CSV_TEMPLATE,
  type UidInvalidRow,
} from "./uidAudience";

export interface UidAudienceValue {
  manualText: string;
  csvFileName?: string;
  csvTotalRows: number;
  csvValidUids: string[];
  csvInvalidRows: UidInvalidRow[];
  duplicateCount: number;
  csvConfirmed: boolean;
}

interface UidAudienceImporterProps {
  value: UidAudienceValue;
  onChange: (value: UidAudienceValue) => void;
  disabled?: boolean;
}

interface MaskedInvalidRow extends UidInvalidRow {
  maskedUid: string;
}

export const createEmptyUidAudienceValue = (
  manualText = "",
): UidAudienceValue => ({
  manualText,
  csvTotalRows: 0,
  csvValidUids: [],
  csvInvalidRows: [],
  duplicateCount: 0,
  csvConfirmed: false,
});

const readFileText = (file: File) => {
  if (typeof file.text === "function") return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("CSV 文件读取失败"));
    reader.readAsText(file, "UTF-8");
  });
};

const downloadCsv = (fileName: string, content: string) => {
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default function UidAudienceImporter({
  value,
  onChange,
  disabled = false,
}: UidAudienceImporterProps) {
  const [error, setError] = useState<string>();
  const manualUids = useMemo(
    () => parseManualUids(value.manualText),
    [value.manualText],
  );
  const merged = useMemo(
    () =>
      mergeUidAudience(
        manualUids,
        value.csvValidUids,
        value.csvConfirmed,
      ),
    [manualUids, value.csvConfirmed, value.csvValidUids],
  );
  const duplicateCount =
    value.duplicateCount + merged.crossSourceDuplicateCount;
  const invalidRows: MaskedInvalidRow[] = value.csvInvalidRows.map((item) => ({
    ...item,
    maskedUid: maskUid(item.uid),
  }));
  const columns: TableColumnProps<MaskedInvalidRow>[] = [
    { title: "行号", dataIndex: "row", width: 90 },
    { title: "UID", dataIndex: "maskedUid" },
    { title: "原因", dataIndex: "reason" },
  ];

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
      const result = parseUidCsv(await readFileText(file));
      setError(undefined);
      onChange({
        ...value,
        csvFileName: file.name,
        csvTotalRows: result.totalRows,
        csvValidUids: result.validUids,
        csvInvalidRows: result.invalidRows,
        duplicateCount: result.duplicateCount,
        csvConfirmed: false,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "CSV 解析失败");
    }
  };

  return (
    <Card className="uid-audience-importer" title="指定 UID">
      <div className="uid-manual-entry">
        <Typography.Text bold>手动输入</Typography.Text>
        <Input.TextArea
          aria-label="手动输入 UID"
          value={value.manualText}
          onChange={(manualText) => onChange({ ...value, manualText })}
          placeholder="每行一个 UID"
          rows={4}
          disabled={disabled}
        />
        <Typography.Text type="secondary">
          已识别 {manualUids.length.toLocaleString()} 个手动 UID
        </Typography.Text>
      </div>

      <div className="uid-import-heading">
        <div>
          <Typography.Text bold>CSV 批量导入</Typography.Text>
          <Typography.Paragraph type="secondary">
            必须包含 uid 列；支持可选 remark 列，单文件最多 100,000 行。
          </Typography.Paragraph>
        </div>
        <Button
          disabled={disabled}
          onClick={() =>
            downloadCsv("uid-import-template.csv", UID_CSV_TEMPLATE)
          }
        >
          下载 CSV 模板
        </Button>
      </div>

      <label
        className={`uid-upload-zone${disabled ? " is-disabled" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled) return;
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
      >
        <input
          aria-label="上传 UID CSV"
          type="file"
          accept=".csv,text/csv"
          disabled={disabled}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <strong>点击或拖拽 CSV 到这里</strong>
        <span>UTF-8 · 最大 10 MB · 再次上传将替换上一份文件</span>
      </label>

      {error && <Alert type="error" content={error} />}

      {value.csvFileName && (
        <section className="uid-import-result" aria-label="CSV 导入结果">
          <div className="uid-import-file">
            <div>
              <strong>{value.csvFileName}</strong>
              <span>本地解析，不会上传原始文件</span>
            </div>
            <Tag color={value.csvConfirmed ? "green" : "orange"}>
              {value.csvConfirmed ? "已确认" : "待确认"}
            </Tag>
          </div>

          <div className="uid-import-stats">
            <Statistic title="文件总行数" value={value.csvTotalRows} />
            <Statistic title="有效 UID" value={value.csvValidUids.length} />
            <Statistic title="重复 UID" value={duplicateCount} />
            <Statistic title="无效 UID" value={value.csvInvalidRows.length} />
          </div>

          {value.csvInvalidRows.length > 0 && (
            <>
              <Alert
                type="warning"
                content={`${value.csvInvalidRows.length} 条无效 UID 将被排除`}
              />
              <Table
                className="uid-import-errors"
                rowKey="row"
                pagination={false}
                data={invalidRows}
                columns={columns}
                size="small"
              />
            </>
          )}

          <Alert
            type="info"
            content="当前为前端格式校验；正式发送前由用户服务再次校验存在性和可触达状态。"
          />

          <div className="uid-import-actions">
            {!value.csvConfirmed && (
              <Button
                type="primary"
                disabled={disabled}
                onClick={() => onChange({ ...value, csvConfirmed: true })}
              >
                {value.csvInvalidRows.length
                  ? "确认排除无效 UID"
                  : "确认导入有效 UID"}
              </Button>
            )}
            <Button
              disabled={!value.csvInvalidRows.length}
              onClick={() =>
                downloadCsv(
                  "uid-import-errors.csv",
                  createUidErrorCsv(value.csvInvalidRows),
                )
              }
            >
              下载错误明细
            </Button>
            <Button
              status="danger"
              disabled={disabled}
              onClick={() => {
                setError(undefined);
                onChange(createEmptyUidAudienceValue(value.manualText));
              }}
            >
              删除 CSV
            </Button>
          </div>
        </section>
      )}

      <div className="uid-final-count" aria-label="最终目标用户">
        <span>最终目标用户</span>
        <strong>{merged.finalUids.length.toLocaleString()}</strong>
        <small>
          {value.csvFileName
            ? `手动 UID 与${value.csvConfirmed ? "已确认 CSV" : "待确认 CSV"}合并去重`
            : "仅手动 UID，已去重"}
        </small>
      </div>
    </Card>
  );
}
