import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from './menuService';
import { GripVertical, Folder } from 'lucide-react';

interface CategorySorterProps {
  categories: Category[];
  onOrderChange: (newOrder: { id: string; display_order: number }[]) => void;
}

export const CategorySorter: React.FC<CategorySorterProps> = ({ categories, onOrderChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((item) => item.id === active.id);
    const newIndex = categories.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Map to new display order values starting from 1
    const updated = reordered.map((cat, index) => ({
      id: cat.id,
      display_order: index + 1,
    }));

    onOrderChange(updated);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col gap-1.5 mb-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Folder className="w-5 h-5 text-rose-500" />
          ترتيب تصنيفات المنيو
        </h2>
        <p className="text-slate-400 text-xs">
          اسحب وأفلت التصنيفات بالترتيب الذي ترغب بظهوره للعملاء في تطبيق الطلب.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {categories.map((cat) => (
              <SortableCategoryRow key={cat.id} category={cat} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

interface SortableCategoryRowProps {
  category: Category;
}

const SortableCategoryRow: React.FC<SortableCategoryRowProps> = ({ category }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3.5 bg-slate-900 border rounded-xl transition-all ${
        isDragging
          ? 'border-rose-500 bg-slate-900/90 shadow-2xl scale-[1.02]'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-slate-200 text-sm block">{category.name}</span>
          <span className="text-slate-500 text-[10px] font-mono mt-0.5 block">{category.slug}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 font-mono text-slate-400">
          تـرتـيـب: {category.display_order}
        </span>
      </div>
    </div>
  );
};
