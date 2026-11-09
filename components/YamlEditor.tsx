"use client";

import { yaml } from "@codemirror/lang-yaml";
import { RangeSetBuilder, StateEffect, StateField, type EditorState } from "@codemirror/state";
import { Decoration, EditorView, keymap, type DecorationSet } from "@codemirror/view";
import { toyonixTheme } from "@toyonix/web-kit/codemirror";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";
import { minimalChange } from "@/lib/text-diff";

/** A stretch of the text, as character offsets. */
export interface TextRange {
  from: number;
  to: number;
}

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Ctrl+Enter / Cmd+Enter. */
  onRun?: () => void;
  /** Lines to mark, e.g. the YAML of the part selected on the canvas. */
  highlight?: TextRange | null;
  /**
   * What the highlight is of (e.g. the selected part). When it changes, the highlight is
   * scrolled into view; while it stays the same (the user typing), the editor doesn't jump.
   */
  highlightKey?: string | null;
  "aria-label": string;
  className?: string;
}

const setHighlight = StateEffect.define<TextRange | null>();
const highlightedLine = Decoration.line({ class: "og-yaml-highlight" });

/** One line decoration for every line the range touches. */
function highlightLines(state: EditorState, range: TextRange | null): DecorationSet {
  if (!range) return Decoration.none;
  const end = state.doc.length;
  const first = state.doc.lineAt(Math.min(range.from, end)).number;
  const last = state.doc.lineAt(Math.min(Math.max(range.to - 1, range.from), end)).number;
  const builder = new RangeSetBuilder<Decoration>();
  for (let number = first; number <= last; number++) {
    const line = state.doc.line(number);
    builder.add(line.from, line.from, highlightedLine);
  }
  return builder.finish();
}

/** The highlighted lines: replaced by a setHighlight effect, kept in place through edits. */
const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(lines, transaction) {
    let next = lines.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setHighlight)) next = highlightLines(transaction.state, effect.value);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * A CodeMirror 6 YAML editor. The editor owns the text while you type; when `value` changes
 * from outside (loading an example, the canvas), only the part that differs is replaced, so the
 * cursor, scroll position and undo history survive. `highlight` marks lines (the selected part).
 */
export function YamlEditor({
  value,
  onChange,
  onRun,
  highlight = null,
  highlightKey = null,
  "aria-label": ariaLabel,
  className,
}: YamlEditorProps) {
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
        highlightField,
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

  // Re-mark the lines whenever the range moves (edits shift it); scroll only for a new key.
  const shownKey = useRef<string | null>(null);
  const from = highlight?.from;
  const to = highlight?.to;
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const range = from !== undefined && to !== undefined ? { from, to } : null;
    const scroll = range && highlightKey !== shownKey.current;
    shownKey.current = highlightKey;
    editor.dispatch({
      effects: [
        setHighlight.of(range),
        ...(scroll
          ? [EditorView.scrollIntoView(Math.min(range.from, editor.state.doc.length), { y: "center" })]
          : []),
      ],
    });
  }, [from, to, highlightKey]);

  return <div ref={host} className={className} />;
}
