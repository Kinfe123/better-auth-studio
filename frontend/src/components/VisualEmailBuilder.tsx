import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  Image as ImageIcon,
  Italic,
  Minus,
  MousePointerClick,
  Strikethrough,
  Trash2,
  Type,
  Underline,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export type BlockType = 'heading' | 'paragraph' | 'button' | 'image' | 'divider';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    padding?: string;
    margin?: string;
    width?: string;
    height?: string;
    borderRadius?: string;
    border?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textDecoration?: string;
  };
  attributes?: {
    href?: string;
    src?: string;
    alt?: string;
  };
}

interface VisualEmailBuilderProps {
  html: string;
  onChange: (html: string) => void;
}

const parseHtmlToBlocks = (html: string): EmailBlock[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    html.includes('<body') ? html : `<body>${html}</body>`,
    'text/html'
  );
  const body = doc.body;
  const blocks: EmailBlock[] = [];

  Array.from(body.children).forEach((element, index) => {
    const tagName = element.tagName.toLowerCase();
    const styles = parseStyles(element.getAttribute('style') || '');

    if (
      tagName === 'h1' ||
      tagName === 'h2' ||
      tagName === 'h3' ||
      tagName === 'h4' ||
      tagName === 'h5' ||
      tagName === 'h6'
    ) {
      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'heading',
        content: element.textContent || '',
        styles: {
          fontSize:
            styles.fontSize || (tagName === 'h1' ? '32px' : tagName === 'h2' ? '24px' : '20px'),
          fontWeight: styles.fontWeight || 'bold',
          fontStyle: styles.fontStyle || 'normal',
          color: styles.color || '#000000',
          textAlign: (styles.textAlign as any) || 'left',
          padding: styles.padding || '0',
          margin: styles.margin || '0 0 16px 0',
          textDecoration: styles.textDecoration || 'none',
        },
      });
    } else if (tagName === 'p') {
      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'paragraph',
        content: element.textContent || '',
        styles: {
          fontSize: styles.fontSize || '16px',
          fontWeight: styles.fontWeight || 'normal',
          fontStyle: styles.fontStyle || 'normal',
          color: styles.color || '#333333',
          textAlign: (styles.textAlign as any) || 'left',
          padding: styles.padding || '0',
          margin: styles.margin || '0 0 16px 0',
          textDecoration: styles.textDecoration || 'none',
        },
      });
    } else if (tagName === 'a' || (tagName === 'div' && element.querySelector('a'))) {
      const link = element.querySelector('a') || (element as HTMLAnchorElement);
      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'button',
        content: link.textContent || '',
        styles: {
          fontSize: styles.fontSize || '16px',
          fontWeight: styles.fontWeight || 'normal',
          fontStyle: styles.fontStyle || 'normal',
          color: styles.color || '#ffffff',
          backgroundColor: styles.backgroundColor || '#000000',
          textAlign: (styles.textAlign as any) || 'center',
          padding: styles.padding || '12px 30px',
          margin: styles.margin || '16px 0',
          borderRadius: styles.borderRadius || '4px',
          textDecoration: styles.textDecoration || 'none',
        },
        attributes: {
          href: link.getAttribute('href') || '',
        },
      });
    } else if (tagName === 'img') {
      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'image',
        content: '',
        styles: {
          width: styles.width || '100%',
          height: styles.height || 'auto',
          margin: styles.margin || '16px 0',
        },
        attributes: {
          src: (element as HTMLImageElement).src || '',
          alt: (element as HTMLImageElement).alt || '',
        },
      });
    } else if (tagName === 'hr') {
      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'divider',
        content: '',
        styles: {
          border: styles.border || '1px solid #eeeeee',
          margin: styles.margin || '30px 0',
        },
      });
    }
  });

  return blocks.length > 0
    ? blocks
    : [
        {
          id: `block-${Date.now()}`,
          type: 'paragraph',
          content: 'Click to edit',
          styles: {},
        },
      ];
};

