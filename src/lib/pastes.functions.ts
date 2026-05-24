import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as KV from "./kv";

const ExpirationMinutes = z.enum(["5", "60", "1440", "10080"]);

export const createPaste = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/),
      ciphertext: z.string().min(1).max(2_000_000),
      iv: z.string().min(1).max(64),
      salt: z.string().max(64).nullable().optional(),
      passwordProtected: z.boolean(),
      burnAfterReading: z.boolean(),
      expirationMinutes: ExpirationMinutes,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const minutes = parseInt(data.expirationMinutes, 10);
    const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
    
    return await KV.createPaste({
      id: data.id,
      ciphertext: data.ciphertext,
      iv: data.iv,
      salt: data.salt ?? null,
      passwordProtected: data.passwordProtected,
      burnAfterReading: data.burnAfterReading,
      sizeBytes: data.ciphertext.length,
      expiresAt,
    });
  });

export const getPasteMeta = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const paste = await KV.getPaste(data.id);
    
    if (!paste) return { status: "not-found" as const };
    
    if (new Date(paste.expiresAt).getTime() < Date.now()) {
      await KV.deletePaste(paste.id);
      return { status: "expired" as const };
    }
    
    if (paste.burnAfterReading && paste.viewed) {
      return { status: "burned" as const };
    }
    
    return {
      status: "ok" as const,
      passwordProtected: paste.passwordProtected,
      salt: paste.salt,
      burnAfterReading: paste.burnAfterReading,
      expiresAt: paste.expiresAt,
    };
  });

export const consumePaste = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const paste = await KV.getPaste(data.id);
    
    if (!paste) return { status: "not-found" as const };
    
    if (new Date(paste.expiresAt).getTime() < Date.now()) {
      await KV.deletePaste(paste.id);
      return { status: "expired" as const };
    }
    
    if (paste.burnAfterReading && paste.viewed) {
      return { status: "burned" as const };
    }

    await KV.updatePaste(paste.id, {
      viewed: paste.burnAfterReading ? true : paste.viewed,
      views: paste.views + 1,
    });

    return {
      status: "ok" as const,
      ciphertext: paste.ciphertext,
      iv: paste.iv,
      salt: paste.salt,
      passwordProtected: paste.passwordProtected,
      expiresAt: paste.expiresAt,
    };
  });

// ---------------- Admin ----------------

function checkAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Admin password not configured");
  if (password !== expected) throw new Error("Invalid admin password");
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    checkAdmin(data.password);
    return { ok: true };
  });

export const adminListPastes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    checkAdmin(data.password);
    
    const allPastes = await KV.getAllPastes();
    const now = Date.now();
    
    // Filter out expired pastes
    const activePastes = allPastes.filter(p => new Date(p.expiresAt).getTime() > now);
    
    // Delete expired ones
    for (const paste of allPastes) {
      if (new Date(paste.expiresAt).getTime() <= now) {
        await KV.deletePaste(paste.id);
      }
    }

    const totalBytes = activePastes.reduce((s, r) => s + (r.sizeBytes ?? 0), 0);
    
    return {
      pastes: activePastes.map(p => ({
        id: p.id,
        created_at: p.createdAt,
        expires_at: p.expiresAt,
        views: p.views,
        size_bytes: p.sizeBytes,
        burn_after_reading: p.burnAfterReading,
        viewed: p.viewed,
        password_protected: p.passwordProtected,
      })),
      total: activePastes.length,
      active: activePastes.length,
      totalBytes,
    };
  });

export const adminDeletePaste = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(256), id: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.password);
    await KV.deletePaste(data.id);
    return { ok: true };
  });
