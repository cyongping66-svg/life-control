import Taro from '@tarojs/taro';
import { buildPreviewAnswer, type PreviewAnswer } from './preview-engine';

const STORAGE_KEY = 'life-control-preview-data-v1';

type Entity = { id: string; createdAt?: string; updatedAt?: string };
type LocalEntity = Entity & Record<string, unknown>;
type LocalData = {
  questions: PreviewAnswer[];
  financeItems: LocalEntity[];
  careerItems: LocalEntity[];
  contacts: LocalEntity[];
  reminders: LocalEntity[];
  resumes: LocalEntity[];
};

const emptyData = (): LocalData => ({
  questions: [],
  financeItems: [],
  careerItems: [],
  contacts: [],
  reminders: [],
  resumes: [],
});

const readData = () => {
  try {
    return Taro.getStorageSync<LocalData>(STORAGE_KEY) || emptyData();
  } catch {
    return emptyData();
  }
};

const writeData = (data: LocalData) => Taro.setStorageSync(STORAGE_KEY, data);
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function localApiRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; data?: unknown } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const data = readData();

  if (path === '/questions' && method === 'GET') return data.questions as T;
  if (path === '/questions' && method === 'POST') {
    const input = options.data as { question: string };
    const answer = buildPreviewAnswer(input.question, createId());
    data.questions.unshift(answer);
    writeData(data);
    return answer as T;
  }

  if (path === '/files/resumes' && method === 'GET') return data.resumes as T;
  if (path === '/files/resumes' && method === 'POST') {
    const input = options.data as Record<string, unknown>;
    const versions = data.resumes.filter((item) => item.name === input.name);
    const resume = {
      ...input,
      id: createId(),
      version: versions.length + 1,
      createdAt: new Date().toISOString(),
    };
    data.resumes.unshift(resume);
    writeData(data);
    return resume as T;
  }

  const resource = matchResource(path);
  if (!resource) throw new Error(`本地预览暂不支持：${path}`);
  const collection = data[resource.key] as Array<Entity & Record<string, unknown>>;

  if (method === 'GET' && !resource.id) return collection as T;
  if (method === 'POST' && !resource.id) {
    validateLocalInput(resource.key, options.data as Record<string, unknown>);
    const now = new Date().toISOString();
    const item = {
      ...(options.data as object),
      id: createId(),
      status: resource.key === 'reminders' ? 'pending' : undefined,
      createdAt: now,
      updatedAt: now,
    };
    collection.unshift(item);
    writeData(data);
    return item as T;
  }
  if (method === 'PATCH' && resource.id) {
    const index = collection.findIndex((item) => item.id === resource.id);
    if (index < 0) throw new Error('记录不存在');
    const existing = collection[index];
    if (!existing) throw new Error('记录不存在');
    collection[index] = {
      ...existing,
      ...(options.data as object),
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    writeData(data);
    return collection[index] as T;
  }
  if (method === 'DELETE' && resource.id) {
    data[resource.key] = collection.filter((item) => item.id !== resource.id) as never;
    writeData(data);
    return { deleted: true } as T;
  }
  throw new Error(`本地预览不支持该操作：${method} ${path}`);
}

export function getDueLocalReminders() {
  const data = readData();
  const now = Date.now();
  const due = data.reminders.filter(
    (item) =>
      item.status === 'pending' &&
      typeof item.remindAt === 'string' &&
      new Date(item.remindAt).getTime() <= now,
  );
  if (due.length > 0) {
    const dueIds = new Set(due.map((item) => item.id));
    data.reminders = data.reminders.map((item) =>
      dueIds.has(item.id) ? { ...item, status: 'sent', updatedAt: new Date().toISOString() } : item,
    );
    writeData(data);
  }
  return due;
}

export async function resetLocalData() {
  const data = readData();
  const savedFiles = [...data.resumes, ...data.contacts]
    .flatMap((item) => [item.objectKey, item.photoKey])
    .filter((path): path is string => typeof path === 'string' && path.length > 0);
  await Promise.all(
    savedFiles.map((filePath) => Taro.removeSavedFile({ filePath }).catch(() => undefined)),
  );
  writeData(emptyData());
}

function matchResource(path: string) {
  const definitions = [
    { prefix: '/finance-items', key: 'financeItems' },
    { prefix: '/career-items', key: 'careerItems' },
    { prefix: '/contacts', key: 'contacts' },
    { prefix: '/reminders', key: 'reminders' },
  ] as const;
  for (const definition of definitions) {
    if (path === definition.prefix) return { key: definition.key, id: undefined };
    if (path.startsWith(`${definition.prefix}/`)) {
      return { key: definition.key, id: path.slice(definition.prefix.length + 1) };
    }
  }
  return null;
}

function validateLocalInput(key: keyof LocalData, input: Record<string, unknown>) {
  if (key === 'financeItems') {
    if (typeof input.institution !== 'string' || !input.institution.trim()) {
      throw new Error('请填写机构名称');
    }
    if (input.lastFour && !/^\d{4}$/.test(String(input.lastFour))) {
      throw new Error('尾号必须是 4 位数字');
    }
  }
  if (key === 'careerItems' && (typeof input.title !== 'string' || !input.title.trim())) {
    throw new Error('请填写目标名称');
  }
  if (key === 'contacts') {
    if (typeof input.name !== 'string' || !input.name.trim()) throw new Error('请填写姓名');
    if (input.birthday && !/^\d{2}-\d{2}$/.test(String(input.birthday))) {
      throw new Error('生日格式应为 MM-DD');
    }
  }
  if (
    key === 'reminders' &&
    (typeof input.remindAt !== 'string' || Number.isNaN(new Date(input.remindAt).getTime()))
  ) {
    throw new Error('提醒时间无效');
  }
}
