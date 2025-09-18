import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ScanResult {
  email: string;
  score: number;
  breaches: number;
  platforms: number;
  password_check?: {
    is_pwned: boolean;
    pwn_count: number;
  };
  summary: string;
  recommendations: string[];
  details?: {
    social_media?: any;
  };
}

const SocialMedia = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('latestScanResult');
    if (stored) {
      setScanResult(JSON.parse(stored));
    }
  }, []);

  if (!scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Social Media Analysis</h1>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No scan data available. Please run a privacy scan first.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/')}
              >
                Start New Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const socialMediaData = scanResult.details?.social_media;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Social Media Analysis</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Social Media Presence for {scanResult.email}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {socialMediaData?.error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Unable to check social media presence: {socialMediaData.error}
                  </p>
                  <Badge variant="secondary">Service Unavailable</Badge>
                </div>
              ) : socialMediaData ? (
                <div className="space-y-6">
                  {/* Display social media platforms */}
                  {Object.entries(socialMediaData).map(([platform, data]: [string, any]) => {
                    if (typeof data === 'object' && data !== null) {
                      return (
                        <div key={platform} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold capitalize flex items-center gap-2">
                              {platform.replace('_', ' ')}
                              {data.found ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </h3>
                            <Badge variant={data.found ? "destructive" : "secondary"}>
                              {data.found ? "Found" : "Not Found"}
                            </Badge>
                          </div>
                          
                          {data.found && (
                            <div className="space-y-2">
                              {data.profile_url && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Profile:</span>
                                  <a 
                                    href={data.profile_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    {data.profile_url}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              
                              {data.username && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Username:</span>
                                  <span className="text-sm">{data.username}</span>
                                </div>
                              )}
                              
                              {data.display_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Display Name:</span>
                                  <span className="text-sm">{data.display_name}</span>
                                </div>
                              )}
                              
                              {data.followers && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Followers:</span>
                                  <span className="text-sm">{data.followers}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* Summary Statistics */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Platforms Checked</p>
                        <p className="text-lg font-semibold">
                          {Object.keys(socialMediaData).filter(key => typeof socialMediaData[key] === 'object').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accounts Found</p>
                        <p className="text-lg font-semibold">
                          {Object.values(socialMediaData).filter((data: any) => 
                            typeof data === 'object' && data?.found
                          ).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No social media data available for this scan.
                  </p>
                  <Badge variant="secondary">No Data</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;