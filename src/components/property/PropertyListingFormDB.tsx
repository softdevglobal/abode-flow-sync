import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ImagePlus, Video, X, Loader2, GripVertical, Play } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;

const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  address: z.string().min(5, 'Address is required'),
  suburb: z.string().min(2, 'Suburb is required'),
  state: z.string().min(2, 'State is required'),
  postcode: z.string().min(4, 'Valid postcode required').max(4),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'rural']),
  listing_type: z.enum(['sale', 'rent']),
  status: z.enum(['active', 'pending', 'sold', 'off_market']),
  price: z.coerce.number().min(0, 'Price must be positive').optional().nullable(),
  price_from: z.coerce.number().min(0).optional().nullable(),
  price_to: z.coerce.number().min(0).optional().nullable(),
  price_display: z.string().optional().nullable(),
  bedrooms: z.coerce.number().min(0).max(20).optional().nullable(),
  bathrooms: z.coerce.number().min(0).max(20).optional().nullable(),
  parking: z.coerce.number().min(0).max(20).optional().nullable(),
  land_size: z.coerce.number().min(0).optional().nullable(),
  building_size: z.coerce.number().min(0).optional().nullable(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000).optional().nullable(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const featureOptions = [
  'Air Conditioning',
  'Swimming Pool',
  'Garage',
  'Garden',
  'Balcony',
  'Fireplace',
  'Dishwasher',
  'Built-in Wardrobes',
  'Alarm System',
  'Solar Panels',
  'Study',
  'Ensuite',
];

interface PropertyListingFormDBProps {
  property?: Property | null;
  onSubmit: (data: Omit<TablesInsert<'properties'>, 'agent_id'>) => Promise<void>;
  onCancel: () => void;
}

export function PropertyListingFormDB({ property, onSubmit, onCancel }: PropertyListingFormDBProps) {
  const [images, setImages] = useState<string[]>(property?.images || []);
  const [videos, setVideos] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>(property?.features || []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const isEditing = !!property;

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      address: property?.address || '',
      suburb: property?.suburb || '',
      state: property?.state || 'NSW',
      postcode: property?.postcode || '',
      property_type: property?.property_type || 'house',
      listing_type: property?.listing_type || 'sale',
      status: property?.status || 'active',
      price: property?.price || null,
      price_from: property?.price_from || null,
      price_to: property?.price_to || null,
      price_display: property?.price_display || '',
      bedrooms: property?.bedrooms || 0,
      bathrooms: property?.bathrooms || 0,
      parking: property?.parking || 0,
      land_size: property?.land_size || null,
      building_size: property?.building_size || null,
      description: property?.description || '',
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploadingImages(true);
    let processed = 0;
    const totalFiles = files.length;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        processed++;
        if (processed === totalFiles) setIsUploadingImages(false);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
        processed++;
        if (processed === totalFiles) setIsUploadingImages(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploadingVideos(true);
    let processed = 0;
    const totalFiles = files.length;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video`);
        processed++;
        if (processed === totalFiles) setIsUploadingVideos(false);
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`);
        processed++;
        if (processed === totalFiles) setIsUploadingVideos(false);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos((prev) => [...prev, reader.result as string]);
        processed++;
        if (processed === totalFiles) setIsUploadingVideos(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleFormSubmit = async (data: PropertyFormData) => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: data.title,
        address: data.address,
        suburb: data.suburb,
        state: data.state,
        postcode: data.postcode,
        property_type: data.property_type,
        listing_type: data.listing_type,
        status: data.status,
        price: data.price,
        price_from: data.price_from,
        price_to: data.price_to,
        price_display: data.price_display,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parking: data.parking,
        land_size: data.land_size,
        building_size: data.building_size,
        description: data.description,
        images,
        features,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Property Images *</Label>
            <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''} • Drag to reorder</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-lg overflow-hidden border bg-muted group cursor-move ${
                  draggedIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                } ${index === 0 ? 'ring-2 ring-primary' : ''}`}
              >
                <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                </div>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/90 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {isUploadingImages ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Images</span>
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

        {/* Video Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Property Videos</Label>
            <span className="text-xs text-muted-foreground">{videos.length} video{videos.length !== 1 ? 's' : ''} • Max 100MB each</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videos.map((video, index) => (
              <div 
                key={index} 
                className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group"
              >
                <video src={video} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/90 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {isUploadingVideos ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <Video className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Videos</span>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
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
            name="property_type"
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
                    <SelectItem value="rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="listing_type"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="off_market">Off Market</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Pricing</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Price</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Price From</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Price To</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_display"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Display Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Contact Agent" {...field} value={field.value ?? ''} />
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
                  <Input type="number" min={0} max={20} {...field} value={field.value ?? 0} />
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
                  <Input type="number" min={0} max={20} {...field} value={field.value ?? 0} />
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
                  <Input type="number" min={0} max={20} {...field} value={field.value ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="land_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Land (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="building_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Building (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} value={field.value ?? ''} />
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
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Features Checkboxes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Features</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {featureOptions.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={features.includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                />
                <label
                  htmlFor={feature}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {feature}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isEditing ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
