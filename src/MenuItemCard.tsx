import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuItem, Category } from './menuService';
import { GripVertical, Flame, ShoppingBag, EyeOff, Pause, Check, Sparkles, Loader2 } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  categories: Category[];
  onStatusChange: (id: string, status: 'available' | 'paused' | 'hidden') => void;
  onOrderChange?: (id: string, newOrder: number) => void;
  onLocalHide?: (id: string) => void;
  onCategoryChange?: (id: string, category_id: string) => void;
  onGenerateImage?: (item: { id: string; name: string; category_name?: string }) => void;
  isGenerating?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, categories, onStatusChange, onOrderChange, onLocalHide, onCategoryChange, onGenerateImage, isGenerating }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [orderValue, setOrderValue] = React.useState(item.display_order.toString());
  const [showHiddenMenu, setShowHiddenMenu] = React.useState(false);
  const hiddenMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setOrderValue(item.display_order.toString());
  }, [item.display_order]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hiddenMenuRef.current && !hiddenMenuRef.current.contains(event.target as Node)) {
        setShowHiddenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : item.status === 'paused' ? 0.75 : 1,
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            متاح
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            غير متاح حالياً
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            مخفي للجميع
          </span>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col justify-between bg-slate-800 border rounded-2xl overflow-hidden transition-all duration-300 ${
        item.status === 'paused'
          ? 'border-amber-500/25 bg-slate-800/65 grayscale-[35%]'
          : item.status === 'hidden'
          ? 'border-slate-700/50 opacity-60'
          : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Top action details */}
      <div className="p-4 flex flex-col gap-3 h-full">
        {/* Card Header image & stats */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 group">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900/80">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* AI Generate overlay — visible on hover or while loading */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute inset-0 flex items-end justify-center pb-3 transition-opacity duration-200 ${
              isGenerating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-violet-500/40 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                جاري توليد الصورة...
              </div>
            ) : (
              <button
                onClick={() =>
                  onGenerateImage &&
                  onGenerateImage({
                    id: item.id,
                    name: item.name,
                    category_name: item.categories?.name || '',
                  })
                }
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-violet-600/90 border border-slate-700 hover:border-violet-500 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg transition-all duration-200"
                title="توليد صورة بالذكاء الاصطناعي"
              >
                <Sparkles className="w-3.5 h-3.5" />
                نسج صورة AI
              </button>
            )}
          </div>

          {/* Indicators */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            {getStatusBadge()}
            {item.is_popular && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Flame className="w-3.5 h-3.5 fill-rose-400/20" />
                شائع
              </span>
            )}
          </div>

          {/* Dnd handle overlay */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-2 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing border border-slate-700/60 shadow-lg transition-colors"
            title="اسحب لترتيب الصنف"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-lg text-slate-100 line-clamp-1">{item.name}</h3>
            <span className="font-black text-rose-400 whitespace-nowrap">
              {item.price} <span className="text-xs font-medium text-slate-400">ر.س</span>
            </span>
          </div>

          {item.description && (
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {item.description}
            </p>
          )}

          {/* Category & Display Order indicators */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
            <div
              className="relative bg-slate-700/50 rounded border border-slate-700 focus-within:border-rose-500/50 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <select
                value={item.category_id}
                onChange={(e) => {
                  if (onCategoryChange && e.target.value !== item.category_id) {
                    onCategoryChange(item.id, e.target.value);
                  }
                }}
                className="appearance-none bg-transparent text-[11px] font-medium text-slate-300 px-2 py-0.5 pr-5 cursor-pointer outline-none w-full"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-800 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">▾</span>
            </div>
            <div 
              className="flex items-center gap-1 font-mono bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800 focus-within:border-rose-500/50 transition-colors"
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when interacting with input
            >
              <span className="text-slate-400">ترتيب:</span>
              <input
                type="number"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                onBlur={() => {
                  const val = parseInt(orderValue, 10);
                  if (!isNaN(val) && val !== item.display_order && onOrderChange) {
                    onOrderChange(item.id, val);
                  } else {
                    setOrderValue(item.display_order.toString());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-10 bg-transparent border-none outline-none text-slate-200 text-center text-[11px] font-bold p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (Footer) */}
      <div className="grid grid-cols-3 border-t border-slate-700/60 bg-slate-900/40 p-2 gap-1.5">
        <button
          onClick={() => onStatusChange(item.id, 'available')}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
            item.status === 'available'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          متاح
        </button>

        <button
          onClick={() => onStatusChange(item.id, 'paused')}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
            item.status === 'paused'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <Pause className="w-3.5 h-3.5" />
          متوقف
        </button>

        <div className="relative flex flex-col" ref={hiddenMenuRef}>
          <button
            onClick={() => setShowHiddenMenu(!showHiddenMenu)}
            className={`w-full flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
              item.status === 'hidden'
                ? 'bg-slate-700 text-slate-300 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            مخفي
          </button>
          
          {showHiddenMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10 flex flex-col whitespace-nowrap min-w-max">
              <button
                onClick={() => {
                  if (onLocalHide) onLocalHide(item.id);
                  setShowHiddenMenu(false);
                }}
                className="text-right px-3 py-2.5 text-xs hover:bg-slate-700 transition-colors text-slate-400"
              >
                اخفاء (من الامامية فقط)
              </button>
              <div className="h-px bg-slate-700/50"></div>
              <button
                onClick={() => {
                  onStatusChange(item.id, 'hidden');
                  setShowHiddenMenu(false);
                }}
                className={`text-right px-3 py-2.5 text-xs hover:bg-slate-700 transition-colors ${item.status === 'hidden' ? 'bg-slate-700/50 text-slate-200 font-bold' : 'text-slate-400'}`}
              >
                للجميع
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
