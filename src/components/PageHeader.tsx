import type { ReactNode } from 'react';
import { Space } from '@arco-design/web-react';

export default function PageHeader({ eyebrow = 'MESSAGE OPERATIONS', title, description, actions, tags }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; tags?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{tags && <div className="page-tags">{tags}</div>}</div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}
