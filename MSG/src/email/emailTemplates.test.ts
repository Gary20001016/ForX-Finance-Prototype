/// <reference types="vite/client" />

import { expect, it } from "vitest";

import marketingHtml from "../../html/email/marketing-campaign.html?raw";
import transactionalHtml from "../../html/email/transactional-notification.html?raw";

const expectSharedEmailCompatibility = (html: string) => {
  expect(html).toMatch(
    /<body[^>]+style="[^"]*font-size:14px;line-height:1\.7;[^"]*"/,
  );
  expect(html).toMatch(
    /<p[^>]+style="[^"]*font-size:14px;line-height:1\.7;[^"]*"[^>]*>Hi \{\{ user_nickname \}\},<\/p>/,
  );
  expect(html).toMatch(
    /<!--\[if mso\]>\s*<table[^>]+width="600"[\s\S]*?<!\[endif\]-->\s*<table[^>]+width="100%"[^>]+style="[^"]*width:100%;max-width:600px/,
  );
  expect(html).toMatch(
    /<v:roundrect[^>]+href="\{\{ action_url \}\}"[\s\S]*?<\/v:roundrect>/,
  );
  expect(html).toMatch(
    /<!--\[if !mso\]><!-->[\s\S]*?<a href="\{\{ action_url \}\}"/,
  );
};

it("ships a transaction notice with status, data rows and a single CTA", () => {
  const html = transactionalHtml;
  expectSharedEmailCompatibility(html);
  expect(html).toContain("{{ user_nickname }}");
  expect(html).toContain("{{ detail_rows }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).not.toContain("{{ unsubscribe_url }}");
});

it("ships a marketing campaign with campaign variables and unsubscribe", () => {
  const html = marketingHtml;
  expectSharedEmailCompatibility(html);
  expect(html).toContain("{{ campaign_name }}");
  expect(html).toContain("{{ amount }}");
  expect(html).toContain("{{ currency }}");
  expect(html).toContain("{{ occurred_at }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).toContain("{{ unsubscribe_url }}");
});
