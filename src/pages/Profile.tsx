import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProfile();
    fetchUserVideos();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(data);
    }
  };

  const fetchUserVideos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: videosData } = await supabase
        .from("videos")
        .select(`
          *,
          profiles (
            full_name,
            matricule_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setVideos(videosData || []);

      // Fetch likes
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
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile?.full_name || "Loading..."}</CardTitle>
                <CardDescription>{profile?.matricule_id || ""}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  {videos.length} videos • {profile?.followers_count || 0} followers
                </p>
              </div>
            </div>
          </CardHeader>
          {profile?.bio && (
            <CardContent>
              <p className="text-muted-foreground">{profile.bio}</p>
            </CardContent>
          )}
        </Card>

        <div className="mb-4">
          <h2 className="text-2xl font-bold">My Videos</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">You haven't uploaded any videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="relative">
                <VideoCard
                  video={video}
                  currentUserId={profile?.id}
                  isLiked={likedVideos.has(video.id)}
                  onLikeChange={refreshLikes}
                />
                {video.status === "pending" && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                    Pending
                  </div>
                )}
                {video.status === "rejected" && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Rejected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
