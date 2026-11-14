import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import worldbooksRouter from './routes/worldbooks';
import configRouter from './routes/config';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ── 中间件 ──────────────────────────────────────────────
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

// ── 路由 ────────────────────────────────────────────────
app.use('/api/projects', projectsRouter);
app.use('/api/worldbooks', worldbooksRouter);
app.use('/api/config', configRouter);

// ── 健康检查 ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 处理 ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// ── 全局错误处理 ──────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
);

// ── 启动 ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ CardPacker Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API:    http://localhost:${PORT}/api`);
});

export default app;
