/// <reference types="vite/client" />

import { expect, it } from "vitest";

import marketingHtml from "../../html/email/marketing-campaign.html?raw";
import transactionalHtml from "../../html/email/transactional-notification.html?raw";

it("ships a transaction notice with status, data rows and a single CTA", () => {
  const html = transactionalHtml;
  expect(html).toContain("{{ user_nickname }}");
  expect(html).toContain("{{ detail_rows }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).not.toContain("{{ unsubscribe_url }}");
});

it("ships a marketing campaign with campaign variables and unsubscribe", () => {
  const html = marketingHtml;
  expect(html).toContain("{{ campaign_name }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).toContain("{{ unsubscribe_url }}");
});
