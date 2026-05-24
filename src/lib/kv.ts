import { kv } from "@vercel/kv";

export interface PasteData {
  id: string;
  ciphertext: string;
  iv: string;
  salt: string | null;
  passwordProtected: boolean;
  burnAfterReading: boolean;
  viewed: boolean;
  views: number;
  sizeBytes: number;
  createdAt: string;
  expiresAt: string;
}

export async function createPaste(data: Omit<PasteData, "viewed" | "views" | "createdAt">) {
  const pasteData: PasteData = {
    ...data,
    viewed: false,
    views: 0,
    createdAt: new Date().toISOString(),
  };

  const expirationMinutes = Math.floor(
    (new Date(data.expiresAt).getTime() - Date.now()) / 60000
  );

  await kv.set(`paste:${data.id}`, pasteData, {
    ex: expirationMinutes * 60,
  });

  return { id: data.id, expiresAt: data.expiresAt };
}

export async function getPaste(id: string): Promise<PasteData | null> {
  return await kv.get<PasteData>(`paste:${id}`);
}

export async function updatePaste(id: string, updates: Partial<PasteData>) {
  const paste = await getPaste(id);
  if (!paste) return null;

  const updated = { ...paste, ...updates };
  const ttl = await kv.ttl(`paste:${id}`);
  
  await kv.set(`paste:${id}`, updated, {
    ex: ttl > 0 ? ttl : 3600,
  });

  return updated;
}

export async function deletePaste(id: string) {
  await kv.del(`paste:${id}`);
}

export async function getAllPastes(): Promise<PasteData[]> {
  const keys = await kv.keys("paste:*");
  const pastes: PasteData[] = [];

  for (const key of keys) {
    const paste = await kv.get<PasteData>(key);
    if (paste) pastes.push(paste);
  }

  return pastes.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
