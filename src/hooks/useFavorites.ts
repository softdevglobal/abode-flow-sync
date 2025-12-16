import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all favorited property IDs for the current user
  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('customer_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.property_id);
    },
    enabled: !!user?.id,
  });

  // Check if a property is favorited
  const isFavorited = (propertyId: string) => favoriteIds.includes(propertyId);

  // Toggle favorite status
  const toggleFavorite = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user?.id) {
        throw new Error('Must be logged in to save properties');
      }

      const isCurrentlyFavorited = favoriteIds.includes(propertyId);

      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('property_id', propertyId);
        
        if (error) throw error;
        return { action: 'removed', propertyId };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            customer_id: user.id,
            property_id: propertyId,
          });
        
        if (error) throw error;
        return { action: 'added', propertyId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(
        result.action === 'added' 
          ? 'Saved to your list' 
          : 'Removed from saved'
      );
    },
    onError: (error: Error) => {
      if (error.message === 'Must be logged in to save properties') {
        toast.error('Please sign in to save properties');
      } else {
        toast.error('Failed to update favorites');
      }
    },
  });

  return {
    favoriteIds,
    isLoading,
    isFavorited,
    toggleFavorite: toggleFavorite.mutate,
    isToggling: toggleFavorite.isPending,
  };
}
