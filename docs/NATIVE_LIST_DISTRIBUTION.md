# SmartX Native List 分发与本地联调

状态：脚本与定向自动化检查已实现；干净 Git 安装、双端原生构建与设备验证由 App 集成任务记录，不由脚本测试替代。

## 源码与产物

维护分支为 `arlan/smartx-native-list`，保留 `f11ac08bf1278a31345829d9e245015d52035df4` 基线历史。选择性采用上游 `5e94f3bd057ca054ae14153e1fa893d3ae1d0eb5` 的 Native List 字体/许可证修复，未采用该提交的 example 或 image-crop-picker 改动。四个 Roobert 文件不再分发，原模板沿用上游系统字体映射；SmartX 模板的 IBM Plex 字体由 App 提供。字体度量变化需要双端实际呈现验证。

四个消费包保留原名称、原生标识和子目录：

- `native-modules/native-logger`
- `native-views/react-native-skeleton`
- `native-views/react-native-image`
- `native-views/react-native-native-list`

先按仓库锁文件准备 Yarn 依赖，再从仓库根运行：

```sh
corepack yarn install --immutable
node scripts/native-list-dist.mjs build --output /absolute/native-list-dist
node scripts/native-list-dist.mjs verify --output /absolute/native-list-dist
```

稀疏检出时可以先用 `corepack yarn workspaces focus` 选择以上四个包，构建仍使用同一根工作区和 Yarn 锁文件。构建依次运行 logger、skeleton、image、list 的现有 `prepare`，Bob 调用 Nitro 并在 Native List 上执行 container slots 补丁；源码构建期间改变会拒绝输出，避免混合不同版本。

脚本使用 `npm pack --dry-run --ignore-scripts --json --workspaces=false` 取得各包原始白名单，并验证 JS、类型、源码、双端源码、Nitro 生成物、LICENSE 和 container slots 标记。消费 manifest 去除全部 scripts、devDependencies、packageManager 和开发工具配置，保留 exports、原生配置、peerDependencies；不在 App 安装时运行 Yarn、Bob 或 Nitrogen。原始清单包括的许可证、版权、图标和原生资源原样保留。

输出目录只能位于源码检出之外；首次输出必须不存在，后续替换必须具有脚本标记。先在同级临时目录构建完整输出并核对，再替换旧目录。失败保持上一个成功输出。`native-list-provenance.json` 包含源码完整 SHA、基线 SHA、选择合入的上游提交、源码输入摘要、Node/Yarn/Bob/Nitrogen/TypeScript 版本、包版本、许可证目录和全部分发文件 SHA256；它不自引用产物 SHA，也不写不稳定的生成时间。

`--allow-dirty` 只用于本地验证。`build --watch --allow-dirty` 监测四包源文件和构建配置，只有源输入变化时重新构建；`lib`、`nitrogen`、缓存不触发循环。编译错误保留上一份产物，下一次源码修改后再试。新增字体会在 provenance 标记 `unresolved`；发布命令拒绝未提交源码和未核实的字体资源。

## 追加发布

源码审查、提交与原生验证完成后，由维护者显式执行：

```sh
node scripts/native-list-dist.mjs build --output /absolute/native-list-dist
node scripts/native-list-dist.mjs publish --output /absolute/native-list-dist
```

默认发布到 `https://github.com/mengjiu-cao/app-modules.git` 的 `arlan/smartx-native-list-dist`。脚本在临时 Git 仓库读取远端产物分支，追加一个以源码 SHA 为说明的提交，正常 push；不 force push，不改源检出，不重写已发布历史。首次发布创建只有消费包与 provenance 的根提交。并发发布导致远端前进时，普通 push 会拒绝，重新发布即可。`--remote` 和 `--branch` 供受控镜像使用。App 引用的 commit 必须长期可达，禁止删除/重写此分支历史。

App 的四个直接依赖必须全部使用同一个完整产物 SHA：

