# Version Design

还原点作用于顶级项目。

快照第一版采用：

- SQLite 保存还原点索引。
- JSON 保存项目快照内容。
- 快照目录：`snapshots/projects/<project_id>/<timestamp_name>/snapshot.json`。

退出时如存在未创建还原点的修改，应提示用户创建还原点、直接退出或取消。

