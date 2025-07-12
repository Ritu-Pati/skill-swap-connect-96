import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Globe, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  avg_rating: number;
  total_reviews: number;
}

interface UserSkill {
  skill: {
    name: string;
    category: string;
  };
}

const ITEMS_PER_PAGE = 10;

export function Home() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userSkills, setUserSkills] = useState<Record<string, { offered?: UserSkill; wanted?: UserSkill }>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableSkills();
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [currentPage, searchQuery, skillFilter]);

  const fetchAvailableSkills = async () => {
    try {
      const { data } = await supabase
        .from('skills')
        .select('name')
        .order('name');
      
      if (data) {
        setAvailableSkills(data.map(skill => skill.name));
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      // Apply skill filter
      if (skillFilter) {
        const { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skillFilter)
          .single();

        if (skillData) {
          const { data: userIds } = await supabase
            .from('user_skills')
            .select('user_id')
            .eq('skill_id', skillData.id)
            .eq('skill_type', 'offered');

          if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds.map(u => u.user_id));
          } else {
            setProfiles([]);
            setTotalPages(1);
            setLoading(false);
            return;
          }
        }
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (data) {
        setProfiles(data);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        
        // Fetch skills for each profile
        const profileIds = data.map(p => p.user_id);
        await fetchUserSkills(profileIds);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkills = async (userIds: string[]) => {
    try {
      const { data } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          skill_type,
          skill:skills(name, category)
        `)
        .in('user_id', userIds);

      if (data) {
        const skillsMap: Record<string, { offered?: UserSkill; wanted?: UserSkill }> = {};
        
        data.forEach(item => {
          if (!skillsMap[item.user_id]) {
            skillsMap[item.user_id] = {};
          }
          
          if (item.skill_type === 'offered' && !skillsMap[item.user_id].offered) {
            skillsMap[item.user_id].offered = { skill: item.skill };
          } else if (item.skill_type === 'wanted' && !skillsMap[item.user_id].wanted) {
            skillsMap[item.user_id].wanted = { skill: item.skill };
          }
        });
        
        setUserSkills(skillsMap);
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProfiles();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSkillFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-hero border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Exchange Skills, Grow Together
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with talented individuals, share your expertise, and learn new skills through our vibrant community platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" className="px-8" asChild>
                  <a href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="px-8" asChild>
                    <a href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/login">Sign In</a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">1,000+</h3>
              <p className="text-muted-foreground">Active Members</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mx-auto mb-4">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold">500+</h3>
              <p className="text-muted-foreground">Skills Available</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-4">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold">50+</h3>
              <p className="text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Discover Talented People</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse through our community of skilled individuals ready to share their knowledge and learn new things.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">Search</Button>
              </form>

              {/* Active Filters */}
              {(searchQuery || skillFilter) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {skillFilter && (
                    <Badge variant="secondary">
                      Skill: {skillFilter}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading profiles...</p>
              </div>
            )}

            {/* Profiles Grid */}
            {!loading && profiles.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      topOfferedSkill={userSkills[profile.user_id]?.offered?.skill}
                      topWantedSkill={userSkills[profile.user_id]?.wanted?.skill}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && profiles.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || skillFilter ? 'Try adjusting your search criteria.' : 'Be the first to join our community!'}
                </p>
                {!user && (
                  <Button asChild>
                    <a href="/signup">Join SkillSwap</a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}