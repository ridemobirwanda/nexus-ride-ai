import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Eye, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DocumentUploadProps {
  driverId: string;
  verificationRequestId: string;
  existingDocuments?: {
    license?: string;
    insurance?: string;
    registration?: string;
  };
  onDocumentsUpdated: () => void;
}

type DocumentType = 'license' | 'insurance' | 'registration';

interface DocumentState {
  url: string;
  file?: File;
  preview?: string;
}

export const DocumentUpload = ({
  driverId,
  verificationRequestId,
  existingDocuments = {},
  onDocumentsUpdated,
}: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<Record<DocumentType, DocumentState | null>>({
    license: existingDocuments.license ? { url: existingDocuments.license } : null,
    insurance: existingDocuments.insurance ? { url: existingDocuments.insurance } : null,
    registration: existingDocuments.registration ? { url: existingDocuments.registration } : null,
  });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const documentLabels = {
    license: "Driver's License",
    insurance: 'Insurance Certificate',
    registration: 'Vehicle Registration',
  };

  const handleFileSelect = async (type: DocumentType, file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setDocuments(prev => ({
      ...prev,
      [type]: { url: '', file, preview },
    }));
  };

  const handleRemoveDocument = (type: DocumentType) => {
    const doc = documents[type];
    if (doc?.preview) {
      URL.revokeObjectURL(doc.preview);
    }
    setDocuments(prev => ({
      ...prev,
      [type]: null,
    }));
  };

  const handleUploadAll = async () => {
    setUploading(true);
    try {
      const uploadedDocs: Record<string, string> = { ...existingDocuments };

      // Upload each document that has a file
      for (const [type, doc] of Object.entries(documents)) {
        if (doc?.file) {
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${driverId}/${type}-${Date.now()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('car-images')
            .upload(fileName, doc.file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('car-images')
            .getPublicUrl(data.path);

          uploadedDocs[type] = publicUrl;
        }
      }

      // Update verification request with new documents
      const { error: updateError } = await supabase
        .from('driver_verification_requests')
        .update({
          documents: uploadedDocs,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', verificationRequestId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Documents uploaded successfully',
      });

      onDocumentsUpdated();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload documents',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const hasNewDocuments = Object.values(documents).some(doc => doc?.file);
  const allDocumentsUploaded = Object.values(documents).every(doc => doc !== null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(documentLabels) as DocumentType[]).map((type) => {
          const doc = documents[type];
          const hasDocument = doc !== null;
          const isNewUpload = doc?.file !== undefined;

          return (
            <Card key={type} className="relative">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {documentLabels[type]}
                    </Label>
                    {hasDocument && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {hasDocument ? (
                    <div className="space-y-2">
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden border border-border">
                        {doc.preview ? (
                          <img
                            src={doc.preview}
                            alt={documentLabels[type]}
                            className="w-full h-full object-cover"
                          />
                        ) : doc.url ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        {doc.preview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewImage(doc.preview!)}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(type)}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {isNewUpload ? 'Remove' : 'Replace'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Image or PDF, max 5MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasNewDocuments && (
        <Button
          onClick={handleUploadAll}
          disabled={uploading || !allDocumentsUploaded}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload All Documents'}
        </Button>
      )}

      {!allDocumentsUploaded && !hasNewDocuments && (
        <p className="text-sm text-muted-foreground text-center">
          Please upload all required documents to proceed
        </p>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-full aspect-video">
              <img
                src={previewImage}
                alt="Document preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
