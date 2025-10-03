# MKT-003: Social Media Integration

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 5
**Priority:** Medium
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** automatically share my events on social media platforms
**So that** I can reach a wider audience and increase event visibility

---

## Acceptance Criteria

### Platform Connections
- [ ] Organizer can connect Facebook account via OAuth
- [ ] Organizer can connect Instagram Business account
- [ ] Organizer can connect Twitter/X account
- [ ] System stores OAuth tokens securely for each platform
- [ ] Organizer can disconnect platforms at any time
- [ ] System displays connection status for each platform
- [ ] Organizer can refresh expired tokens

### Auto-Posting
- [ ] Organizer can enable auto-posting when creating event
- [ ] System automatically posts to selected platforms when event published
- [ ] Organizer can customize message per platform
- [ ] System includes event image in social posts
- [ ] Post includes event title, date, venue, and ticket link
- [ ] System uses platform-specific format (hashtags, mentions)
- [ ] Organizer can schedule posts for optimal times

### Post Customization
- [ ] Organizer can preview post for each platform before publishing
- [ ] System provides character limit warnings per platform
- [ ] Organizer can add custom hashtags
- [ ] System suggests relevant hashtags based on event category
- [ ] Organizer can @mention other accounts
- [ ] System crops/resizes images per platform requirements
- [ ] Organizer can add UTM parameters to tracking links

### Manual Posting
- [ ] Organizer can manually create social post from event dashboard
- [ ] System pre-fills post with event details
- [ ] Organizer can edit message before posting
- [ ] System shows post history with timestamps
- [ ] Organizer can delete or repost content
- [ ] System handles failed posts with retry option

### Engagement Tracking
- [ ] System tracks likes, shares, comments for each post
- [ ] Dashboard shows engagement metrics per platform
- [ ] Organizer can view top-performing posts
- [ ] System tracks clicks on event links (via UTM)
- [ ] Dashboard displays reach and impressions data
- [ ] Organizer can export engagement report

### Post Scheduling
- [ ] Organizer can schedule posts for future date/time
- [ ] System suggests best posting times per platform
- [ ] Organizer can view scheduled post calendar
- [ ] System queues scheduled posts for automatic publishing
- [ ] Organizer can edit or cancel scheduled posts
- [ ] System sends notification when post is published

---

## Technical Requirements

### Social Media API Integration

#### Facebook/Instagram Integration
```typescript
// Facebook Graph API Integration
interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  instagramBusinessAccountId?: string;
}

interface SocialMediaPost {
  id: string;
  eventId: string;
  platform: 'facebook' | 'instagram' | 'twitter';
  platformPostId?: string;
  message: string;
  imageUrl?: string;
  link: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: Date;
  publishedAt?: Date;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  clicks: number;
  error?: string;
}

export class FacebookService {
  async postToPage(
    pageAccessToken: string,
    pageId: string,
    content: {
      message: string;
      link: string;
      imageUrl?: string;
    }
  ): Promise<string> {
    const formData = new FormData();
    formData.append('message', content.message);
    formData.append('link', content.link);

    if (content.imageUrl) {
      formData.append('url', content.imageUrl);
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pageAccessToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.id; // Post ID
  }

  async postToInstagram(
    pageAccessToken: string,
    instagramAccountId: string,
    content: {
      caption: string;
      imageUrl: string;
    }
  ): Promise<string> {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pageAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: content.imageUrl,
          caption: content.caption,
        }),
      }
    );

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Step 2: Publish media container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pageAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      }
    );

    const publishData = await publishResponse.json();
    return publishData.id;
  }

  async getPostInsights(
    postId: string,
    accessToken: string
  ): Promise<PostInsights> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),shares,comments.summary(true),insights.metric(post_impressions,post_clicks)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    return {
      likes: data.likes.summary.total_count,
      shares: data.shares?.count || 0,
      comments: data.comments.summary.total_count,
      reach: data.insights.data[0]?.values[0]?.value || 0,
      clicks: data.insights.data[1]?.values[0]?.value || 0,
    };
  }
}
```

