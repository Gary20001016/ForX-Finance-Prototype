import type { ReactNode } from 'react';
import { Button, Space } from '@arco-design/web-react';
import { IconRefresh, IconSearch } from '@arco-design/web-react/icon';

export default function FilterBar({ children, onSearch, onReset }: { children: ReactNode; onSearch?: () => void; onReset?: () => void }) {
  return <div className="filter-bar"><Space wrap size={12}>{children}</Space><Space><Button icon={<IconRefresh />} onClick={onReset}>重置</Button><Button type="primary" icon={<IconSearch />} onClick={onSearch}>查询</Button></Space></div>;
}
