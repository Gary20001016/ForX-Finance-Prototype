import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MessageTemplate } from "../domain/types";
import {
  getPrototypeState,
  resetPrototypeStore,
  saveTemplate,
  updateTemplate,
} from "./prototypeStore";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T09:30:00+08:00"));
  resetPrototypeStore();
});

afterEach(() => vi.useRealTimers());

const templateInput = (name: string) => ({
  name,
  category: "系统公告",
  nature: "事务",
  risk: "低" as const,
  channels: ["站内信" as const],
  locales: ["zh-CN"],
  sourceLocale: "zh-CN",
  content: getPrototypeState().templates[0].content,
  variables: [],
  owner: "消息运营",
  usageScope: "manual" as const,
});

it("generates readable sequential IDs and internal codes", () => {
  const first = saveTemplate(templateInput("模板一"));
  const second = saveTemplate(templateInput("模板二"));

  expect(first).toMatchObject({
    id: "TPL-MAN-20260718-0001",
    code: "tpl_man_20260718_0001",
  });
  expect(second).toMatchObject({
    id: "TPL-MAN-20260718-0002",
    code: "tpl_man_20260718_0002",
  });
});

it("keeps identifiers immutable during updates", () => {
  const created = saveTemplate(templateInput("原名称"));
  const changes = {
    id: "TPL-TAMPERED",
    code: "tampered",
    name: "新名称",
  } as Partial<MessageTemplate>;

  const updated = updateTemplate(created.id, changes);

  expect(updated).toMatchObject({
    id: "TPL-MAN-20260718-0001",
    code: "tpl_man_20260718_0001",
    name: "新名称",
  });
});