#### Twitter/X Integration
```typescript
// Twitter API v2 Integration
import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
  private client: TwitterApi;

  constructor(credentials: {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
  }) {
    this.client = new TwitterApi({
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });
  }

  async postTweet(content: {
    text: string;
    imageUrl?: string;
  }): Promise<string> {
    let mediaId: string | undefined;

    // Upload image if provided
    if (content.imageUrl) {
      const imageBuffer = await this.downloadImage(content.imageUrl);
      mediaId = await this.client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg',
      });
    }

    const tweet = await this.client.v2.tweet({
      text: content.text,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    });

    return tweet.data.id;
  }

  async getTweetMetrics(tweetId: string): Promise<TweetMetrics> {
    const tweet = await this.client.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics'],
    });

    return {
      likes: tweet.data.public_metrics?.like_count || 0,
      retweets: tweet.data.public_metrics?.retweet_count || 0,
      replies: tweet.data.public_metrics?.reply_count || 0,
      impressions: tweet.data.public_metrics?.impression_count || 0,
    };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
```

### Auto-Post Service
```typescript
// Auto-post when event is published
export class SocialMediaAutoPostService {
  async postEventToSocialMedia(
    event: Event,
    platforms: string[]
  ): Promise<void> {
    const organization = await this.getOrganization(event.organizationId);
    const socialAccounts = await this.getSocialAccounts(organization.id);

    for (const platform of platforms) {
      const account = socialAccounts.find(a => a.platform === platform);
      if (!account || !account.isConnected) continue;

      try {
        const post = await this.createPost(event, platform);
        const platformPostId = await this.publishToPlat form(
          platform,
          account,
          post
        );

        await this.saveSocialPost({
          eventId: event.id,
          platform,
          platformPostId,
          message: post.message,
          imageUrl: post.imageUrl,
          link: post.link,
          status: 'published',
          publishedAt: new Date(),
        });
      } catch (error) {
        await this.logPostError(event.id, platform, error);
      }
    }
  }

  private async createPost(
    event: Event,
    platform: string
  ): Promise<PostContent> {
    const eventUrl = `${process.env.APP_URL}/events/${event.id}?utm_source=${platform}&utm_medium=social&utm_campaign=event_${event.id}`;

    const hashtags = this.generateHashtags(event);
    const emoji = this.getEventEmoji(event.category);

    let message = '';

    if (platform === 'twitter') {
      // Twitter: 280 characters
      message = `${emoji} ${event.title}\n\n` +
                `${this.formatDate(event.startDate)} at ${event.venue.name}\n` +
                `${hashtags.slice(0, 3).join(' ')}\n\n` +
                `Tickets: ${eventUrl}`;
    } else if (platform === 'facebook' || platform === 'instagram') {
      message = `${emoji} ${event.title}\n\n` +
                `Join us on ${this.formatDate(event.startDate)} at ${event.venue.name}!\n\n` +
                `${event.description.substring(0, 150)}...\n\n` +
                `Get your tickets now: ${eventUrl}\n\n` +
                `${hashtags.join(' ')}`;
    }

    return {
      message,
      imageUrl: event.imageUrl,
      link: eventUrl,
    };
  }

  private generateHashtags(event: Event): string[] {
    const hashtags = [
      '#Event',
      `#${event.category.replace(/\s+/g, '')}`,
      `#${event.venue.city.replace(/\s+/g, '')}`,
    ];

    // Add custom hashtags from event
    if (event.hashtags) {
      hashtags.push(...event.hashtags.map(tag => `#${tag}`));
    }

    return hashtags;
  }
}
```

### OAuth Connection Flow
```typescript
// /api/social/connect/facebook/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Verify state to prevent CSRF
  const session = await getSession();
  if (state !== session.oauthState) {
    return new Response('Invalid state', { status: 400 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${process.env.FACEBOOK_APP_ID}&` +
    `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
    `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}&` +
    `code=${code}`
  );

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get long-lived token
  const longLivedTokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${process.env.FACEBOOK_APP_ID}&` +
    `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
    `fb_exchange_token=${accessToken}`
  );

  const longLivedData = await longLivedTokenResponse.json();

  // Get user's pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`
  );

  const pagesData = await pagesResponse.json();

  // Save connected accounts
  for (const page of pagesData.data) {
    await prisma.socialMediaAccount.upsert({
      where: {
        organizationId_platform: {
          organizationId: session.organizationId,
          platform: 'facebook',
        },
      },
      update: {
        platformAccountId: page.id,
        platformAccountName: page.name,
        accessToken: page.access_token,
        isConnected: true,
      },
      create: {
        organizationId: session.organizationId,
        platform: 'facebook',
        platformAccountId: page.id,
        platformAccountName: page.name,
        accessToken: page.access_token,
        isConnected: true,
      },
    });
  }

  return redirect('/dashboard/settings?connected=facebook');
}
```

---

## Database Schema

```prisma
model SocialMediaAccount {
  id                    String   @id @default(cuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  platform              SocialPlatform
  platformAccountId     String
  platformAccountName   String
  accessToken           String   @db.Text
  refreshToken          String?  @db.Text
  tokenExpiresAt        DateTime?
  isConnected           Boolean  @default(true)

  posts                 SocialMediaPost[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([organizationId, platform])
  @@index([organizationId])
}

model SocialMediaPost {
  id                String   @id @default(cuid())
  eventId           String
  event             Event @relation(fields: [eventId], references: [id])
  accountId         String
  account           SocialMediaAccount @relation(fields: [accountId], references: [id])

  platform          SocialPlatform
  platformPostId    String?
  message           String   @db.Text
  imageUrl          String?
  link              String

  status            PostStatus @default(DRAFT)
  scheduledAt       DateTime?
  publishedAt       DateTime?
  error             String?

  // Engagement metrics
  likes             Int      @default(0)
  shares            Int      @default(0)
  comments          Int      @default(0)
  reach             Int      @default(0)
  impressions       Int      @default(0)
  clicks            Int      @default(0)

  lastSyncedAt      DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId])
  @@index([accountId])
  @@index([status])
}

