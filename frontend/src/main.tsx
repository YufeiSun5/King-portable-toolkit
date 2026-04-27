// 文件说明：React 渲染入口，加载全局样式并挂载应用。
// 联动 App.tsx、全局样式和 index.html。

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

