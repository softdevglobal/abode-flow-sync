import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const appraisalSchema = z.object({
  address: z.string().min(1, 'Address is required').max(200),
  suburb: z.string().min(1, 'Suburb is required').max(100),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits'),
  price_from: z.coerce.number().min(1, 'Minimum price is required'),
  price_to: z.coerce.number().min(1, 'Maximum price is required'),
  confidence: z.enum(['low', 'medium', 'high']),
  is_public: z.boolean(),
  notes: z.string().max(1000).optional(),
}).refine((data) => data.price_to >= data.price_from, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['price_to'],
});

export type AppraisalFormData = z.infer<typeof appraisalSchema> & {
  images?: string[];
};

interface AppraisalFormProps {
  onSubmit: (data: AppraisalFormData) => void;
  isSubmitting?: boolean;
}

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export function AppraisalForm({ onSubmit, isSubmitting }: AppraisalFormProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof appraisalSchema>>({
    resolver: zodResolver(appraisalSchema),
    defaultValues: {
      address: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      price_from: 0,
      price_to: 0,
      confidence: 'medium',
      is_public: false,
      notes: '',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const { error } = await supabase.storage
          .from('appraisal-images')
          .upload(fileName, file);

        if (error) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('appraisal-images')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      setUploadedImages((prev) => [...prev, ...newUrls]);
      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} image(s) uploaded`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: z.infer<typeof appraisalSchema>) => {
    onSubmit({
      ...data,
      images: uploadedImages,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Example Street" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="suburb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suburb</FormLabel>
                <FormControl>
                  <Input placeholder="Sydney" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
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
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="2000" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price From ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500000" {...field} />
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
                <FormLabel>Price To ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="600000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="confidence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confidence Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How confident are you in this estimate?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Section */}
        <div className="space-y-2">
          <FormLabel>Property Photos</FormLabel>
          <div className="border border-dashed border-border rounded-lg p-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photos
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Max 5MB per image. JPG, PNG, WebP accepted.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Appraisal</FormLabel>
                <FormDescription>
                  Allow buyers to see this appraisal and express interest.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this appraisal..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Appraisal'
          )}
        </Button>
      </form>
    </Form>
  );
}
