"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function JournalEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your thoughts...</p>",
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex gap-2">
        <button className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold" onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </button>
        <button className="rounded-md bg-slate-100 px-3 py-1 text-sm italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button className="rounded-md bg-slate-100 px-3 py-1 text-sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
    </div>
  );
}
