import React, { useRef, useEffect } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Editor({ value, onChange, className }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      // Ensure text direction is always left-to-right
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.direction = 'ltr';
        span.style.unicodeBidi = 'embed';
        range.surroundContents(span);
      }
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`border rounded-lg bg-white ${className || ''}`}>
      <div className="border-b p-2 flex gap-2 bg-gray-50">
        <button
          onClick={() => execCommand('bold')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Itálico"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Sublinhado"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          onClick={() => execCommand('justifyLeft')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Alinhar à esquerda"
        >
          ⇤
        </button>
        <button
          onClick={() => execCommand('justifyCenter')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Centralizar"
        >
          ⇔
        </button>
        <button
          onClick={() => execCommand('justifyRight')}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          type="button"
          title="Alinhar à direita"
        >
          ⇥
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'embed'
        }}
        dir="ltr"
        lang="pt-BR"
        spellCheck="true"
      />
    </div>
  );
}
