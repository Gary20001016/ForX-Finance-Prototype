import type { MessageCategory } from "./types";

export const getMessageCategoryDefaultNature = (
  categories: MessageCategory[],
  categoryName: string,
) => categories.find((item) => item.name === categoryName)?.defaultNature;
