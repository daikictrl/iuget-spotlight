import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCurrentUser();
    fetchVideos();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id);
  };

  const fetchVideos = async () => {
    setLoading(true);
    
    const { data: videosData, error } = await supabase
      .from("videos")
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
    } else {
      setVideos(videosData || []);
      
      // Fetch user's likes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: likesData } = await supabase
          .from("likes")
          .select("video_id")
          .eq("user_id", user.id);
        
        if (likesData) {
          setLikedVideos(new Set(likesData.map(like => like.video_id)));
        }
      }
    }

    setLoading(false);
  };

  const refreshLikes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("video_id")
        .eq("user_id", user.id);
      
      if (likesData) {
        setLikedVideos(new Set(likesData.map(like => like.video_id)));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trending Videos</h1>
          <p className="text-muted-foreground">Watch what's popular at IUGET</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No videos yet. Be the first to upload!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                currentUserId={currentUserId}
                isLiked={likedVideos.has(video.id)}
                onLikeChange={refreshLikes}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