```json
{
  "@onekeyfe/react-native-native-list": "github:mengjiu-cao/app-modules#<40位产物SHA>&path:/native-views/react-native-native-list"
}
```

另外三包使用对应子目录。提交 App manifest 与锁文件；`react-native-nitro-modules` 精确为 `0.37.0`。依赖 SHA 变化必须重建原生二进制。

## 临时 Workspace

App 仓库提供 `scripts/native-list-workspace.mjs`。它创建专用 detached App worktree 和四个准备好的消费包，Fork 的 Yarn 源码工作区保持独立。正式 manifest 不写本地路径，临时根拥有独立 lockfile/node_modules，并继承 App 的 overrides、patchedDependencies、onlyBuiltDependencies、ignoredBuiltDependencies 及其他 pnpm 配置。补丁路径重定位到 `app/patches`，仅 App 的四个包用 parent-specific overrides 替换成 `workspace:*`。临时根也声明这四包与同版本 React、RN、Nitro，统一 peer 来源。临时锁文件从正式 App 锁文件生成，保留全部 packages、snapshots、补丁摘要和具体版本；仅重定位 importer、补丁路径和四包本地链接。安装使用 --frozen-lockfile，四包内部 peer 链接同组 Workspace 包，并检查 App 全部直接依赖版本一致。

```sh
node /absolute/smartx-backup/scripts/native-list-workspace.mjs create --root /absolute/native-list-workspace --dist /absolute/native-list-dist
node /absolute/smartx-backup/scripts/native-list-workspace.mjs install --root /absolute/native-list-workspace
node /absolute/smartx-backup/scripts/native-list-workspace.mjs run --root /absolute/native-list-workspace -- start
```

默认 worktree 为 App 的 `HEAD`。要联调尚未提交的集成，显式加 `--include-working-tree`，它复制 tracked diff 和非忽略的 untracked 文件，不修改原检出。源 App 必须已声明四个完整 Git SHA 依赖且 SHA 一致。

所有命令通过 `run` 转发 pnpm 参数，自动设置 `NPM_CONFIG_WORKSPACE_DIR`/`npm_config_workspace_dir` 与 `SMARTX_NATIVE_LIST_WORKSPACE`。前者强制 pnpm 使用临时根，避免 `app/pnpm-workspace.yaml` 将它误判为独立项目；后者使 App Metro 选择同一包根。`install` 后自动运行 `verify`：检查 App manifest 未变、四个包解析到本地产物、React/RN/Nitro 的真实路径唯一，以及 Expo iOS/Android autolinking 选中同样四包。Metro 的实际 bundle 与双端编译另外验证。

两个终端进行联调：

```sh
# Fork 源码根：成功构建才替换准备好的产物
node scripts/native-list-dist.mjs build --output /absolute/native-list-dist --allow-dirty --watch
# App 脚本：只同步成功产物，保留四包各自 node_modules 的 peer 链接
node /absolute/smartx-backup/scripts/native-list-workspace.mjs sync --root /absolute/native-list-workspace --dist /absolute/native-list-dist --watch
```

JS 修改由 Metro 更新；Swift/Kotlin/C++、Nitro schema 或原生资源变化需重新构建开发二进制。依赖版本变化需重新 install 和 verify。结束联调时用 `git worktree remove /absolute/native-list-workspace/app` 清理已确认不再需要的 App worktree，再删除临时根；不要将临时 lockfile 或路径提交到正式 App。

## 定向检查

```sh
node --test scripts/native-list-dist.test.mjs
# App 仓库根
node --test scripts/native-list-workspace.test.mjs
```

测试覆盖消费 manifest 去构建化、路径边界、摘要篡改/额外文件拒绝、发布限制、pnpm 配置继承、显式 Workspace 根和保留安装 peer 的同步。它们不证明 CocoaPods/Gradle 链接、真实设备视觉或性能。
