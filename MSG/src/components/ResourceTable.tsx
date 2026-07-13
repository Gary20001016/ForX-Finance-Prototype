import type { ReactNode } from 'react';
import { Empty, Table } from '@arco-design/web-react';
import type { TableColumnProps } from '@arco-design/web-react';

export default function ResourceTable<T extends object>({ data, columns, rowKey, title }: { data: T[]; columns: TableColumnProps<T>[]; rowKey: string; title?: ReactNode }) {
  return <div className="surface table-surface">{title}<Table<T> rowKey={rowKey} data={data} columns={columns} scroll={{ x: 1180 }} pagination={{ pageSize: 8, showTotal: true, sizeCanChange: true }} noDataElement={<Empty description="暂无符合条件的数据" />} /></div>;
}