const parseStyles = (styleString: string): Record<string, string> => {
  const styles: Record<string, string> = {};
  styleString.split(';').forEach((style) => {
    const [key, value] = style.split(':').map((s) => s.trim());
    if (key && value) {
      styles[key] = value;
    }
  });
  return styles;
};

const blocksToHtml = (blocks: EmailBlock[]): string => {
  const bodyContent = blocks
    .map((block) => {
      const styleString = Object.entries(block.styles)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (block.type) {
        case 'heading':
          return `<h1 style="${styleString}">${block.content}</h1>`;
        case 'paragraph':
          return `<p style="${styleString}">${block.content}</p>`;
        case 'button': {
          const href = block.attributes?.href || '{{url}}';
          // For buttons, we need to explicitly set text-decoration to preserve user's choice
          const buttonStyles = { ...block.styles };
          if (!buttonStyles.textDecoration) {
            buttonStyles.textDecoration = 'none'; // Default for buttons to remove link underline
          }
          const buttonStyleString = Object.entries(buttonStyles)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
            .join('; ');
          return `<div style="text-align: ${block.styles.textAlign || 'center'}; margin: ${block.styles.margin || '16px 0'}">
          <a href="${href}" style="display: inline-block; ${buttonStyleString};">${block.content}</a>
        </div>`;
        }
        case 'image':
          return `<img src="${block.attributes?.src || ''}" alt="${block.attributes?.alt || ''}" style="${styleString}" />`;
        case 'divider':
          return `<hr style="${styleString}" />`;
        default:
          return '';
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
${bodyContent}
</body>
</html>`;
};

export default function VisualEmailBuilder({ html, onChange }: VisualEmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const editingRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isInternalUpdateRef = useRef(false);
  const lastHtmlRef = useRef<string>('');

  useEffect(() => {
    if (html && html !== lastHtmlRef.current && !isInternalUpdateRef.current) {
      const parsedBlocks = parseHtmlToBlocks(html);
      const currentSelectedId = selectedBlockId;
      setBlocks(parsedBlocks);

      if (currentSelectedId && parsedBlocks.find((b) => b.id === currentSelectedId)) {
        setSelectedBlockId(currentSelectedId);
      }

      lastHtmlRef.current = html;
    }
  }, [html, selectedBlockId]);

  useEffect(() => {
    if (blocks.length > 0) {
      isInternalUpdateRef.current = true;
      const newHtml = blocksToHtml(blocks);
      lastHtmlRef.current = newHtml;
      onChange(newHtml);
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);
    }
  }, [blocks, onChange]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const updateBlock = useCallback((blockId: string, updates: Partial<EmailBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, ...updates } : block))
    );
  }, []);

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content:
        type === 'button'
          ? 'Button Text'
          : type === 'heading'
            ? 'Heading'
            : type === 'paragraph'
              ? 'Paragraph text'
              : '',
      styles: {
        fontSize: type === 'heading' ? '24px' : '16px',
        color: type === 'button' ? '#ffffff' : '#333333',
        backgroundColor: type === 'button' ? '#000000' : undefined,
        textAlign: type === 'button' ? 'center' : 'left',
        padding: type === 'button' ? '12px 30px' : '0',
        margin: '16px 0',
        borderRadius: type === 'button' ? '4px' : undefined,
      },
      attributes:
        type === 'button'
          ? { href: '{{url}}' }
          : type === 'image'
            ? { src: '', alt: '' }
            : undefined,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newBlocks = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const newBlock: EmailBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const index = blocks.findIndex((b) => b.id === blockId);
    setBlocks((prev) => [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)]);
    setSelectedBlockId(newBlock.id);
  };

  const handleDoubleClick = (blockId: string) => {
    setEditingBlockId(blockId);
    setTimeout(() => {
      const element = editingRefs.current.get(blockId);
      if (element) {
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const createBlurHandler = (blockId: string) => {
    return () => {
      setEditingBlockId(null);
      if (selectedBlockId !== blockId) {
        setSelectedBlockId(blockId);
      }
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingBlockId(null);
    }
    if (e.key === 'Escape') {
      setEditingBlockId(null);
    }
  };

  const handleInput = (blockId: string, newContent: string) => {
    const element = editingRefs.current.get(blockId);
    let cursorPosition = 0;
    if (element) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorPosition = range.startOffset;
      }
    }

    updateBlock(blockId, { content: newContent });

    setTimeout(() => {
      const updatedElement = editingRefs.current.get(blockId);
      if (updatedElement && cursorPosition > 0) {
        const range = document.createRange();
        const selection = window.getSelection();

        try {
          if (updatedElement.firstChild) {
            const textNode = updatedElement.firstChild;
            const maxPosition = textNode.textContent?.length || 0;
            const safePosition = Math.min(cursorPosition, maxPosition);
            range.setStart(textNode, safePosition);
            range.setEnd(textNode, safePosition);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        } catch (e) {
          updatedElement.focus();
        }
      }
    }, 0);

    if (selectedBlockId !== blockId) {
      setSelectedBlockId(blockId);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full min-h-0">
      <div
        className="flex-1 flex flex-col overflow-hidden bg-white border-r border-dashed border-white/20 min-h-0"
        style={{ minWidth: '500px' }}
      >
        <div className="p-4 border-y border-dashed border-white/10 bg-black/90">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase font-mono text-gray-400">Email Editor</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('heading')}
                className="h-7 px-2 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Add Heading"
              >
                <Type className="w-3 h-3 mr-1" />
                Heading
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('paragraph')}
                className="h-7 px-2 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Add Paragraph"
              >
                <Type className="w-3 h-3 mr-1" />
                Text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('button')}
                className="h-7 px-2 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Add Button"
              >
                <MousePointerClick className="w-3 h-3 mr-1" />
                Button
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('image')}
                className="h-7 px-2 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Add Image"
              >
                <ImageIcon className="w-3 h-3 mr-1" />
                Image
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('divider')}
                className="h-7 px-2 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Add Divider"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-gray-50 min-h-0"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            className="max-w-2xl mx-auto bg-white shadow-lg p-8"
            style={{ width: '100%', paddingBottom: '2rem' }}
          >
            {blocks.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-sm mb-4">
                  No blocks yet. Click the buttons above to add content.
                </p>
              </div>
            ) : (
              blocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;
                const isEditing = editingBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    className={`relative group mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).contentEditable !== 'true') {
                        setSelectedBlockId(block.id);
                      }
                    }}
                  >
                    {isSelected && (
                      <div className="absolute -left-12 top-0 flex flex-col gap-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'up');
                          }}
                          disabled={index === 0}
                          className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-white/30 hover:border-white/60 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'down');
                          }}
                          disabled={index === blocks.length - 1}
                          className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-white/30 hover:border-white/60 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(block.id);
                          }}
                          className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-white/30 hover:border-white/60 rounded-none transition-all flex items-center justify-center"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                          }}
                          className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-red-500/40 hover:border-red-500/70 rounded-none transition-all flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    {block.type === 'heading' && (
                      <h1
                        ref={(el) => {
                          if (el) editingRefs.current.set(block.id, el);
                          else editingRefs.current.delete(block.id);
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onDoubleClick={() => {
                          setSelectedBlockId(block.id);
                          handleDoubleClick(block.id);
                        }}
                        onBlur={createBlurHandler(block.id)}
                        onKeyDown={handleKeyDown}
                        onInput={(e) => handleInput(block.id, e.currentTarget.textContent || '')}
                        style={{
                          fontSize: block.styles.fontSize || '24px',
                          fontWeight: block.styles.fontWeight || 'bold',
                          fontStyle: block.styles.fontStyle || 'normal',
                          fontFamily: block.styles.fontFamily || 'inherit',
                          color: block.styles.color || '#000000',
                          textAlign: block.styles.textAlign || 'left',
                          padding: block.styles.padding || '0',
                          margin: block.styles.margin || '0 0 16px 0',
                          lineHeight: block.styles.lineHeight || '1.2',
                          letterSpacing: block.styles.letterSpacing || '0',
                          textDecoration: block.styles.textDecoration || 'none',
                          outline: isEditing ? '2px dashed #3b82f6' : 'none',
                          minHeight: '1.5em',
                        }}
                      >
                        {block.content}
                      </h1>
                    )}

                    {block.type === 'paragraph' && (
                      <p
                        ref={(el) => {
                          if (el) editingRefs.current.set(block.id, el);
                          else editingRefs.current.delete(block.id);
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onDoubleClick={() => {
                          setSelectedBlockId(block.id);
                          handleDoubleClick(block.id);
                        }}
                        onBlur={createBlurHandler(block.id)}
                        onKeyDown={handleKeyDown}
                        onInput={(e) => handleInput(block.id, e.currentTarget.textContent || '')}
                        style={{
                          fontSize: block.styles.fontSize || '16px',
                          fontWeight: block.styles.fontWeight || 'normal',
                          fontStyle: block.styles.fontStyle || 'normal',
                          fontFamily: block.styles.fontFamily || 'inherit',
                          color: block.styles.color || '#333333',
                          textAlign: block.styles.textAlign || 'left',
                          padding: block.styles.padding || '0',
                          margin: block.styles.margin || '0 0 16px 0',
                          lineHeight: block.styles.lineHeight || '1.6',
                          letterSpacing: block.styles.letterSpacing || '0',
                          textDecoration: block.styles.textDecoration || 'none',
                          outline: isEditing ? '2px dashed #3b82f6' : 'none',
                          minHeight: '1.5em',
                        }}
                      >
                        {block.content}
                      </p>
                    )}

                    {block.type === 'button' && (
                      <div
                        style={{
                          textAlign: block.styles.textAlign || 'center',
                          margin: block.styles.margin || '16px 0',
                        }}
                        onClick={(e) => {
                          if (isSelected || isEditing) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        <span
                          ref={(el) => {
                            if (el) editingRefs.current.set(block.id, el);
                            else editingRefs.current.delete(block.id);
                          }}
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedBlockId(block.id);
                            handleDoubleClick(block.id);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isEditing) {
                              setSelectedBlockId(block.id);
                            }
                          }}
                          onBlur={createBlurHandler(block.id)}
                          onKeyDown={handleKeyDown}
                          onInput={(e) => handleInput(block.id, e.currentTarget.textContent || '')}
                          style={{
                            display: 'inline-block',
                            fontSize: block.styles.fontSize || '16px',
                            fontWeight: block.styles.fontWeight || 'normal',
                            fontStyle: block.styles.fontStyle || 'normal',
                            fontFamily: block.styles.fontFamily || 'inherit',
                            color: block.styles.color || '#ffffff',
                            backgroundColor: block.styles.backgroundColor || '#000000',
                            padding: block.styles.padding || '12px 30px',
                            borderRadius: block.styles.borderRadius || '4px',
                            border: block.styles.border || 'none',
                            letterSpacing: block.styles.letterSpacing || '0',
                            textDecoration: block.styles.textDecoration || 'none',
                            outline: isEditing
                              ? '2px dashed #3b82f6'
                              : isSelected
                                ? '2px solid #3b82f6'
                                : 'none',
                            minWidth: '100px',
                            cursor: isEditing ? 'text' : 'default',
                            userSelect: 'text',
                            transition: 'border-radius 0.2s ease',
                          }}
                        >
                          {block.content}
                        </span>
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div style={{ margin: block.styles.margin || '16px 0', textAlign: 'center' }}>
                        <img
                          src={block.attributes?.src || 'https://via.placeholder.com/600x300'}
                          alt={block.attributes?.alt || ''}
                          style={{
                            width: block.styles.width || '100%',
                            height: block.styles.height || 'auto',
                            maxWidth: '100%',
                            outline: isSelected ? '2px dashed #3b82f6' : 'none',
                          }}
                        />
                      </div>
                    )}

                    {block.type === 'divider' && (
                      <hr
                        style={{
                          border: block.styles.border || '1px solid #eeeeee',
                          margin: block.styles.margin || '30px 0',
                          outline: isSelected ? '2px dashed #3b82f6' : 'none',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedBlock && (
        <div
          className="w-96 h-[calc(100vh-400px)] border-l border-dashed border-white/20 bg-black/40 flex flex-col flex-shrink-0 overflow-scroll"
          style={{ minWidth: '384px', maxWidth: '384px' }}
        >
          <div className="p-4 border-b border-dashed border-white/10 bg-black/40 z-10 flex-shrink-0">
            <Label className="text-xs uppercase font-mono text-gray-400">
              {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Properties
            </Label>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
            style={{ overscrollBehavior: 'contain', minHeight: 0 }}
          >
            {selectedBlock.type !== 'divider' && selectedBlock.type !== 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Content
                </Label>
                <Input
                  value={selectedBlock.content}
                  onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Double-click on canvas to edit inline</p>
              </div>
            )}
            {(selectedBlock.type === 'heading' ||
              selectedBlock.type === 'paragraph' ||
              selectedBlock.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Text Formatting
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedBlock.styles.fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      updateBlock(selectedBlock.id, {
                        styles: {
                          ...selectedBlock.styles,
                          fontWeight:
                            selectedBlock.styles.fontWeight === 'bold' ? 'normal' : 'bold',
                        },
                      })
                    }
                    className="h-8 w-8 p-0 rounded-none border border-dashed border-white/20 hover:bg-white/10"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedBlock.styles.fontStyle === 'italic' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      updateBlock(selectedBlock.id, {
                        styles: {
                          ...selectedBlock.styles,
                          fontStyle:
                            selectedBlock.styles.fontStyle === 'italic' ? 'normal' : 'italic',
                        },
                      })
                    }
                    className="h-8 w-8 p-0 rounded-none border border-dashed border-white/20 hover:bg-white/10"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={
                      selectedBlock.styles.textDecoration === 'underline' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(selectedBlock.id, {
                        styles: {
                          ...selectedBlock.styles,
                          textDecoration:
                            selectedBlock.styles.textDecoration === 'underline'
                              ? 'none'
                              : 'underline',
                        },
                      })
                    }
                    className="h-8 w-8 p-0 rounded-none border border-dashed border-white/20 hover:bg-white/10"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={
                      selectedBlock.styles.textDecoration === 'line-through' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(selectedBlock.id, {
                        styles: {
                          ...selectedBlock.styles,
                          textDecoration:
                            selectedBlock.styles.textDecoration === 'line-through'
                              ? 'none'
                              : 'line-through',
                        },
                      })
                    }
                    className="h-8 w-8 p-0 rounded-none border border-dashed border-white/20 hover:bg-white/10"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedBlock.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Link URL
                </Label>
                <Input
                  value={selectedBlock.attributes?.href || ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      attributes: { ...selectedBlock.attributes, href: e.target.value },
                    })
                  }
                  placeholder="{{url}}"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {selectedBlock.type === 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Image URL
                </Label>
                <Input
                  value={selectedBlock.attributes?.src || ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      attributes: { ...selectedBlock.attributes, src: e.target.value },
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block mt-3">
                  Alt Text
                </Label>
                <Input
                  value={selectedBlock.attributes?.alt || ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      attributes: { ...selectedBlock.attributes, alt: e.target.value },
                    })
                  }
                  placeholder="Image description"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {(selectedBlock.type === 'heading' ||
              selectedBlock.type === 'paragraph' ||
              selectedBlock.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Font Family
                </Label>
                <select
                  value={selectedBlock.styles.fontFamily || 'inherit'}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, fontFamily: e.target.value },
                    })
                  }
                  className="w-full bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs p-2 focus:outline-none focus:border-white/40"
                >
                  <option value="inherit">System Default</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                </select>
              </div>
            )}

            {(selectedBlock.type === 'heading' ||
              selectedBlock.type === 'paragraph' ||
              selectedBlock.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Font Size
                </Label>
                <Input
                  value={selectedBlock.styles.fontSize ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, fontSize: e.target.value || undefined },
                    })
                  }
                  placeholder="16px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {selectedBlock.type !== 'divider' && selectedBlock.type !== 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Text Color
                </Label>
                <Input
                  type="color"
                  value={selectedBlock.styles.color || '#333333'}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, color: e.target.value },
                    })
                  }
                  className="h-8 w-full bg-black border border-dashed border-white/20 rounded-none"
                />
              </div>
            )}

            {(selectedBlock.type === 'button' || selectedBlock.type === 'heading') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Background Color
                </Label>
                <Input
                  type="color"
                  value={selectedBlock.styles.backgroundColor || '#000000'}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, backgroundColor: e.target.value },
                    })
                  }
                  className="h-8 w-full bg-black border border-dashed border-white/20 rounded-none"
                />
              </div>
            )}

            {selectedBlock.type !== 'divider' && selectedBlock.type !== 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Text Align
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: 'left' as const, icon: AlignLeft },
                    { value: 'center' as const, icon: AlignCenter },
                    { value: 'right' as const, icon: AlignRight },
                  ].map(({ value: align, icon: Icon }) => (
                    <Button
                      key={align}
                      variant={selectedBlock.styles.textAlign === align ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        updateBlock(selectedBlock.id, {
                          styles: { ...selectedBlock.styles, textAlign: align },
                        })
                      }
                      className="flex-1 rounded-none border border-dashed border-white/20 flex items-center justify-center"
                      title={align}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Line Height
                </Label>
                <Input
                  value={selectedBlock.styles.lineHeight ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, lineHeight: e.target.value || undefined },
                    })
                  }
                  placeholder="1.6"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {(selectedBlock.type === 'heading' ||
              selectedBlock.type === 'paragraph' ||
              selectedBlock.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Letter Spacing
                </Label>
                <Input
                  value={selectedBlock.styles.letterSpacing ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: {
                        ...selectedBlock.styles,
                        letterSpacing: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="0px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {selectedBlock.type !== 'divider' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Margin
                </Label>
                <Input
                  value={selectedBlock.styles.margin ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, margin: e.target.value || undefined },
                    })
                  }
                  placeholder="16px 0"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 16px 0 or 10px 20px 10px 20px</p>
              </div>
            )}

            {(selectedBlock.type === 'button' || selectedBlock.type === 'heading') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Padding
                </Label>
                <Input
                  value={selectedBlock.styles.padding ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, padding: e.target.value || undefined },
                    })
                  }
                  placeholder="12px 30px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 12px 30px or 10px 20px 10px 20px</p>
              </div>
            )}

            {selectedBlock.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border Radius
                </Label>
                <Input
                  value={selectedBlock.styles.borderRadius ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: {
                        ...selectedBlock.styles,
                        borderRadius: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="4px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {selectedBlock.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border
                </Label>
                <Input
                  value={selectedBlock.styles.border ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, border: e.target.value || undefined },
                    })
                  }
                  placeholder="1px solid #000"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 1px solid #000 or none</p>
              </div>
            )}

            {selectedBlock.type === 'image' && (
              <>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Width
                  </Label>
                  <Input
                    value={selectedBlock.styles.width ?? ''}
                    onChange={(e) =>
                      updateBlock(selectedBlock.id, {
                        styles: { ...selectedBlock.styles, width: e.target.value || undefined },
                      })
                    }
                    placeholder="100%"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Height
                  </Label>
                  <Input
                    value={selectedBlock.styles.height ?? ''}
                    onChange={(e) =>
                      updateBlock(selectedBlock.id, {
                        styles: { ...selectedBlock.styles, height: e.target.value || undefined },
                      })
                    }
                    placeholder="auto"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                  />
                </div>
              </>
            )}

            {selectedBlock.type === 'divider' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border Style
                </Label>
                <Input
                  value={selectedBlock.styles.border ?? ''}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, border: e.target.value || undefined },
                    })
                  }
                  placeholder="1px solid #eeeeee"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 2px dashed #ccc</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
