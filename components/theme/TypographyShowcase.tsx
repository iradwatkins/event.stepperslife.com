'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface TypographyShowcaseProps {
  fontFamily: string;
  fontCategory: 'sans-serif' | 'serif' | 'monospace';
}

export function TypographyShowcase({ fontFamily, fontCategory }: TypographyShowcaseProps) {
  const { theme } = useTheme();

  const categoryName = fontCategory === 'sans-serif' ? 'Sans-Serif' :
                      fontCategory === 'serif' ? 'Serif' : 'Monospace';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Font Showcase</CardTitle>
            <CardDescription>View theme fonts in different styles</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">Typography</Badge>
            <Badge variant="outline">Web Development</Badge>
            <Badge variant="outline">React</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Font Category and Weights */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">{categoryName}</h3>
              <div className="space-y-3">
                <div style={{ fontFamily, fontWeight: theme.typography['font-weight-light'] }}>
                  <span className="text-muted-foreground text-sm">Light Weight Text</span>
                </div>
                <div style={{ fontFamily, fontWeight: theme.typography['font-weight-regular'] }}>
                  <span className="text-muted-foreground text-sm">Regular Weight Text</span>
                </div>
                <div style={{ fontFamily, fontWeight: theme.typography['font-weight-medium'] }}>
                  <span className="text-muted-foreground text-sm">Medium Weight Text</span>
                </div>
                <div style={{ fontFamily, fontWeight: theme.typography['font-weight-semibold'] }}>
                  <span className="text-muted-foreground text-sm">Semibold Weight Text</span>
                </div>
                <div style={{ fontFamily, fontWeight: theme.typography['font-weight-bold'] }}>
                  <span className="text-muted-foreground text-sm">Bold Weight Text</span>
                </div>
              </div>
            </div>
          </div>

          {/* Article Preview Matching Screenshot */}
          <div style={{ fontFamily }}>
            <h1 className="text-5xl font-bold mb-4" style={{ fontWeight: theme.typography['font-weight-bold'] }}>
              The Future of Web Development: Embracing Modern Technologies
            </h1>

            <p className="text-muted-foreground mb-6" style={{ fontWeight: theme.typography['font-weight-regular'] }}>
              Discover how cutting-edge technologies are reshaping the landscape of web development, from AI-powered tools to revolutionary frameworks that are changing how we build for the web.
            </p>

            {/* Author Info */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg font-semibold">JD</span>
              </div>
              <div>
                <p className="font-medium">Jane Doe</p>
                <p className="text-sm text-muted-foreground">Senior Developer</p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 Dec 15, 2024</span>
                <span>⏱️ 8 min read</span>
              </div>
            </div>

            {/* Placeholder Image */}
            <div className="w-full h-64 bg-muted rounded-lg mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-background rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Body Text */}
            <div className="space-y-4">
              <p style={{ fontWeight: theme.typography['font-weight-regular'] }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <h2 className="text-3xl font-bold mt-8 mb-4" style={{ fontWeight: theme.typography['font-weight-bold'] }}>
                The Evolution of Modern Frameworks
              </h2>

              <p className="text-muted-foreground" style={{ fontWeight: theme.typography['font-weight-regular'] }}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>

              {/* Quote */}
              <div className="my-6 border-l-4 border-primary pl-6 italic">
                <p style={{ fontWeight: theme.typography['font-weight-medium'] }}>
                  "The best way to predict the future is to create it. In web development, we're not just following trends—we're setting them."
                </p>
              </div>

              <h3 className="text-2xl font-semibold mt-6 mb-3" style={{ fontWeight: theme.typography['font-weight-semibold'] }}>
                Key Technologies Shaping the Future
              </h3>

              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Artificial Intelligence and Machine Learning integration</li>
                <li>Edge computing and serverless architectures</li>
                <li>Progressive Web Applications (PWAs)</li>
                <li>WebAssembly for high-performance applications</li>
                <li>Advanced CSS features and container queries</li>
              </ul>

              <p className="mt-4" style={{ fontWeight: theme.typography['font-weight-regular'] }}>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>

              {/* Pro Tip Box */}
              <div className="my-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold mb-1">Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      Always stay updated with the latest web standards and best practices. The web development landscape evolves rapidly, and continuous learning is key to staying relevant.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mt-6 mb-3" style={{ fontWeight: theme.typography['font-weight-semibold'] }}>
                Looking Ahead
              </h3>

              <p style={{ fontWeight: theme.typography['font-weight-regular'] }}>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
              </p>

              <p className="mt-4" style={{ fontWeight: theme.typography['font-weight-regular'] }}>
                At vero eos et accusamus et iusto odio dignissim ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
              </p>
            </div>

            {/* Footer Stats */}
            <div className="mt-8 pt-6 border-t flex items-center gap-6">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <span>❤️</span>
                <span>42</span>
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <span>💬</span>
                <span>12</span>
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <span>📤</span>
                <span>Share</span>
              </button>
              <button className="ml-auto text-sm text-muted-foreground hover:text-foreground">
                🔖 Save for later
              </button>
            </div>

            {/* Author Bio */}
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                  <span className="text-2xl font-semibold">JD</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold">Jane Doe</h4>
                    <button className="px-4 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                      Follow
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Senior Developer & Tech Writer</p>
                  <p className="text-sm">
                    Jane is a passionate developer with over 8 years of experience in web technologies. When she's not coding, you can find her writing about the latest trends in tech.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
