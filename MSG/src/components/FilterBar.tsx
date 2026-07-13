import type { ReactNode } from 'react';
import { Button, Message, Space } from '@arco-design/web-react';
import { IconRefresh, IconSearch } from '@arco-design/web-react/icon';

export default function FilterBar({ children, onSearch, onReset }: { children: ReactNode; onSearch?: () => void; onReset?: () => void }) {
  const handleReset = () => onReset ? onReset() : Message.info('筛选条件已重置');
  const handleSearch = () => onSearch ? onSearch() : Message.success('已按当前条件更新结果');
  return <div className="filter-bar"><Space wrap size={12}>{children}</Space><Space><Button icon={<IconRefresh />} onClick={handleReset}>重置</Button><Button type="primary" icon={<IconSearch />} onClick={handleSearch}>查询</Button></Space></div>;
}
