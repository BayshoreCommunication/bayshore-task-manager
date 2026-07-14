"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import MenuBar from "./MenuBar";
import { Editor } from "@tiptap/react";
import { useEffect } from "react";
import "./style.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({}),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200",
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class: "text-blue-500 underline",
          rel: null,
          target: "_blank",
        },
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: "Write job description...",
      }),
    ],
    editorProps: {
      attributes: { class: "py-2 px-3 rounded-md border min-h-36 bg-slate-50" },
    },
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
};

export default TextEditor;
