/* eslint-disable react-refresh/only-export-components -- 单文件 MVP 入口，后续组件增多时再拆分 */
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Content = {
  id: string;
  platform: string;
  title: string;
  url: string;
  status: string;
  verifiedAt: string;
};
type Report = { id: string; reason: string; status: string; content: Content };

const api = async <T,>(path: string, token: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);
  return response.json() as Promise<T>;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('admin-token') ?? '');
  const [contents, setContents] = useState<Content[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');

  async function login() {
    try {
      const result = await fetch('/api/v1/auth/development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: '内容管理员' }),
      }).then((response) => response.json() as Promise<{ accessToken: string }>);
      localStorage.setItem('admin-token', result.accessToken);
      setToken(result.accessToken);
    } catch {
      setError('开发登录失败，请确认 API 和数据库已启动。');
    }
  }

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<Content[]>('/admin/external-contents', token),
      api<Report[]>('/admin/content-reports', token),
    ])
      .then(([nextContents, nextReports]) => {
        setContents(nextContents);
        setReports(nextReports);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [token]);

  if (!token) {
    return (
      <main className="login">
        <h1>人生浪费指南</h1>
        <p>管理已核验的外部资料与用户举报。</p>
        <button onClick={login}>开发环境登录</button>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">内容运营后台</p>
          <h1>可靠来源管理</h1>
        </div>
        <button
          className="secondary"
          onClick={() => {
            localStorage.removeItem('admin-token');
            setToken('');
          }}
        >
          退出
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <section>
        <h2>
          外部资料 <span>{contents.length}</span>
        </h2>
        <div className="cards">
          {contents.map((content) => (
            <article key={content.id}>
              <small>
                {content.platform} · {content.status}
              </small>
              <h3>{content.title}</h3>
              <a href={content.url} target="_blank" rel="noreferrer">
                打开原始来源
              </a>
              <time>{new Date(content.verifiedAt).toLocaleDateString('zh-CN')} 核验</time>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>
          待处理举报 <span>{reports.filter((item) => item.status === 'OPEN').length}</span>
        </h2>
        {reports.length === 0 ? (
          <p className="empty">暂无举报</p>
        ) : (
          reports.map((report) => (
            <article key={report.id}>
              <strong>{report.content.title}</strong>
              <p>{report.reason}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
