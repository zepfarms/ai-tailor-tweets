
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { XPost } from '@/lib/types';

interface TopPerformingPostsProps {
  posts: XPost[];
  onSelectPost: (content: string) => void;
}

const TopPerformingPosts: React.FC<TopPerformingPostsProps> = ({ posts, onSelectPost }) => {
  // Sort posts by engagement rate (descending)
  const sortedPosts = [...posts].sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, 5);

  // Truncate post content for display
  const truncatePost = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleSelectPost = (content: string) => {
    onSelectPost(content);
  };

  return (
    <div className="space-y-4">
      {sortedPosts.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No posts found</p>
      ) : (
        sortedPosts.map((post) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between gap-4">
              <div className="flex-1">
                <p className="mb-2">{truncatePost(post.content)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.likes_count} likes</span>
                  <span>•</span>
                  <span>{post.retweets_count} retweets</span>
                  <span>•</span>
                  <span>{post.impressions_count} impressions</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="shrink-0 h-8"
                onClick={() => handleSelectPost(post.content)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Generate
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default TopPerformingPosts;
