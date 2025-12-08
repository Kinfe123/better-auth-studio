import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Image as ImageIcon,
  Italic,
  Minus,
  MousePointerClick,
  Pencil,
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
    maxWidth?: string;
    height?: string;
    borderRadius?: string;
    border?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textDecoration?: string;
    display?: string;
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

    if (tagName === 'div') {
      const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const headingTag = heading.tagName.toLowerCase();
        const headingStyles = parseStyles(heading.getAttribute('style') || '');
        blocks.push({
          id: `block-${Date.now()}-${index}`,
          type: 'heading',
          content: heading.textContent || '',
          styles: {
            fontSize:
              headingStyles.fontSize ||
              styles.fontSize ||
              (headingTag === 'h1' ? '24px' : headingTag === 'h2' ? '20px' : '18px'),
            fontWeight: headingStyles.fontWeight || styles.fontWeight || '300',
            fontStyle: headingStyles.fontStyle || styles.fontStyle || 'normal',
            color: headingStyles.color || styles.color || '#ffffff',
            backgroundColor: styles.backgroundColor || styles['background-color'] || '#000000',
            textAlign: (styles.textAlign || headingStyles.textAlign || 'center') as any,
            padding: styles.padding || '20px',
            margin: styles.margin || '0 0 30px 0',
            textDecoration: headingStyles.textDecoration || 'none',
          },
        });
        return;
      }
    }

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
          backgroundColor: styles.backgroundColor || styles['background-color'] || undefined,
          textAlign: (styles.textAlign as any) || 'left',
          padding:
            styles.padding ||
            (styles.backgroundColor || styles['background-color'] ? '8px 12px' : '0'),
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
          backgroundColor: styles.backgroundColor || styles['background-color'] || undefined,
          textAlign: (styles.textAlign as any) || 'left',
          padding:
            styles.padding ||
            (styles.backgroundColor || styles['background-color'] ? '8px 12px' : '0'),
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
    } else if (tagName === 'img' || (tagName === 'div' && element.querySelector('img'))) {
      const img = element.querySelector('img') || (element as HTMLImageElement);
      const imgStyles = tagName === 'img' ? styles : parseStyles(img.getAttribute('style') || '');
      const divStyles = tagName === 'div' ? styles : {};

      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type: 'image',
        content: '',
        styles: {
          width: imgStyles.width || divStyles.width || '70px',
          maxWidth: imgStyles.maxWidth || divStyles.maxWidth || '70px',
          height: imgStyles.height || divStyles.height || 'auto',
          margin: divStyles.margin || styles.margin || '0 0 30px 0',
          textAlign: (divStyles.textAlign || styles.textAlign || 'left') as
            | 'left'
            | 'center'
            | 'right',
        },
        attributes: {
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || '',
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
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styles[camelKey] = value;
      styles[key] = value;
    }
  });
  return styles;
};

