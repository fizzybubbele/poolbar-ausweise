import type JSZip from "jszip";

export class PhotoZipStore {
  private index = new Map<string, string>();

  private constructor(private zip: JSZip) {}

  static async open(zipBuffer: Buffer): Promise<PhotoZipStore> {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(zipBuffer);
    const store = new PhotoZipStore(zip);
    store.buildIndex();
    return store;
  }

  private buildIndex() {
    for (const [entryPath, file] of Object.entries(this.zip.files)) {
      if (file.dir) continue;
      const basename = (entryPath.split("/").pop() ?? entryPath).toLowerCase();
      if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(basename)) continue;
      this.index.set(basename, entryPath);
    }
  }

  photoNames(): Set<string> {
    return new Set(this.index.keys());
  }

  count(): number {
    return this.index.size;
  }

  async getPhoto(filename: string): Promise<Buffer | undefined> {
    const entryPath = this.index.get(filename.trim().toLowerCase());
    if (!entryPath) return undefined;
    const file = this.zip.files[entryPath];
    if (!file) return undefined;
    return Buffer.from(await file.async("arraybuffer"));
  }
}
