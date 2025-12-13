import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Property, PropertyType, PropertyStatus, ListingType } from '@/types';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  address: z.string().min(5, 'Address is required'),
  suburb: z.string().min(2, 'Suburb is required'),
  state: z.string().min(2, 'State is required'),
  postcode: z.string().min(4, 'Valid postcode required').max(4),
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial']),
  listingType: z.enum(['sale', 'rent']),
  status: z.enum(['available', 'under_offer', 'sold', 'leased', 'off_market']),
  priceFrom: z.coerce.number().min(0, 'Price must be positive').optional(),
  priceTo: z.coerce.number().min(0, 'Price must be positive').optional(),
  priceDisplay: z.string().optional(),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(0).max(20),
  parking: z.coerce.number().min(0).max(20),
  landSize: z.coerce.number().min(0).optional(),
  buildingSize: z.coerce.number().min(0).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  features: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyListingFormProps {
  property?: Property;
  onSubmit: (data: Partial<Property>) => void;
  onCancel: () => void;
}

export function PropertyListingForm({ property, onSubmit, onCancel }: PropertyListingFormProps) {
  const [images, setImages] = useState<string[]>(property?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const isEditing = !!property;

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      address: property?.address || '',
      suburb: property?.suburb || '',
      state: property?.state || 'NSW',
      postcode: property?.postcode || '',
      propertyType: property?.propertyType || 'house',
      listingType: property?.listingType || 'sale',
      status: property?.status || 'available',
      priceFrom: property?.priceFrom || property?.price || undefined,
      priceTo: property?.priceTo || undefined,
      priceDisplay: property?.priceDisplay || '',
      bedrooms: property?.bedrooms || 0,
      bathrooms: property?.bathrooms || 0,
      parking: property?.parking || 0,
      landSize: property?.landSize || undefined,
      buildingSize: property?.buildingSize || undefined,
      description: property?.description || '',
      features: property?.features?.join(', ') || '',
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    
    // Simulate image upload - in production, this would upload to storage
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: PropertyFormData) => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    const features = data.features
      ? data.features.split(',').map((f) => f.trim()).filter(Boolean)
      : [];

    onSubmit({
      ...data,
      features,
      images,
      price: data.priceFrom,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Property Images *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Stunning 4 Bedroom Family Home" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Fields */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Example Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="suburb"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Suburb *</FormLabel>
                  <FormControl>
                    <Input placeholder="Suburb" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NSW">NSW</SelectItem>
                      <SelectItem value="VIC">VIC</SelectItem>
                      <SelectItem value="QLD">QLD</SelectItem>
                      <SelectItem value="WA">WA</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="TAS">TAS</SelectItem>
                      <SelectItem value="ACT">ACT</SelectItem>
                      <SelectItem value="NT">NT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode *</FormLabel>
                  <FormControl>
                    <Input placeholder="2000" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Property Type, Listing Type, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sale or Rent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="under_offer">Under Offer</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="off_market">Off Market</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Pricing</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="priceFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Price From</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Price To</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceDisplay"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel className="text-xs text-muted-foreground">Display Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Contact Agent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Bedrooms</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={20} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Bathrooms</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={20} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parking"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Parking</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={20} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="landSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Land (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="buildingSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Building (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the property in detail..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Features */}
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="Air conditioning, Pool, Garden, Garage..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="gold" className="flex-1">
            {isEditing ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
