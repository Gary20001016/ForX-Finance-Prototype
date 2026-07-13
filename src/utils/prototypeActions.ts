import { Message, Modal } from '@arco-design/web-react';

export function openPrototypeDialog(title: string, content: string) {
  Modal.info({
    title,
    content,
    okText: '知道了',
  });
}

export function confirmPrototypeAction(title: string, content: string, successText: string) {
  Modal.confirm({
    title,
    content,
    okText: '确认',
    cancelText: '取消',
    onOk: () => { Message.success(successText); },
  });
}
