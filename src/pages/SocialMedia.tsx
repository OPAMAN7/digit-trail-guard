import { useState, useEffect } from "react";
import { Search, Loader2, ExternalLink, AlertTriangle, Users, Globe, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SocialMediaPlatform {
  platform: string;
  username?: string;
  url?: string;
  found: boolean;
  status?: string;
  profile_info?: any;
}

interface SocialMediaResult {
  platforms: SocialMediaPlatform[];
  total_platforms: number;
  error?: string;
}

export const SocialMedia = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialData, setSocialData] = useState<SocialMediaResult | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const { toast } = useToast();

  // Load existing scan results on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem('latestScanResult');
    if (savedResults) {
      try {
        const data = JSON.parse(savedResults);
        if (data.social_media) {
          setSocialData(data.social_media);
          setEmail(data.email || "");
        } else {
          setShowSearchForm(true);
        }
      } catch (error) {
        console.error('Error loading saved results:', error);
        setShowSearchForm(true);
      }
    } else {
      setShowSearchForm(true);
    }
  }, []);

  const checkSocialMedia = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to check",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-footprint', {
        body: { email }
      });

      if (error) throw error;

      const socialMediaResult = data.social_media || { platforms: [], total_platforms: 0, error: "No data available" };
      setSocialData(socialMediaResult);
      
      // Update localStorage with new data
      const existingResults = JSON.parse(localStorage.getItem('latestScanResult') || '{}');
      existingResults.social_media = socialMediaResult;
      localStorage.setItem('latestScanResult', JSON.stringify(existingResults));

      const foundPlatforms = socialMediaResult.platforms?.filter((p: SocialMediaPlatform) => p.found)?.length || 0;
      
      toast({
        title: "Social Media Check Complete",
        description: foundPlatforms > 0 
          ? `Found your email on ${foundPlatforms} social media platforms`
          : "No social media accounts found with this email",
      });
    } catch (error) {
      console.error('Social media check error:', error);
      toast({
        title: "Check Failed",
        description: "Failed to check social media presence. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-lg pt-lg">
      {/* Header */}
      <div className="text-center space-y-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center glow-accent mb-md">
          <Users className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-semibold">Social Media Presence</h1>
        <p className="text-muted-foreground text-sm">
          Check which social media platforms your email is associated with
        </p>
      </div>

      {/* Search Form */}
      {showSearchForm && (
        <div className="glass p-md rounded-2xl space-y-sm">
          <div className="flex gap-sm">
            <Input
              type="email"
              placeholder="Enter email address to check..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={checkSocialMedia} disabled={loading || !email}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Show search different email button if results are loaded */}
      {socialData && !showSearchForm && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowSearchForm(true)}
            className="glass border-accent/20 hover:bg-accent/10"
          >
            Check Different Email
          </Button>
        </div>
      )}

      {/* Results */}
      {socialData && (
        <div className="space-y-sm">
          {/* Error Message */}
          {socialData.error && (
            <div className="glass p-md rounded-2xl border-destructive/20">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-medium text-destructive">Service Unavailable</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {socialData.error.includes('429') ? 
                  "Rate limit exceeded. Please try again in a few minutes." :
                  "Unable to check social media platforms at this time. Please try again later."
                }
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="glass p-md rounded-2xl space-y-sm">
            <h2 className="font-semibold flex items-center gap-sm">
              <Eye className="w-5 h-5 text-accent" />
              Summary
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-accent">
                {socialData.platforms?.filter(p => p.found)?.length || 0}
              </div>
              <Badge className="bg-accent/20 text-accent">
                Platforms Found
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {socialData.platforms?.filter(p => p.found)?.length > 0
                ? `Your email was found on ${socialData.platforms.filter(p => p.found).length} social media platforms`
                : "Your email was not found on any social media platforms"
              }
            </p>
          </div>

          {/* Platform Results */}
          {socialData.platforms && socialData.platforms.length > 0 ? (
            <div className="space-y-sm">
              <h3 className="font-semibold flex items-center gap-sm">
                <Globe className="w-5 h-5" />
                Platform Details
              </h3>
              
              {/* Found Platforms */}
              {socialData.platforms.filter(p => p.found).length > 0 && (
                <div className="space-y-sm">
                  <h4 className="text-sm font-medium text-green-500">✅ Found on these platforms:</h4>
                  {socialData.platforms
                    .filter(platform => platform.found)
                    .map((platform, index) => (
                      <div key={index} className="glass p-md rounded-2xl border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <Globe className="w-5 h-5 text-green-500" />
                            <div>
                              <h4 className="font-medium capitalize">{platform.platform}</h4>
                              {platform.username && (
                                <p className="text-sm text-muted-foreground">@{platform.username}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-sm">
                            <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                            {platform.url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={platform.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        {platform.status && (
                          <p className="text-sm text-muted-foreground mt-sm">
                            Status: {platform.status}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Not Found Platforms */}
              {socialData.platforms.filter(p => !p.found).length > 0 && (
                <div className="space-y-sm">
                  <h4 className="text-sm font-medium text-muted-foreground">❌ Not found on these platforms:</h4>
                  <div className="grid grid-cols-2 gap-sm">
                    {socialData.platforms
                      .filter(platform => !platform.found)
                      .map((platform, index) => (
                        <div key={index} className="glass p-sm rounded-xl text-center">
                          <h5 className="text-sm font-medium capitalize text-muted-foreground">
                            {platform.platform}
                          </h5>
                          <Badge variant="outline" className="text-xs mt-1">
                            Not Found
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : !socialData.error && (
            <div className="glass p-md rounded-2xl text-center space-y-sm">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="font-medium">No Data Found</h3>
              <p className="text-sm text-muted-foreground">
                No social media data available for this email address.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};