import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService, Category } from './menuService';

export function useCategories() {
  const queryClient = useQueryClient();

  const query = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => menuService.getCategories(),
  });

  const updateOrderMutation = useMutation({
    mutationFn: (newOrder: { id: string; display_order: number }[]) =>
      menuService.updateCategoriesOrder(newOrder),
    // Optimistic Update
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);

      if (previousCategories) {
        // Create lookup map for display orders
        const orderMap = new Map(newOrder.map((item) => [item.id, item.display_order]));
        const updated = previousCategories
          .map((cat) => ({
            ...cat,
            display_order: orderMap.has(cat.id) ? orderMap.get(cat.id)! : cat.display_order,
          }))
          .sort((a, b) => a.display_order - b.display_order);

        queryClient.setQueryData<Category[]>(['categories'], updated);
      }

      return { previousCategories };
    },
    onError: (_err, _newOrder, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateCategoriesOrder: updateOrderMutation.mutate,
    isUpdatingOrder: updateOrderMutation.isPending,
  };
}
