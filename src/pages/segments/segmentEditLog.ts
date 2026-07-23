import type {
  AudienceSegment,
  SegmentEditChange,
} from "../../domain/types";

type EditableField =
  | "name"
  | "type"
  | "purpose"
  | "owner"
  | "refresh"
  | "rule"
  | "setOperation"
  | "sourceSegmentIds";

const editableFields: Array<{ key: EditableField; label: string }> = [
  { key: "name", label: "分群名称" },
  { key: "type", label: "分群类型" },
  { key: "purpose", label: "业务用途" },
  { key: "owner", label: "创建人" },
  { key: "refresh", label: "数据刷新" },
  { key: "rule", label: "规则摘要" },
  { key: "setOperation", label: "集合运算" },
  { key: "sourceSegmentIds", label: "来源分群" },
];

function formatFieldValue(
  segment: AudienceSegment,
  field: EditableField,
  allSegments: AudienceSegment[],
) {
  if (field === "setOperation") {
    if (!segment.setOperation) return "";
    return segment.setOperation === "intersection" ? "交集" : "并集";
  }

  if (field === "sourceSegmentIds") {
    return (segment.sourceSegmentIds || [])
      .map(
        (id) => allSegments.find((candidate) => candidate.id === id)?.name || id,
      )
      .join("、");
  }

  return String(segment[field] ?? "");
}

export function buildSegmentEditChanges(
  before: AudienceSegment | undefined,
  after: AudienceSegment,
  allSegments: AudienceSegment[],
): SegmentEditChange[] {
  return editableFields.flatMap(({ key, label }) => {
    const beforeValue = before
      ? formatFieldValue(before, key, allSegments)
      : "—";
    const afterValue = formatFieldValue(after, key, allSegments);

    if (!before && !afterValue) return [];
    if (before && beforeValue === afterValue) return [];

    return [
      {
        field: label,
        before: beforeValue || "—",
        after: afterValue || "—",
      },
    ];
  });
}
