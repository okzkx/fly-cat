import type { KnowledgeBaseSpace, SourceDocument } from "@/types/sync";

export interface DiscoveryProvider {
  listDocuments(selectedSpaces: string[]): Promise<SourceDocument[]>;
}

export class KnowledgeBaseDiscoveryService {
  public constructor(private readonly provider: DiscoveryProvider) {}

  public async discover(spaces: KnowledgeBaseSpace[]): Promise<SourceDocument[]> {
    const selectedSpaces = spaces.filter((space) => space.selected).map((space) => space.id);
    const documents = await this.provider.listDocuments(selectedSpaces);
    const selectedSet = new Set(selectedSpaces);

    return documents.filter((document) => selectedSet.has(document.spaceId));
  }
}

export class InMemoryDiscoveryProvider implements DiscoveryProvider {
  public constructor(private readonly documents: SourceDocument[]) {}

  public async listDocuments(selectedSpaces: string[]): Promise<SourceDocument[]> {
    const selectedSet = new Set(selectedSpaces);
    return this.documents.filter((document) => selectedSet.has(document.spaceId));
  }
}
