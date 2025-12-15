import { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { InspectionWithProperty } from '@/hooks/useAgentInspections';

interface InspectionQRDialogProps {
  inspection: InspectionWithProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspectionQRDialog({
  inspection,
  open,
  onOpenChange,
}: InspectionQRDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!inspection) return null;

  // Generate the check-in URL/deep link
  const checkInUrl = `${window.location.origin}/check-in?inspectionId=${inspection.id}&propertyId=${inspection.property_id}`;
  
  // Also generate a JSON payload for flexibility
  const qrPayload = JSON.stringify({
    type: 'inspection_checkin',
    inspectionId: inspection.id,
    propertyId: inspection.property_id,
    url: checkInUrl,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      toast.success('Check-in link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('inspection-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `inspection-qr-${inspection.id.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR code downloaded');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Inspection Check-In QR Code
          </DialogTitle>
          <DialogDescription>
            Display this QR code at the property for buyers to check in instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* Property info */}
          <div className="text-center mb-4">
            <p className="font-semibold text-foreground">
              {inspection.property?.address}
            </p>
            <p className="text-sm text-muted-foreground">
              {inspection.property?.suburb}, {inspection.property?.state}
            </p>
          </div>

          {/* QR Code */}
          <div className="p-4 bg-white rounded-xl shadow-lg">
            <QRCode
              id="inspection-qr-code"
              value={checkInUrl}
              size={220}
              level="H"
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            />
          </div>

          {/* Instructions */}
          <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">
            Buyers can scan this code with their phone camera to register their attendance automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={handleDownloadQR}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
