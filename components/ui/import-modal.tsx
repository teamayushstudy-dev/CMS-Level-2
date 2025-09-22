'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, module, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'import'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep('upload');
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setStep('preview');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to preview file');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Import completed! ${data.imported} records imported successfully.`);
        if (data.failed > 0) {
          alert(`${data.failed} records failed to import. Check the console for details.`);
        }
        onImportComplete();
        onClose();
        resetModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/import/sample?module=${module}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}_sample.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download sample failed:', error);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData(null);
    setStep('upload');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import {module.replace('_', ' ').toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample Template
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Download the sample file to see the required format
                </p>
              </div>

              <div>
                <Label htmlFor="importFile">Select File to Import</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                </p>
              </div>

              {file && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{previewData.total}</div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{previewData.valid.length}</div>
                  <div className="text-sm text-green-600">Valid Records</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{previewData.invalid.length}</div>
                  <div className="text-sm text-red-600">Invalid Records</div>
                </div>
              </div>

              {previewData.invalid.length > 0 && (
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Invalid Records
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-40 overflow-y-auto">
                      {previewData.invalid.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="p-3 border-b bg-red-50">
                          <p className="text-sm font-medium">Row {item.rowNumber}</p>
                          <p className="text-xs text-red-600">{item.errors.join(', ')}</p>
                        </div>
                      ))}
                      {previewData.invalid.length > 10 && (
                        <div className="p-2 text-center text-sm text-gray-500">
                          ... and {previewData.invalid.length - 10} more invalid records
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {step === 'upload' && file && (
              <Button
                onClick={handlePreview}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Previewing...' : 'Preview'}
              </Button>
            )}
            
            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || previewData.valid.length === 0}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {loading ? 'Importing...' : `Import ${previewData.valid.length} Records`}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}