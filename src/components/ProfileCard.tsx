import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardProps {
  profile: {
    id: string;
    user_id: string;
    username: string;
    full_name: string;
    bio?: string;
    avatar_url?: string;
    location?: string;
    avg_rating: number;
    total_reviews: number;
  };
  topOfferedSkill?: {
    name: string;
    category: string;
  };
  topWantedSkill?: {
    name: string;
    category: string;
  };
  onRequest?: (profileId: string) => void;
}

export function ProfileCard({ profile, topOfferedSkill, topWantedSkill, onRequest }: ProfileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleRequest = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send skill requests.",
        variant: "destructive"
      });
      return;
    }
    
    if (onRequest) {
      onRequest(profile.id);
    }
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "New";
  };

  return (
    <Card className="overflow-hidden hover:shadow-medium transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
              {profile.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{profile.full_name}</h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            
            {profile.location && (
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {profile.location}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="w-full space-y-2">
            {topOfferedSkill && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Offers
                </p>
                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                  {topOfferedSkill.name}
                </Badge>
              </div>
            )}
            
            {topWantedSkill && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Wants
                </p>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {topWantedSkill.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{formatRating(profile.avg_rating)}</span>
            <span className="text-xs text-muted-foreground">
              ({profile.total_reviews} {profile.total_reviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Request Button */}
          <Button
            onClick={handleRequest}
            className="w-full"
            variant={user ? "default" : "outline"}
            disabled={user?.id === profile.user_id}
          >
            {user?.id === profile.user_id ? "Your Profile" : "Request Skill"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}