
'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
    Bold, Italic, List, ListOrdered, Strikethrough, Heading1, Heading2, 
    Heading3, Quote, Link as LinkIcon, Image as ImageIcon, Paintbrush, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseUpper
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { uploadFileFromServer } from '@/services/storageService';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }
  
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `event-descriptions/${Date.now()}_${file.name}`);
      
      try {
        const imageUrl = await uploadFileFromServer(formData);
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      } catch(e) {
        console.error("Image upload failed", e);
        alert("Image upload failed.");
      }
    };
  };

  return (
    <div className="border border-input rounded-t-md p-1 flex items-center gap-1 flex-wrap">
      <Select
        value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Font Family" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="monospace">Monospace</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
        </SelectContent>
      </Select>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Toggle size="sm" asChild>
        <label className="flex items-center gap-1 cursor-pointer">
            <Paintbrush className="h-4 w-4" />
            <input type="color" value={editor.getAttributes('textStyle').color || '#000000'} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="w-6 h-6 border-none bg-transparent p-0" style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', appearance: 'none'}} />
        </label>
      </Toggle>
      <Toggle size="sm" onClick={imageHandler}><ImageIcon className="h-4 w-4" /></Toggle>
    </div>
  );
};

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3],
            },
        }),
        Link.configure({
            openOnClick: false,
            autolink: true,
        }),
        Image,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        FontFamily,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none rounded-b-md border-x border-b border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[150px]',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  return (
    <div className="bg-background">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
