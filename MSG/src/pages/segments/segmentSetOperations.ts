import type { AudienceSegment } from "../../domain/types";

export type SetOperation = "union" | "intersection";

const selectedSegments = (
  segments: AudienceSegment[],
  sourceSegmentIds: string[],
) =>
  sourceSegmentIds
    .map((id) => segments.find((segment) => segment.id === id))
    .filter((segment): segment is AudienceSegment => Boolean(segment));

export const segmentSetExpression = (
  segments: AudienceSegment[],
  sourceSegmentIds: string[],
  operation: SetOperation,
) =>
  selectedSegments(segments, sourceSegmentIds)
    .map((segment) =>
      segment.type === "组合分群" ? `（${segment.rule}）` : segment.name,
    )
    .join(operation === "union" ? " ∪ " : " ∩ ");

export const segmentDependsOn = (
  segments: AudienceSegment[],
  candidateId: string,
  targetId: string,
  visited = new Set<string>(),
): boolean => {
  if (candidateId === targetId) return true;
  if (visited.has(candidateId)) return false;

  const candidate = segments.find((segment) => segment.id === candidateId);
  if (!candidate?.sourceSegmentIds?.length) return false;

  visited.add(candidateId);
  return candidate.sourceSegmentIds.some(
    (sourceId) =>
      sourceId === targetId ||
      segmentDependsOn(segments, sourceId, targetId, visited),
  );
};

export const estimateSegmentSetCount = (
  segments: AudienceSegment[],
  sourceSegmentIds: string[],
  operation: SetOperation,
) => {
  const selected = selectedSegments(segments, sourceSegmentIds);
  if (!selected.length) return 0;
  if (operation === "union") {
    const availablePopulation = segments.reduce(
      (total, segment) => total + segment.count,
      0,
    );
    return Math.min(
      availablePopulation,
      selected.reduce((total, segment) => total + segment.count, 0),
    );
  }
  return Math.round(Math.min(...selected.map((segment) => segment.count)) * 0.6);
};
