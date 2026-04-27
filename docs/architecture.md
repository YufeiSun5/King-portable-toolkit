# Architecture

```text
Wails Desktop
├─ React Frontend
│  ├─ Workspace tree
│  ├─ KIO editor
│  ├─ Field detail panel
│  └─ Batch operation preview
├─ Go Binding API
│  ├─ Workspace API
│  ├─ Folder / CSV API
│  ├─ KIO edit API
│  ├─ Batch operation API
│  └─ Restore point API
└─ SQLite Data Center
   ├─ Project tree
   ├─ CSV headers
   ├─ KIO variables
   ├─ Full field values
   ├─ Change logs
   └─ Restore points
```

React 不启动业务 HTTP 服务，通过 Wails Binding 调用 Go。CSV 导入后复制到工作区并写入 SQLite，之后以 SQLite 为准。

