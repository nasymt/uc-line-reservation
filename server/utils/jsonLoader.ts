import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readJson<T>(relativePath: string): Promise<T> {
  const filePath = join(process.cwd(), "server", "data", relativePath);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}
