import { Empty } from '@arco-design/web-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MESSAGE OPERATIONS</span>
          <h1>{title}</h1>
          <p>统一管理全球化、多渠道的交易所用户触达。</p>
        </div>
      </div>
      <div className="surface placeholder-surface">
        <Empty description={`${title}正在搭建`} />
      </div>
    </section>
  );
}
