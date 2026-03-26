import { useMemo, useState } from "react";
import { loadConfig } from "@/core/config";
import type { KnowledgeBaseSpace, SyncCounters, SyncLifecycleState, SyncRunError } from "@/types/sync";
import "./styles.css";

const mockSpaces: KnowledgeBaseSpace[] = [
  { id: "kb-eng", name: "Engineering KB", selected: true },
  { id: "kb-product", name: "Product KB", selected: false }
];

const config = loadConfig();

export default function App(): React.JSX.Element {
  const [spaces, setSpaces] = useState<KnowledgeBaseSpace[]>(mockSpaces);
  const [state, setState] = useState<SyncLifecycleState>("idle");
  const [counters, setCounters] = useState<SyncCounters>({ total: 0, processed: 0, succeeded: 0, skipped: 0, failed: 0 });
  const [errors, setErrors] = useState<SyncRunError[]>([]);
  const [lastFailedIds, setLastFailedIds] = useState<string[]>([]);

  const syncTarget = useMemo(() => config.syncRoot, []);
  const selectedCount = spaces.filter((s) => s.selected).length;

  const runSync = async (retryOnly = false): Promise<void> => {
    setState("preparing");
    const total = retryOnly ? Math.max(1, lastFailedIds.length) : selectedCount * 2;
    setCounters({ total, processed: 0, succeeded: 0, skipped: retryOnly ? 0 : 1, failed: 0 });
    setState("syncing");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const simulatedError: SyncRunError | null = retryOnly
      ? null
      : {
          documentId: "doc-err",
          title: "API Overview",
          category: "mcp",
          message: "MCP request timeout"
        };

    const failed = simulatedError ? 1 : 0;
    const succeeded = Math.max(0, total - failed - (retryOnly ? 0 : 1));
    setCounters({ total, processed: total, succeeded, skipped: retryOnly ? 0 : 1, failed });
    setErrors(simulatedError ? [simulatedError] : []);
    setLastFailedIds(simulatedError ? [simulatedError.documentId] : []);
    setState(simulatedError ? "partial-failed" : "completed");
  };

  return (
    <main className="app">
      <h1>Feishu Knowledge Base Sync</h1>
      <section>
        <h2>Source Selection</h2>
        {spaces.map((space) => (
          <label key={space.id} className="row">
            <input
              type="checkbox"
              checked={space.selected}
              onChange={(event) =>
                setSpaces((current) =>
                  current.map((entry) => (entry.id === space.id ? { ...entry, selected: event.target.checked } : entry))
                )
              }
            />
            <span>{space.name}</span>
          </label>
        ))}
        <p>Selected spaces: {selectedCount}</p>
        <p>Sync target: <code>{syncTarget}</code></p>
      </section>

      <section>
        <h2>Sync Lifecycle</h2>
        <p>Current state: <strong>{state}</strong></p>
        <button type="button" disabled={selectedCount === 0 || state === "syncing"} onClick={() => runSync(false)}>
          Start Sync
        </button>
        <button type="button" disabled={lastFailedIds.length === 0 || state === "syncing"} onClick={() => runSync(true)}>
          Retry Failed
        </button>
      </section>

      <section>
        <h2>Run Status</h2>
        <ul>
          <li>Total: {counters.total}</li>
          <li>Processed: {counters.processed}</li>
          <li>Succeeded: {counters.succeeded}</li>
          <li>Skipped: {counters.skipped}</li>
          <li>Failed: {counters.failed}</li>
        </ul>
      </section>

      <section>
        <h2>Errors</h2>
        {errors.length === 0 ? (
          <p>No sync errors.</p>
        ) : (
          <ul>
            {errors.map((error) => (
              <li key={error.documentId}>
                [{error.category}] {error.title}: {error.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
