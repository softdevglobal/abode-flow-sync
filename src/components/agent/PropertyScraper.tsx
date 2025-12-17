import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe, FileText } from 'lucide-react';
import { firecrawlApi } from '@/lib/api/firecrawl';

export const PropertyScraper = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await firecrawlApi.scrape(url, {
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      });

      if (response.success) {
        toast.success('Page scraped successfully');
        setResult(response.data || response);
      } else {
        toast.error(response.error || 'Failed to scrape page');
      }
    } catch (error) {
      console.error('Error scraping:', error);
      toast.error('Failed to scrape page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Property Scraper
        </CardTitle>
        <CardDescription>
          Enter a property listing URL to extract content and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleScrape} className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/property-listing"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              'Scrape'
            )}
          </Button>
        </form>

        {result && (
          <div className="space-y-4">
            {result.metadata && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Page Info
                </h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {result.metadata.title && (
                    <>
                      <dt className="text-muted-foreground">Title:</dt>
                      <dd className="font-medium">{result.metadata.title}</dd>
                    </>
                  )}
                  {result.metadata.description && (
                    <>
                      <dt className="text-muted-foreground">Description:</dt>
                      <dd className="font-medium line-clamp-2">{result.metadata.description}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {result.markdown && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold mb-2">Content</h4>
                <div className="prose prose-sm dark:prose-invert max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded">
                    {result.markdown}
                  </pre>
                </div>
              </div>
            )}

            {result.links && result.links.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold mb-2">Links Found ({result.links.length})</h4>
                <ul className="text-sm space-y-1 max-h-40 overflow-auto">
                  {result.links.slice(0, 20).map((link: string, i: number) => (
                    <li key={i} className="truncate text-muted-foreground hover:text-foreground">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                  {result.links.length > 20 && (
                    <li className="text-muted-foreground">...and {result.links.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
