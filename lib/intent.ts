/**
 * What a link into the workspace asks for: /workspace/?new starts a new object,
 * /workspace/?example=<id> opens an example. Plain /workspace/ continues the draft.
 */
export type WorkspaceIntent = { kind: "new" } | { kind: "example"; id: string };

export function readIntent(search: string): WorkspaceIntent | null {
  const params = new URLSearchParams(search);
  const example = params.get("example");
  if (example) return { kind: "example", id: example };
  if (params.has("new")) return { kind: "new" };
  return null;
}
