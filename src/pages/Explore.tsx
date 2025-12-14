import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  // Sanitize search input to prevent SQL injection
  const sanitizeSearchInput = (input: string): string => {
    // Escape special PostgREST/PostgreSQL characters
    return input
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/'/g, "''")
      .replace(/"/g, '\\"')
      .trim();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);

    // Sanitize user input before using in query
    const sanitizedQuery = sanitizeSearchInput(searchQuery);

    const { data: videosData } = await supabase
      .from("videos")
      .select(`
        *,
        profiles (
          full_name,
          matricule_id
        )
      `)
      .eq("status", "published")
      .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      .order("created_at", { ascending: false });

    setVideos(videosData || []);

    // Fetch user's likes
    if (user) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("video_id")
        .eq("user_id", user.id);
      
      if (likesData) {
        setLikedVideos(new Set(likesData.map(like => like.video_id)));
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
          <h1 className="text-3xl font-bold mb-4">Explore</h1>
          
          <div className="flex gap-2 max-w-2xl">
            <Input
              placeholder="Search videos by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? "No videos found. Try a different search." : "Enter a search query to find videos"}
            </p>
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

export default Explore;
