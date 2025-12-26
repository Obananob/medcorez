import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrescriptionCameraProps {
  organizationId: string;
  appointmentId: string;
  onCapture: (url: string) => void;
}

export function PrescriptionCamera({ 
  organizationId, 
  appointmentId, 
  onCapture 
}: PrescriptionCameraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setUseCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Could not access camera. Please use file upload instead.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `prescription-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            setFile(capturedFile);
            setPreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadPrescription = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${organizationId}/${appointmentId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);

      // Since bucket is private, we need to use signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (signedError) throw signedError;

      const url = signedData.signedUrl;
      onCapture(url);
      toast.success("Prescription image uploaded");
      handleClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload prescription: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setPreview(null);
    setFile(null);
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setPreview(null);
    setFile(null);
  };

  return (
    <>
      <Button type="button" variant="outline" size="icon" onClick={handleOpen}>
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Snap Prescription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview or Camera */}
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Prescription preview"
                  className="w-full rounded-lg object-contain max-h-64"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : useCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Take a photo or upload an image of the prescription
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Use Camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {useCamera && !preview && (
                <>
                  <Button variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                </>
              )}
              {preview && (
                <>
                  <Button variant="outline" onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}>
                    Retake
                  </Button>
                  <Button onClick={uploadPrescription} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Save Prescription"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
