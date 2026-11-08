"use client";

import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";
import { minimalChange } from "@/lib/text-diff";

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Ctrl+Enter / Cmd+Enter. */
  onRun?: () => void;
  "aria-label": string;
  className?: string;
}

/** Editor colors and fonts from the kit's tokens, so the editor follows the toyonix theme. */
const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--tx-code-text)",
    backgroundColor: "var(--tx-code-bg)",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "2px solid var(--tx-ring)" },
  ".cm-scroller": { fontFamily: "var(--tx-font-mono)" },
  ".cm-content": { caretColor: "var(--tx-accent)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--tx-accent)" },
  ".cm-gutters": {
    color: "var(--tx-text-muted)",
    backgroundColor: "var(--tx-code-bg)",
    borderRight: "var(--tx-border-width) solid var(--tx-border)",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "color-mix(in srgb, var(--tx-accent) 8%, transparent)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in srgb, var(--tx-accent) 25%, transparent)",
  },
});

const highlighting = HighlightStyle.define([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: "var(--tx-code-key)" },
  { tag: [tags.string, tags.content], color: "var(--tx-code-string)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--tx-accent-text)" },
  { tag: tags.comment, color: "var(--tx-text-muted)", fontStyle: "italic" },
  { tag: [tags.meta, tags.punctuation, tags.separator], color: "var(--tx-text-muted)" },
]);

/**
 * A CodeMirror 6 YAML editor. The editor owns the text while you type; when `value` changes
 * from outside (loading an example, later the canvas), only the part that differs is replaced,
 * so the cursor, scroll position and undo history survive.
 */
export function YamlEditor({ value, onChange, onRun, "aria-label": ariaLabel, className }: YamlEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Latest callbacks, so the editor is created once and never rebuilt for a new closure.
  const callbacks = useRef({ onChange, onRun });
  useEffect(() => {
    callbacks.current = { onChange, onRun };
  });

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      doc: value,
      extensions: [
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              callbacks.current.onRun?.();
              return true;
            },
          },
        ]),
        basicSetup,
        yaml(),
        syntaxHighlighting(highlighting),
        theme,
        EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
        }),
      ],
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The initial `value` is only the starting document; later values are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ariaLabel]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const change = minimalChange(editor.state.doc.toString(), value);
    if (change) editor.dispatch({ changes: change });
  }, [value]);

  return <div ref={host} className={className} />;
}
