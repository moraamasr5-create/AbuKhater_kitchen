import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuItem } from './menuService';
import { GripVertical, Flame, Star, ShoppingBag, EyeOff, Pause, Check } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onStatusChange: (id: string, status: 'available' | 'paused' | 'hidden') => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
            مخفي
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
            <span className="bg-slate-700/50 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
              {item.categories?.name || 'بدون تصنيف'}
            </span>
            <span className="flex items-center gap-1 font-mono bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
              ترتيب: {item.display_order}
            </span>
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

        <button
          onClick={() => onStatusChange(item.id, 'hidden')}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
            item.status === 'hidden'
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          مخفي
        </button>
      </div>
    </div>
  );
};
