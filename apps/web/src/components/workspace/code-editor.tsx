"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
}

export default function CodeEditor({
  value,
  language = "typescript",
  onChange,
}: CodeEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={(value) => onChange?.(value ?? "")}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          automaticLayout: true,
          padding: {
            top: 12,
          },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
