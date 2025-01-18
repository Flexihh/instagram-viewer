import React, { useState, useCallback, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Calendar, Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface RawInstagramPost {
  date_posted: string;
  description?: string;
  hashtags: string; // Raw string from CSV
  clean_description?: string;
  url?: string;
  photos?: string;
  likes?: string; // CSV numbers come as strings
  num_comments?: string;
}

interface InstagramPost {
  date_posted: string;
  description?: string;
  hashtags: string[]; // Parsed array
  clean_description: string;
  url?: string;
  photos?: string;
  likes: number;
  num_comments: number;
}

const InstagramViewer: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isHashtagSearch, setIsHashtagSearch] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<InstagramPost[]>([]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<RawInstagramPost>(file, {
        header: true,
        complete: (results: Papa.ParseResult<RawInstagramPost>) => {
          const processedData: InstagramPost[] = results.data
            .filter(post => post.date_posted) // Filter out invalid entries
            .map(post => ({
              ...post,
              date_posted: new Date(post.date_posted).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              hashtags: tryParseJSON(post.hashtags) || [],
              clean_description: cleanDescription(post.description || ''),
              likes: Number(post.likes) || 0,
              num_comments: Number(post.num_comments) || 0
            }));
          setPosts(processedData);
          setSearchResults(processedData);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  const tryParseJSON = (str: string | undefined): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str.replace(/'/g, '"'));
    } catch {
      return [];
    }
  };

  const cleanDescription = (text: string): string => {
    if (!text) return '';
    const hashtagIndex = text.search(/\s#\w+/);
    return hashtagIndex > -1 ? text.slice(0, hashtagIndex).trim() : text.trim();
  };

  const searchPosts = useCallback(() => {
    if (!searchTerm) {
      setSearchResults(posts);
      return;
    }

    const results = posts.filter(post => {
      if (isHashtagSearch) {
        return post.hashtags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase().replace('#', ''))
        );
      } else {
        return post.clean_description.toLowerCase().includes(searchTerm.toLowerCase());
      }
    });

    setSearchResults(results);
  }, [posts, searchTerm, isHashtagSearch]);

  const createEmbedHtml = (url: string): string => {
    const postId = url.split('/').slice(-2)[0];
    return `https://www.instagram.com/p/${postId}/embed`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-500 mb-8">
          📸 Instagram Post Viewer
        </h1>

        <Card className="mb-8">
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mb-4"
              />

              <div className="flex gap-4 items-center">
                <Input
                  type="text"
                  placeholder="Suchbegriff eingeben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hashtag-search"
                    checked={isHashtagSearch}
                    onChange={(e) => setIsHashtagSearch(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="hashtag-search">Nach Hashtag suchen</label>
                </div>
                <Button onClick={searchPosts}>
                  <Search className="w-4 h-4 mr-2" />
                  Suchen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchResults.length > 0 ? (
          <div className="grid gap-6">
            {searchResults.map((post, index) => (
              <Card key={index}>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5" />
                        <span className="font-semibold">{post.date_posted}</span>
                      </div>

                      {post.clean_description && (
                        <div className="mb-4">
                          <h3 className="font-semibold mb-2">Beschreibung:</h3>
                          <p>{post.clean_description}</p>
                        </div>
                      )}

                      {post.hashtags.length > 0 && (
                        <div className="mb-4">
                          <h3 className="font-semibold mb-2">Hashtags:</h3>
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((tag, i) => (
                              <span
                                key={i}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  isHashtagSearch && tag.toLowerCase().includes(searchTerm.toLowerCase())
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                          <span>{post.num_comments}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-96">
                      {post.url ? (
                        <iframe
                          src={createEmbedHtml(post.url)}
                          className="w-full h-full border-none rounded-lg"
                          allowTransparency={true}
                        />
                      ) : post.photos ? (
                        <Image
                          src={tryParseJSON(post.photos)?.[0]}
                          alt="Post"
                          className="w-full h-full object-cover rounded-lg"
                          width={500}
                          height={500}
                        />
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm && (
          <Card>
            <CardContent>
              <p className="text-center text-gray-600">
                Keine Posts gefunden für {isHashtagSearch ? 'Hashtag' : 'Suchbegriff'} &quot;{searchTerm}&quot;
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstagramViewer;
