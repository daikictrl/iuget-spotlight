import { useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    thumbnail_url: string | null;
    likes_count: number;
    comments_count: number;
    views_count: number;
    profiles: {
      full_name: string | null;
      matricule_id: string;
    } | null;
  };
  currentUserId: string | undefined;
  isLiked: boolean;
  onLikeChange: () => void;
}

const VideoCard = ({ video, currentUserId, isLiked, onLikeChange }: VideoCardProps) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(video.likes_count);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please log in to like videos");
      return;
    }

    const newLikedState = !localLiked;
    setLocalLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    if (newLikedState) {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: currentUserId, video_id: video.id });
      
      if (error) {
        setLocalLiked(false);
        setLikesCount(likesCount);
        toast.error("Failed to like video");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("video_id", video.id);
      
      if (error) {
        setLocalLiked(true);
        setLikesCount(likesCount + 1);
        toast.error("Failed to unlike video");
      }
    }
    onLikeChange();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: video.title,
        text: video.description || "",
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative group cursor-pointer" onClick={() => navigate(`/video/${video.id}`)}>
        <video
          src={video.video_url}
          poster={video.thumbnail_url || undefined}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-semibold">Click to watch</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{video.description}</p>
            <p className="text-sm text-muted-foreground">
              by {video.profiles?.full_name || "Unknown"} • {video.views_count} views
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${localLiked ? "fill-red-500 text-red-500" : ""}`} />
            {likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate(`/video/${video.id}`)}
          >
            <MessageCircle className="w-5 h-5" />
            {video.comments_count}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
