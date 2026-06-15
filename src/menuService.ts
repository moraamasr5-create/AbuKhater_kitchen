import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

if (!n8nWebhookUrl) {
  console.warn('N8N Webhook URL missing. Please set VITE_N8N_WEBHOOK_URL in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  unit_type: string | null;
  base_qty: number | null;
  status: 'available' | 'paused' | 'hidden';
  is_popular: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  categories?: Category | null; // Join relation
}

export const menuService = {
  // Fetch categories ordered by display_order ASC
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Fetch menu items ordered by display_order ASC
  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(*)')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Update menu item status
  async updateMenuItemStatus(id: string, status: 'available' | 'paused' | 'hidden'): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  // Update menu item category
  async updateMenuItemCategory(id: string, category_id: string): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ category_id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * يُرسل طلب POST إلى N8N webhook لتوليد صورة AI لعنصر القائمة.
   *
   * POST body → { item_id, item_name, category_name }
   * Response  → { success: true, image_url: string } | { success: false, error: string }
   *
   * يُرجع image_url فقط عند النجاح، ويطبع خطأ واضح عند الفشل.
   * لا يتعامل مع Supabase — فقط اتصال بـ N8N.
   */
  async generateItemImage(
    item: { id: string; name: string; category_name?: string }
  ): Promise<string> {
    if (!n8nWebhookUrl) {
      const msg = '❌ VITE_N8N_WEBHOOK_URL غير معرّف. أضفه في ملف .env وأعد تشغيل الخادم.';
      console.error(msg);
      throw new Error(msg);
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          category_name: item.category_name ?? '',
        }),
      });

      if (!response.ok) {
        const msg = `❌ N8N webhook فشل: ${response.status} ${response.statusText}`;
        console.error(msg);
        throw new Error(msg);
      }

      const result = await response.json() as {
        success: boolean;
        image_url?: string;
        error?: string;
      };

      if (!result.success || !result.image_url) {
        const msg = `❌ N8N لم يُرجع صورة: ${result.error || 'لا يوجد image_url في الاستجابة'}`;
        console.error(msg);
        throw new Error(msg);
      }

      console.log(`✅ تم توليد صورة لـ "${item.name}":`, result.image_url);
      return result.image_url;
    } catch (err) {
      console.error(`❌ خطأ أثناء توليد صورة لـ "${item.name}":`, err);
      throw err;
    }
  },


  async updateMenuItemsOrder(items: { id: string; display_order: number }[]): Promise<void> {
    // For Supabase, doing bulk update of display_order can be done using upsert
    // We select only the columns we need to update to prevent clearing other data, or we update them individually in a transaction/promise.all
    // Using Promise.all is robust for typical menu sizes (usually under 50-100 items per category)
    const updates = items.map((item) =>
      supabase
        .from('menu_items')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError) throw firstError.error;
  },

  // Update categories orders in bulk
  async updateCategoriesOrder(categories: { id: string; display_order: number }[]): Promise<void> {
    const updates = categories.map((cat) =>
      supabase
        .from('categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError) throw firstError.error;
  },

  // UTILITY FOR CONSUMERS (Customer-facing Online Menu)
  // Fetch categories ordered by display_order ASC
  async getOnlineCategories(): Promise<Category[]> {
    return this.getCategories();
  },

  // Fetch active menu items ordered by display_order ASC (excluding hidden, map paused to isUnavailable)
  async getOnlineMenuItems(): Promise<(MenuItem & { isUnavailable?: boolean })[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .neq('status', 'hidden')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: MenuItem) => ({
      ...item,
      isUnavailable: item.status === 'paused',
    }));
  },
};
