import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";

export interface ImageResolverOptions {
  syncRoot: string;
  imageDirName: string;
  shouldUseRemote: (url: string) => Promise<boolean>;
  downloadImage: (url: string) => Promise<Buffer>;
}

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/g;

export class ImageResolver {
  public constructor(private readonly options: ImageResolverOptions) {}

  public async resolve(markdown: string, markdownPath: string): Promise<string> {
    let result = markdown;
    const matches = Array.from(markdown.matchAll(MARKDOWN_IMAGE_PATTERN));
    for (const match of matches) {
      const originalUrl = match[1];
      if (await this.options.shouldUseRemote(originalUrl)) {
        continue;
      }
      const buffer = await this.options.downloadImage(originalUrl);
      const hash = createHash("sha256").update(buffer).digest("hex");
      const extension = extname(new URL(originalUrl).pathname) || extname(basename(originalUrl)) || ".img";
      const imageDir = join(this.options.syncRoot, this.options.imageDirName);
      await mkdir(imageDir, { recursive: true });
      const imagePath = join(imageDir, `${hash}${extension}`);
      await writeFile(imagePath, buffer);
      const relativePath = relative(dirname(markdownPath), imagePath).replace(/\\/g, "/");
      result = result.replace(originalUrl, relativePath);
    }
    return result;
  }
}
