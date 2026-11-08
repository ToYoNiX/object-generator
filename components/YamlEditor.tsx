"use client";

import { yaml } from "@codemirror/lang-yaml";
import { EditorView, keymap } from "@codemirror/view";
import { toyonixTheme } from "@toyonix/web-kit/codemirror";
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
        // Colors, fonts and syntax colors from the kit's tokens, so the editor follows the theme.
        toyonixTheme,
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
