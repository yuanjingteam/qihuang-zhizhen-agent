# 岐黄智诊

AI 驱动的中医智能诊疗助手，基于多智能体架构实现中医临床辅助诊疗。

## 核心能力

- **智能问诊** — 多轮对话引导患者描述症状，支持舌诊图像上传
- **辨证论治** — 基于 RAG 检索中医经典文献与临床指南，辅助辨证分型
- **安全审查** — 十八反、十九畏、妊娠禁忌等规则硬编码，不经 LLM 生成
- **SOAP 病历** — 自动生成结构化病历，支持医生端审核与修改
- **饮食调护** — 根据体质辨识结果生成个性化膳食方案

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) + TypeScript |
| 智能体 | LangGraph JS + LangChain JS |
| LLM | Qwen2.5 (via Ollama/vLLM) |
| 数据库 | Drizzle ORM + PostgreSQL |
| 向量库 | ChromaDB |
| UI | Radix UI + Tailwind CSS + Framer Motion |
| 校验 | Zod |

## 快速开始

### 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### Docker 部署

```bash
# 生产环境
docker compose up -d

# 开发模式（含热更新）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 数据库

```bash
npm run db:push     # 同步 Schema
npm run db:studio   # 打开 Drizzle Studio
```

### 知识库灌入

```bash
npm run ingest
```

## 项目结构

```
src/
├── app/                 # Next.js 页面与 API 路由
├── components/          # React 组件
├── lib/
│   ├── agents/          # LangGraph 智能体
│   ├── core/            # 共享模型与枚举
│   ├── db/              # Drizzle Schema
│   ├── graph/           # LangGraph 状态机
│   ├── llm/             # LLM 适配层
│   ├── mcp/             # MCP 服务端实现
│   ├── memory/          # 患者记忆服务
│   ├── prompts/         # Prompt 模板
│   ├── rag/             # 分层 RAG 引擎
│   ├── safety/          # 安全规则（硬编码）
│   └── tools/           # 工具定义
└── scripts/             # 知识库灌入脚本
```

## 安全规则

所有用药安全规则均为硬编码常量，不依赖 LLM 生成：

- 十八反 (`incompatibilities.ts`)
- 十九畏 (`fears.ts`)
- 药典剂量限制 (`dose-limits.ts`)
- 妊娠禁忌 (`pregnancy.ts`)

## MCP 扩展

通过 Model Context Protocol 暴露外部能力：

- 舌诊 MCP — 舌象分析
- 中药知识库 MCP — 方剂与药物查询
- 药典 MCP — 药典数据检索
- 文献检索 MCP — 中医文献搜索
- 患者档案 MCP — 病历管理

## License

Private
