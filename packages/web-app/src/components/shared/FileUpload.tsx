
import { useState } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  initialPreview?: string;
  label?: string;
  id?: string;
  accept?: string;
}

export function FileUpload({
  onFileChange,
  initialPreview = "",
  label = "Upload File",
  id = "file-upload",
  accept = "image/*"
}: FileUploadProps) {
  const [preview, setPreview] = useState<string>(initialPreview);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    onFileChange(file);
  };

  const handleRemove = () => {
    setPreview("");
    onFileChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      
      {!preview ? (
        <label 
          htmlFor={id} 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
          </div>
          <input 
            id={id} 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept={accept}
          />
        </label>
      ) : (
        <div className="relative">
          <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