const linkifyText = (text: string): string => {
  if (!text) return '';
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

  return text.replace(urlRegex, (match) => {
    const href = match.startsWith('http') ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${match}</a>`;
  });
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
          return `<h1 style="${styleString}">${linkifyText(block.content)}</h1>`;
        case 'paragraph':
          return `<p style="${styleString}">${linkifyText(block.content)}</p>`;
        case 'button': {
          const href = block.attributes?.href || '{{url}}';
          const buttonStyles = { ...block.styles };
          if (!buttonStyles.textDecoration) {
            buttonStyles.textDecoration = 'none';
          }
          const buttonStyleString = Object.entries(buttonStyles)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
            .join('; ');
          return `<div style="text-align: ${block.styles.textAlign || 'center'}; margin: ${block.styles.margin || '16px 0'}">
          <a href="${href}" style="display: inline-block; ${buttonStyleString};">${block.content}</a>
        </div>`;
        }
        case 'image': {
          const imageStyleString = Object.entries(block.styles)
            .filter(
              ([key, value]) =>
                value && key !== 'textAlign' && key !== 'margin' && key !== 'display'
            )
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
            .join('; ');
          const margin = block.styles.margin || '0 0 30px 0';
          const textAlign = block.styles.textAlign || 'left';
          return `<div style="margin: ${margin}; text-align: ${textAlign}">
            <img src="${block.attributes?.src || ''}" alt="${block.attributes?.alt || ''}" style="display: inline-block; ${imageStyleString}" />
          </div>`;
        }
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const editingRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isInternalUpdateRef = useRef(false);
  const lastHtmlRef = useRef<string>('');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const lastSelectedBlockRef = useRef<EmailBlock | null>(null);
  const stableSelectedBlockIdRef = useRef<string | null>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = editingBlockId !== null;
  }, [editingBlockId]);

  useEffect(() => {
    if (
      html &&
      html !== lastHtmlRef.current &&
      !isInternalUpdateRef.current &&
      !isEditingRef.current
    ) {
      const parsedBlocks = parseHtmlToBlocks(html);
      const currentSelectedId = selectedBlockId || stableSelectedBlockIdRef.current;

      setBlocks((prevBlocks) => {
        const blocksStructureChanged =
          prevBlocks.length !== parsedBlocks.length ||
          prevBlocks.some((block, index) => {
            const newBlock = parsedBlocks[index];
            return !newBlock || block.type !== newBlock.type;
          });

        if (blocksStructureChanged || prevBlocks.length === 0) {
          if (currentSelectedId && parsedBlocks.find((b) => b.id === currentSelectedId)) {
            setSelectedBlockId(currentSelectedId);
            stableSelectedBlockIdRef.current = currentSelectedId;
          } else if (currentSelectedId) {
            setSelectedBlockId(null);
            stableSelectedBlockIdRef.current = null;
          }

          return parsedBlocks;
        }

        return prevBlocks;
      });

      lastHtmlRef.current = html;
    } else if (html && html !== lastHtmlRef.current) {
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

  useEffect(() => {
    if (viewMode === 'preview' && previewIframeRef.current) {
      const iframe = previewIframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const emailHtml = html || blocksToHtml(blocks);
        iframeDoc.open();
        iframeDoc.write(emailHtml);
        iframeDoc.close();

        iframe.onload = () => {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const links = doc.querySelectorAll('a');
            links.forEach((link) => {
              link.addEventListener('click', (event) => {
                const href = link.getAttribute('href');
                if (href && href !== '{{url}}' && !href.startsWith('#')) {
                  if (href.startsWith('http://') || href.startsWith('https://')) {
                    event.preventDefault();
                    window.open(href, '_blank', 'noopener,noreferrer');
                  }
                }
              });
            });

            const body = doc.body;
            if (body) {
              const height = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                doc.documentElement.clientHeight,
                doc.documentElement.scrollHeight,
                doc.documentElement.offsetHeight
              );
              iframe.style.height = `${height}px`;
            }
          }
        };
      }
    }
  }, [viewMode, html, blocks]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  useEffect(() => {
    if (selectedBlock) {
      lastSelectedBlockRef.current = selectedBlock;
    } else if (!selectedBlockId) {
      lastSelectedBlockRef.current = null;
    }
  }, [selectedBlock, selectedBlockId]);

  useEffect(() => {
    stableSelectedBlockIdRef.current = selectedBlockId;
  }, [selectedBlockId]);

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

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
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
  }, []);

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

  const startEditing = (blockId: string, placeCursorAtEnd = false) => {
    setEditingBlockId(blockId);
    requestAnimationFrame(() => {
      const element = editingRefs.current.get(blockId);
      if (element) {
        element.focus();
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          if (placeCursorAtEnd) {
            range.selectNodeContents(element);
            range.collapse(false);
          } else {
            const clickPoint = selection.rangeCount > 0 ? selection.getRangeAt(0).startOffset : 0;
            let textNode: Node | null = null;

            if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
              textNode = element.firstChild;
            } else {
              const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
              textNode = walker.nextNode();
            }

            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const maxPosition = textNode.textContent?.length || 0;
              const safePosition = Math.min(clickPoint, maxPosition);
              range.setStart(textNode, safePosition);
              range.setEnd(textNode, safePosition);
            } else {
              range.selectNodeContents(element);
              range.collapse(true);
            }
          }
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });
  };

  const handleDoubleClick = (blockId: string) => {
    setSelectedBlockId(blockId);
    stableSelectedBlockIdRef.current = blockId;
    startEditing(blockId, true);
  };

  const handleClick = (blockId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    setSelectedBlockId(blockId);
    stableSelectedBlockIdRef.current = blockId;

    if (target.contentEditable === 'true') {
      if (editingBlockId !== blockId) {
        startEditing(blockId);
      }
    }
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
    if (e.key === 'Escape') {
      setEditingBlockId(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const getAbsoluteCursorPosition = (element: HTMLElement): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const setAbsoluteCursorPosition = (element: HTMLElement, position: number): boolean => {
    const selection = window.getSelection();
    if (!selection) return false;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    let currentPosition = 0;
    let node: Node | null = null;

    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0;
      if (currentPosition + nodeLength >= position) {
        const offset = position - currentPosition;
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      currentPosition += nodeLength;
    }

    const lastNode = element.lastChild;
    if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      range.setStart(lastNode, lastNode.textContent?.length || 0);
      range.setEnd(lastNode, lastNode.textContent?.length || 0);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }

    return false;
  };

  const handleInput = (blockId: string, newContent: string) => {
    const element = editingRefs.current.get(blockId);
    let cursorPosition = 0;

    if (element) {
      cursorPosition = getAbsoluteCursorPosition(element);
    }

    updateBlock(blockId, { content: newContent });

    requestAnimationFrame(() => {
      const updatedElement = editingRefs.current.get(blockId);
      if (updatedElement) {
        const maxPosition = updatedElement.textContent?.length || 0;
        const safePosition = Math.min(cursorPosition, maxPosition);
        setAbsoluteCursorPosition(updatedElement, safePosition);
      }
    });

    if (selectedBlockId !== blockId) {
      setSelectedBlockId(blockId);
    }
  };

  const stableBlockForSidebar =
    selectedBlock || (selectedBlockId ? lastSelectedBlockRef.current : null);

  return (
    <div className="flex-1 flex overflow-hidden h-full min-h-0">
      <div
        className="flex-1 flex flex-col overflow-hidden bg-white border-none border-white/10 min-h-0"
        style={{ minWidth: '500px' }}
      >
        <div className="p-4 border-y border-dashed border-white/10 bg-black/[93%]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="h-7 px-3 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Edit Mode"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="h-7 px-3 text-xs rounded-none border border-dashed border-white/20 hover:bg-white/10"
                title="Preview Mode"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
            </div>
            {viewMode === 'edit' && (
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
            )}
          </div>
        </div>

        {viewMode === 'edit' ? (
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
                  const showControls =
                    selectedBlockId === block.id || stableSelectedBlockIdRef.current === block.id;
                  const isEditing = editingBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      className={`relative group mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).contentEditable !== 'true') {
                          setSelectedBlockId(block.id);
                          stableSelectedBlockIdRef.current = block.id;
                        }
                      }}
                    >
                      {showControls && (
                        <div className="absolute -left-12 top-0 flex flex-col gap-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 'up');
                            }}
                            disabled={index === 0}
                            className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-black/30 hover:border-white/60 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                            className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-black/30 hover:border-white/60 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                            className="h-7 w-7 p-0 bg-black/90 border border-dashed border-white/30 hover:bg-black/30 hover:border-white/60 rounded-none transition-all flex items-center justify-center"
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
                          onClick={(e) => handleClick(block.id, e)}
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
                            backgroundColor: block.styles.backgroundColor || undefined,
                            textAlign: block.styles.textAlign || 'left',
                            padding:
                              block.styles.padding ||
                              (block.styles.backgroundColor ? '8px 12px' : '0'),
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
                          onClick={(e) => handleClick(block.id, e)}
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
                            backgroundColor: block.styles.backgroundColor || undefined,
                            textAlign: block.styles.textAlign || 'left',
                            padding:
                              block.styles.padding ||
                              (block.styles.backgroundColor ? '8px 12px' : '0'),
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
                              handleClick(block.id, e);
                            }}
                            onBlur={createBlurHandler(block.id)}
                            onKeyDown={handleKeyDown}
                            onInput={(e) =>
                              handleInput(block.id, e.currentTarget.textContent || '')
                            }
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
                        <div
                          style={{
                            margin: block.styles.margin || '0 0 30px 0',
                            textAlign: block.styles.textAlign || 'left',
                          }}
                        >
                          <img
                            src={block.attributes?.src || 'https://via.placeholder.com/600x300'}
                            alt={block.attributes?.alt || ''}
                            style={{
                              width: block.styles.width || '70px',
                              maxWidth: block.styles.maxWidth || '70px',
                              height: block.styles.height || 'auto',
                              display: 'inline-block',
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
        ) : (
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-gray-50 min-h-0"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div
              className="max-w-2xl mx-auto bg-white shadow-lg p-8"
              style={{ width: '100%', paddingBottom: '2rem' }}
            >
              <iframe
                ref={previewIframeRef}
                className="w-full border-0"
                title="Email Preview"
                style={{ minHeight: '100%', display: 'block' }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              />
            </div>
          </div>
        )}
      </div>

      {stableBlockForSidebar && viewMode === 'edit' && (
        <div
          className="w-96 h-[calc(100vh-400px)] border-l border-dashed border-white/20 bg-black/40 flex flex-col flex-shrink-0 overflow-scroll"
          style={{ minWidth: '384px', maxWidth: '384px' }}
        >
          <div className="p-4 border-b border-dashed border-white/10 bg-black/40 z-10 flex-shrink-0">
            <Label className="text-xs uppercase font-mono text-gray-400">
              {stableBlockForSidebar.type.charAt(0).toUpperCase() +
                stableBlockForSidebar.type.slice(1)}{' '}
              Properties
            </Label>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
            style={{ overscrollBehavior: 'contain', minHeight: 0 }}
          >
            {stableBlockForSidebar.type !== 'divider' && stableBlockForSidebar.type !== 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Content
                </Label>
                <Input
                  value={stableBlockForSidebar.content}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, { content: e.target.value })
                  }
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Double-click on canvas to edit inline</p>
              </div>
            )}
            {(stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph' ||
              stableBlockForSidebar.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Text Formatting
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      stableBlockForSidebar.styles.fontWeight === 'bold' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          fontWeight:
                            stableBlockForSidebar.styles.fontWeight === 'bold' ? 'normal' : 'bold',
                        },
                      })
                    }
                    className="h-8 w-8 p-0 rounded-none border border-dashed border-white/20 hover:bg-white/10"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={
                      stableBlockForSidebar.styles.fontStyle === 'italic' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          fontStyle:
                            stableBlockForSidebar.styles.fontStyle === 'italic'
                              ? 'normal'
                              : 'italic',
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
                      stableBlockForSidebar.styles.textDecoration === 'underline'
                        ? 'default'
                        : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          textDecoration:
                            stableBlockForSidebar.styles.textDecoration === 'underline'
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
                      stableBlockForSidebar.styles.textDecoration === 'line-through'
                        ? 'default'
                        : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          textDecoration:
                            stableBlockForSidebar.styles.textDecoration === 'line-through'
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

            {stableBlockForSidebar.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Link URL
                </Label>
                <Input
                  value={stableBlockForSidebar.attributes?.href || ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      attributes: { ...stableBlockForSidebar.attributes, href: e.target.value },
                    })
                  }
                  placeholder="{{url}}"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {stableBlockForSidebar.type === 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Image URL
                </Label>
                <Input
                  value={stableBlockForSidebar.attributes?.src || ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      attributes: { ...stableBlockForSidebar.attributes, src: e.target.value },
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block mt-3">
                  Alt Text
                </Label>
                <Input
                  value={stableBlockForSidebar.attributes?.alt || ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      attributes: { ...stableBlockForSidebar.attributes, alt: e.target.value },
                    })
                  }
                  placeholder="Image description"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <div className="mt-3">
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Alignment
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'left' as const, icon: AlignLeft },
                      { value: 'center' as const, icon: AlignCenter },
                      { value: 'right' as const, icon: AlignRight },
                    ].map(({ value: align, icon: Icon }) => (
                      <Button
                        key={align}
                        variant={
                          stableBlockForSidebar.styles.textAlign === align ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() =>
                          updateBlock(stableBlockForSidebar.id, {
                            styles: { ...stableBlockForSidebar.styles, textAlign: align },
                          })
                        }
                        className="flex-1 rounded-none border border-dashed border-white/20 flex items-center justify-center"
                        title={align.charAt(0).toUpperCase() + align.slice(1)}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph' ||
              stableBlockForSidebar.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Font Family
                </Label>
                <select
                  value={stableBlockForSidebar.styles.fontFamily || 'inherit'}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: { ...stableBlockForSidebar.styles, fontFamily: e.target.value },
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

            {(stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph' ||
              stableBlockForSidebar.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Font Size
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.fontSize ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        fontSize: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="16px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {stableBlockForSidebar.type !== 'divider' && stableBlockForSidebar.type !== 'image' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Text Color
                </Label>
                <Input
                  type="color"
                  value={stableBlockForSidebar.styles.color || '#333333'}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: { ...stableBlockForSidebar.styles, color: e.target.value },
                    })
                  }
                  className="h-8 w-full bg-black border border-dashed border-white/20 rounded-none"
                />
              </div>
            )}

            {(stableBlockForSidebar.type === 'button' ||
              stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Background Color
                </Label>
                <Input
                  type="color"
                  value={stableBlockForSidebar.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    const newBackgroundColor = e.target.value;
                    const currentPadding = stableBlockForSidebar.styles.padding;
                    const hasBackgroundColor =
                      newBackgroundColor && newBackgroundColor !== '#ffffff';
                    const shouldAddPadding =
                      hasBackgroundColor && (!currentPadding || currentPadding === '0');

                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        backgroundColor: hasBackgroundColor ? newBackgroundColor : undefined,
                        padding: shouldAddPadding
                          ? '8px 12px'
                          : hasBackgroundColor
                            ? currentPadding || '8px 12px'
                            : currentPadding === '8px 12px'
                              ? '0'
                              : currentPadding,
                      },
                    });
                  }}
                  className="h-8 w-full bg-black border border-dashed border-white/20 rounded-none"
                />
                {stableBlockForSidebar.styles.backgroundColor &&
                  stableBlockForSidebar.styles.backgroundColor !== '#ffffff' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentPadding = stableBlockForSidebar.styles.padding;
                        updateBlock(stableBlockForSidebar.id, {
                          styles: {
                            ...stableBlockForSidebar.styles,
                            backgroundColor: undefined,
                            padding: currentPadding === '8px 12px' ? '0' : currentPadding,
                          },
                        });
                      }}
                      className="text-xs text-gray-400 hover:text-white mt-1 rounded-none"
                    >
                      Clear Background
                    </Button>
                  )}
              </div>
            )}

            {stableBlockForSidebar.type !== 'divider' && stableBlockForSidebar.type !== 'image' && (
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
                      variant={
                        stableBlockForSidebar.styles.textAlign === align ? 'default' : 'ghost'
                      }
                      size="sm"
                      onClick={() =>
                        updateBlock(stableBlockForSidebar.id, {
                          styles: { ...stableBlockForSidebar.styles, textAlign: align },
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

            {(stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Line Height
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.lineHeight ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        lineHeight: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="1.6"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {(stableBlockForSidebar.type === 'heading' ||
              stableBlockForSidebar.type === 'paragraph' ||
              stableBlockForSidebar.type === 'button') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Letter Spacing
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.letterSpacing ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        letterSpacing: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="0px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {stableBlockForSidebar.type !== 'divider' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Margin
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.margin ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        margin: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="16px 0"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 16px 0 or 10px 20px 10px 20px</p>
              </div>
            )}

            {(stableBlockForSidebar.type === 'button' ||
              stableBlockForSidebar.type === 'heading') && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Padding
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.padding ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        padding: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="12px 30px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 12px 30px or 10px 20px 10px 20px</p>
              </div>
            )}

            {stableBlockForSidebar.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border Radius
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.borderRadius ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        borderRadius: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="4px"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
              </div>
            )}

            {stableBlockForSidebar.type === 'button' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.border ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        border: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="1px solid #000"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 1px solid #000 or none</p>
              </div>
            )}

            {stableBlockForSidebar.type === 'image' && (
              <>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Width
                  </Label>
                  <Input
                    value={stableBlockForSidebar.styles.width ?? ''}
                    onChange={(e) =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          width: e.target.value || undefined,
                        },
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
                    value={stableBlockForSidebar.styles.height ?? ''}
                    onChange={(e) =>
                      updateBlock(stableBlockForSidebar.id, {
                        styles: {
                          ...stableBlockForSidebar.styles,
                          height: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="auto"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none font-mono text-xs"
                  />
                </div>
              </>
            )}

            {stableBlockForSidebar.type === 'divider' && (
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Border Style
                </Label>
                <Input
                  value={stableBlockForSidebar.styles.border ?? ''}
                  onChange={(e) =>
                    updateBlock(stableBlockForSidebar.id, {
                      styles: {
                        ...stableBlockForSidebar.styles,
                        border: e.target.value || undefined,
                      },
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
