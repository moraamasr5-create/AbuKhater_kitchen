import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService, MenuItem } from './menuService';

export function useMenuItems() {
  const queryClient = useQueryClient();

  const query = useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: () => menuService.getMenuItems(),
  });

  // Mutate status of individual item (Optimistic Update)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'available' | 'paused' | 'hidden' }) =>
      menuService.updateMenuItemStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['menuItems'] });
      const previousItems = queryClient.getQueryData<MenuItem[]>(['menuItems']);

      if (previousItems) {
        const updated = previousItems.map((item) =>
          item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item
        );
        queryClient.setQueryData<MenuItem[]>(['menuItems'], updated);
      }

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['menuItems'], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  // Mutate items order in bulk (Optimistic Update)
  const orderMutation = useMutation({
    mutationFn: (newOrder: { id: string; display_order: number }[]) =>
      menuService.updateMenuItemsOrder(newOrder),
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ['menuItems'] });
      const previousItems = queryClient.getQueryData<MenuItem[]>(['menuItems']);

      if (previousItems) {
        const orderMap = new Map(newOrder.map((item) => [item.id, item.display_order]));
        const updated = previousItems
          .map((item) => ({
            ...item,
            display_order: orderMap.has(item.id) ? orderMap.get(item.id)! : item.display_order,
          }))
          .sort((a, b) => a.display_order - b.display_order);

        queryClient.setQueryData<MenuItem[]>(['menuItems'], updated);
      }

      return { previousItems };
    },
    onError: (_err, _newOrder, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['menuItems'], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  return {
    menuItems: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateStatus: statusMutation.mutate,
    isUpdatingStatus: statusMutation.isPending,
    updateMenuItemsOrder: orderMutation.mutate,
    isUpdatingOrder: orderMutation.isPending,
  };
}