enum SocialPlatform {
  FACEBOOK
  INSTAGRAM
  TWITTER
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}
```

---

## API Endpoints

```typescript
// Social Media Account Management
POST   /api/social/connect/facebook      // Initiate Facebook OAuth
GET    /api/social/callback/facebook     // Facebook OAuth callback
POST   /api/social/connect/twitter       // Initiate Twitter OAuth
GET    /api/social/callback/twitter      // Twitter OAuth callback
POST   /api/social/disconnect/:platform  // Disconnect platform
GET    /api/social/accounts               // List connected accounts

// Social Media Posting
POST   /api/social/posts                 // Create social post
GET    /api/social/posts                 // List posts
GET    /api/social/posts/:id             // Get post details
PUT    /api/social/posts/:id             // Update post
DELETE /api/social/posts/:id             // Delete post
POST   /api/social/posts/:id/publish     // Publish post now
POST   /api/social/posts/:id/schedule    // Schedule post

// Analytics
GET    /api/social/analytics/:eventId    // Get social analytics for event
POST   /api/social/posts/:id/sync        // Sync engagement metrics
```

---

## UI/UX Requirements

### Social Media Connection Page
1. **Connection Status Cards**
   - Platform logo and name
   - Connection status (Connected/Disconnected)
   - Connected account name
   - Connect/Disconnect button
   - Last synced timestamp

2. **Facebook Connection**
   - "Connect Facebook Page" button
   - Lists available pages after OAuth
   - Select page to connect
   - Shows page name and follower count

3. **Instagram Connection**
   - Requires Facebook Business Page connection
   - Shows Instagram Business account linked to page
   - Auto-connects when Facebook page connected

4. **Twitter Connection**
   - "Connect Twitter Account" button
   - Shows connected username
   - Display follower count

### Event Social Sharing Interface
1. **Auto-Post Toggle**
   - Enable/disable auto-posting per platform
   - "Post to social media when published" checkbox
   - Platform selection (Facebook, Instagram, Twitter)

2. **Post Preview**
   - Preview card for each platform
   - Shows formatted message
   - Displays event image
   - Character count indicator
   - Edit button to customize message

3. **Manual Post Creation**
   - "Share on Social Media" button on event dashboard
   - Modal with platform selection
   - Message editor with character counter
   - Image preview and selection
   - Hashtag suggestions
   - Schedule option
   - "Post Now" and "Schedule Post" buttons

4. **Post History**
   - Table of past social posts
   - Columns: Platform, Message, Posted Date, Engagement
   - View insights button per post
   - Repost option

---

## Third-Party Documentation

### Facebook Graph API
- **API Docs:** https://developers.facebook.com/docs/graph-api
- **Page Posts:** https://developers.facebook.com/docs/graph-api/reference/page/feed
- **Instagram API:** https://developers.facebook.com/docs/instagram-api
- **OAuth:** https://developers.facebook.com/docs/facebook-login/guides/access-tokens

### Twitter API v2
- **API Docs:** https://developer.twitter.com/en/docs/twitter-api
- **Create Tweet:** https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
- **Media Upload:** https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview
- **OAuth 1.0a:** https://developer.twitter.com/en/docs/authentication/oauth-1-0a

### NPM Packages
- **twitter-api-v2:** https://www.npmjs.com/package/twitter-api-v2
- **facebook-nodejs-business-sdk:** https://www.npmjs.com/package/facebook-nodejs-business-sdk

---

## Testing Requirements

### Unit Tests
- Post message generation for each platform
- Hashtag generation and formatting
- Character limit validation
- UTM parameter generation
- Image URL validation

### Integration Tests
- Facebook OAuth flow
- Twitter OAuth flow
- Post creation on each platform
- Engagement metrics sync
- Scheduled post publishing
- Error handling for expired tokens

### Manual Testing
- Verify posts appear correctly on each platform
- Test image rendering across platforms
- Validate UTM tracking links
- Confirm engagement metrics accuracy
- Test scheduled post timing

---

## Image Requirements by Platform

### Facebook
- **Recommended Size:** 1200x630px
- **Aspect Ratio:** 1.91:1
- **Max File Size:** 8MB
- **Formats:** JPG, PNG, GIF

### Instagram
- **Recommended Size:** 1080x1080px (square) or 1080x1350px (portrait)
- **Aspect Ratio:** 1:1 or 4:5
- **Max File Size:** 8MB
- **Formats:** JPG, PNG

### Twitter/X
- **Recommended Size:** 1200x675px
- **Aspect Ratio:** 16:9
- **Max File Size:** 5MB
- **Formats:** JPG, PNG, GIF, WebP

### Image Processing
```typescript
// Resize and optimize images for each platform
export async function prepareImageForPlatform(
  imageUrl: string,
  platform: SocialPlatform
): Promise<string> {
  const dimensions = {
    facebook: { width: 1200, height: 630 },
    instagram: { width: 1080, height: 1080 },
    twitter: { width: 1200, height: 675 },
  };

  const size = dimensions[platform];

  // Use Sharp or similar library to resize
  const optimizedImage = await resizeImage(imageUrl, size);

  return optimizedImage.url;
}
```

---

## Dependencies
- **Requires:** Facebook App ID and Secret, Twitter API credentials
- **Integrates With:** Event creation flow, Analytics dashboard
- **Optional:** Image optimization service (Sharp, Cloudinary)

---

## Notes
- Facebook requires app review for certain permissions
- Instagram posting requires Instagram Business Account
- Twitter API v2 requires Elevated access for posting
- Consider rate limits: Facebook (200 calls/hour), Twitter (300 posts/3 hours)
- Store OAuth tokens encrypted in database
- Implement token refresh logic for expired tokens
- Consider adding LinkedIn integration in future