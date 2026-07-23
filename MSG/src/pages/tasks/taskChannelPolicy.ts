import type { Channel } from "../../domain/types";

export const templateCoversChannels = (
  templateChannels: Channel[],
  selectedChannels: Channel[],
) =>
  selectedChannels.length > 0 &&
  selectedChannels.every((channel) => templateChannels.includes(channel));

export const sameChannels = (left: Channel[], right: Channel[]) =>
  left.length === right.length &&
  left.every((channel) => right.includes(channel));
