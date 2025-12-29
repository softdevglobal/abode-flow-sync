import { useState } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { AgentPropertyCard } from '@/components/property/AgentPropertyCard';
import { PropertyListingFormDB } from '@/components/property/PropertyListingFormDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;
type PropertyStatus = 'all' | 'active' | 'pending' | 'sold' | 'off_market';

export default function AgentProperties() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  const { properties, loading, createProperty, updateProperty, deleteProperty: deletePropertyFn } = useAgentProperties();

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase()) ||
      property.suburb.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateProperty = async (data: Omit<TablesInsert<'properties'>, 'agent_id'>) => {
    await createProperty(data);
    setIsFormOpen(false);
    setEditingProperty(null);
  };

  const handleUpdateProperty = async (data: Omit<TablesInsert<'properties'>, 'agent_id'>) => {
    if (editingProperty) {
      await updateProperty(editingProperty.id, data);
      setIsFormOpen(false);
      setEditingProperty(null);
    }
  };

  const handleOpenForm = (property?: Property) => {
    setEditingProperty(property || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProperty(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProperty) return;
    setIsDeleting(true);
    await deletePropertyFn(deleteProperty.id);
    setIsDeleting(false);
    setDeleteProperty(null);
  };

  const FormContent = (
    <PropertyListingFormDB
      property={editingProperty}
      onSubmit={editingProperty ? handleUpdateProperty : handleCreateProperty}
      onCancel={handleCloseForm}
    />
  );

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              Your Listings
            </h1>
            <p className="text-muted-foreground font-body">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
          <Button variant="gold" onClick={() => handleOpenForm()} className="w-full sm:w-auto shadow-glow-sm font-body">
            <Plus className="w-4 h-4 mr-2" />
            Add New Listing
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by address or suburb..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 font-body"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PropertyStatus)}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 font-body">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-body">All Status</SelectItem>
              <SelectItem value="active" className="font-body">Active</SelectItem>
              <SelectItem value="pending" className="font-body">Pending</SelectItem>
              <SelectItem value="sold" className="font-body">Sold</SelectItem>
              <SelectItem value="off_market" className="font-body">Off Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card/50 border border-border/50 rounded-xl backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">No properties found</h3>
            <p className="text-muted-foreground mb-4 font-body">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first listing to get started'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button variant="gold" onClick={() => handleOpenForm()} className="shadow-glow-sm font-body">
                <Plus className="w-4 h-4 mr-2" />
                Add New Listing
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, index) => (
              <div 
                key={property.id} 
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AgentPropertyCard
                  property={property}
                  onEdit={handleOpenForm}
                  onDelete={setDeleteProperty}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Property Form - Mobile: Sheet, Desktop: Dialog */}
      {isMobile ? (
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-border/50">
            <SheetHeader className="mb-4">
              <SheetTitle className="font-display">
                {editingProperty ? 'Edit Property' : 'New Property Listing'}
              </SheetTitle>
            </SheetHeader>
            {FormContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-border/50">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingProperty ? 'Edit Property' : 'New Property Listing'}
              </DialogTitle>
            </DialogHeader>
            {FormContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Property</DialogTitle>
            <DialogDescription className="font-body">
              Are you sure you want to delete "{deleteProperty?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteProperty(null)} disabled={isDeleting} className="font-body hover:border-primary/50">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="font-body">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
}
