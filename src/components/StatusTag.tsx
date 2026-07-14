import { Tag } from '@arco-design/web-react';

const colors: Record<string, string> = {
  已完成: 'green', 已发布: 'green', 已生效: 'green', 已送达: 'green', 已打开: 'cyan', 已点击: 'purple', 可用: 'green', 运行正常: 'green',
  发送中: 'arcoblue', 待发送: 'blue', 审核中: 'orange', 待审核: 'orange', 待我审核: 'orange', 草稿: 'gray',
  待修改: 'orangered', 已暂停: 'gold', 轻微延迟: 'gold', 部分完成: 'gold', 紧急: 'red', 失败: 'red', 永久失败: 'red', 临时失败: 'orange', 已退信: 'red', 合规拦截: 'gray',
  未开始: 'gray', 处理中: 'arcoblue', 成功: 'green', 通过: 'green', 驳回: 'orangered', 已撤回: 'gray', 已终止: 'gray',
  机翻处理中: 'arcoblue', 排队中: 'gray', 翻译中: 'arcoblue', 待人工审核: 'orange', 审核通过: 'green', 全部审核通过: 'green', 部分失败: 'red', 翻译失败: 'red', 审核被驳回: 'orangered', 审核驳回: 'orangered', 已驳回: 'orangered', 已取消: 'gray',
};

export default function StatusTag({ status }: { status: string }) {
  return <Tag color={colors[status] ?? 'gray'} bordered>{status}</Tag>;
}
