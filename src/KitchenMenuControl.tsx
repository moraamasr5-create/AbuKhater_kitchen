import React, { useState } from 'react';
import { useMenuItems } from './useMenuItems';
import { useCategories } from './useCategories';
import { MenuItemCard } from './MenuItemCard';
import { CategorySorter } from './CategorySorter';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Search,
  Filter,
  CheckCircle2,
  PauseCircle,
  EyeOff,
  Flame,
  LayoutGrid,
  RefreshCw,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

export const KitchenMenuControl: React.FC = () => {
  const {
    menuItems,
    isLoading: isItemsLoading,
    error: itemsError,
    updateStatus,
    updateMenuItemsOrder,
  } = useMenuItems();

  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    updateCategoriesOrder,
  } = useCategories();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'paused' | 'hidden' | 'popular'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Simple Notification/Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard and Mouse pointer sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Ensure regular clicks aren't registered as drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Status handler with Optimistic Toast message
  const handleStatusChange = (id: string, status: 'available' | 'paused' | 'hidden') => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    let statusText = '';
    if (status === 'available') statusText = 'متاح للطلب';
    if (status === 'paused') statusText = 'غير متاح مؤقتاً';
    if (status === 'hidden') statusText = 'مخفي من القائمة';

    updateStatus({ id, status });
    triggerToast(`تم تحديث حالة "${item.name}" إلى: ${statusText}`);
  };

  // Drag End handler for menu items sorting
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Filter items to reorder items of the current category or current list
    // To ensure ordering makes sense, we sort within the currently displayed items list (or subset of same category)
    const oldIndex = menuItems.findIndex((item) => item.id === active.id);
    const newIndex = menuItems.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(menuItems, oldIndex, newIndex);

      // Re-assign display_order sequentially based on the new array indices
      const payload = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index + 1,
      }));

      updateMenuItemsOrder(payload);
      triggerToast('تم تحديث ترتيب الأصناف بنجاح');
    }
  };

  // Stat calculations
  const totalItems = menuItems.length;
  const availableCount = menuItems.filter((i) => i.status === 'available').length;
  const pausedCount = menuItems.filter((i) => i.status === 'paused').length;
  const hiddenCount = menuItems.filter((i) => i.status === 'hidden').length;

  // Filtering Logic
  const filteredItems = menuItems.filter((item) => {
    // Search
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Category filter
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;

    // Quick filter tabs
    let matchesTab = true;
    if (activeFilter === 'available') matchesTab = item.status === 'available';
    else if (activeFilter === 'paused') matchesTab = item.status === 'paused';
    else if (activeFilter === 'hidden') matchesTab = item.status === 'hidden';
    else if (activeFilter === 'popular') matchesTab = item.is_popular;

    return matchesSearch && matchesCategory && matchesTab;
  });

  const isLoading = isItemsLoading || isCategoriesLoading;
  const error = itemsError || categoriesError;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 dir-rtl" style={{ direction: 'rtl' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700/80 text-rose-400 font-bold px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/15 p-2 rounded-xl border border-rose-500/25">
              <Sliders className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-50 tracking-tight">Kitchen Menu Control</h1>
              <p className="text-slate-400 text-xs sm:text-sm">لوحة التحكم السريعة في معروضات المطبخ والترتيب</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl text-center min-w-[320px]">
            <div className="px-2 py-1.5 bg-slate-900/60 rounded-lg">
              <div className="text-[10px] text-slate-400 font-medium">الكل</div>
              <div className="text-sm sm:text-lg font-black text-slate-200">{totalItems}</div>
            </div>
            <div className="px-2 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
              <div className="text-[10px] text-emerald-400 font-medium">متاح</div>
              <div className="text-sm sm:text-lg font-black text-emerald-400">{availableCount}</div>
            </div>
            <div className="px-2 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/10">
              <div className="text-[10px] text-amber-400 font-medium">متوقف</div>
              <div className="text-sm sm:text-lg font-black text-amber-400">{pausedCount}</div>
            </div>
            <div className="px-2 py-1.5 bg-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-medium">مخفي</div>
              <div className="text-sm sm:text-lg font-black text-slate-300">{hiddenCount}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left/Sidebar: Category Sorter & Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <CategorySorter
            categories={categories}
            onOrderChange={(newOrder) => {
              updateCategoriesOrder(newOrder);
              triggerToast('تم تحديث ترتيب التصنيفات بنجاح');
            }}
          />
        </div>

        {/* Right Content Area: Menu Items Control */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Controls Bar: Search, Category Filter, and Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4 shadow-lg">
            {/* Row 1: Search & Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">كل التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Row 2: Tabs */}
            <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                جميع الأصناف
              </button>

              <button
                onClick={() => setActiveFilter('available')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'available'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                المتاح ({availableCount})
              </button>

              <button
                onClick={() => setActiveFilter('paused')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'paused'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                المتوقف ({pausedCount})
              </button>

              <button
                onClick={() => setActiveFilter('hidden')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'hidden'
                    ? 'bg-slate-700 text-slate-100 shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                المخفي ({hiddenCount})
              </button>

              <button
                onClick={() => setActiveFilter('popular')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'popular'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                الشائعة
              </button>
            </div>
          </div>

          {/* Loading/Error/List Rendering */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl gap-3">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-slate-400 text-sm font-semibold">جاري تحميل الأصناف وقائمة الترتيب...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 bg-red-950/20 border border-red-950 text-center rounded-2xl p-6 gap-3">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <h3 className="font-bold text-red-400 text-lg">حدث خطأ أثناء تحميل البيانات</h3>
              <p className="text-slate-400 text-sm max-w-md">
                تأكد من إعداد بيانات الاتصال بـ Supabase بشكل صحيح في ملف الـ البيئة (.env).
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl text-center p-6 gap-3">
              <div className="text-slate-600 font-bold text-lg">لا توجد أصناف مطابقة</div>
              <p className="text-slate-500 text-xs max-w-xs">
                لم نجد أي صنف يطابق الفلتر أو كلمة البحث الحالية.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={filteredItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
};
