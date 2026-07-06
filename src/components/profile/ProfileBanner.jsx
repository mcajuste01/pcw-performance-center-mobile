import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProfileBanner({ 
  bannerUrl, 
  avatarUrl, 
  name, 
  wrestlingName,
  tier,
  onBannerChange,
  onAvatarChange,
  editable = false 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onBannerChange?.(file_url);
      toast.success("Banner updated!");
    } catch (err) {
      toast.error("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onAvatarChange?.(file_url);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const defaultBanner = null;

  return (
    <div className="relative">
      {/* Banner Image */}
      <div 
        className="h-48 md:h-64 w-full bg-cover bg-center relative overflow-hidden rounded-t-xl"
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          background: bannerUrl ? undefined : "linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 50%, #1a0808 100%)",
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Edit button */}
        {editable && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
              disabled={uploading}
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={uploading}
              onClick={() => bannerInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Change Banner"}
            </Button>
          </>
        )}
      </div>

      {/* Profile info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black bg-cover bg-center flex items-center justify-center text-3xl md:text-4xl font-bold text-white"
              style={{
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
              }}
            >
              {!avatarUrl && (wrestlingName || name || "?")[0].toUpperCase()}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
            
            {/* Avatar edit overlay */}
            {editable && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Name and tier */}
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {wrestlingName || name}
            </h1>
            {wrestlingName && name && wrestlingName !== name && (
              <p className="text-gray-400 text-sm">{name}</p>
            )}
            {tier && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">
                {tier}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}