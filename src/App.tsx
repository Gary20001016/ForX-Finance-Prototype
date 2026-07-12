import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from './app/routes';
import './styles/global.css';

export default function App() {
  return <ConfigProvider locale={zhCN}><RouterProvider router={appRouter} /></ConfigProvider>;
}
