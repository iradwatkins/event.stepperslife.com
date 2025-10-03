'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Facebook, Instagram, MessageSquare, Link as LinkIcon, Check } from 'lucide-react';

interface ShareEventButtonProps {
  eventId: string;
  eventName: string;
  eventDescription?: string | null;
  eventImage?: string | null;
  eventDate: string;
  eventUrl: string;
}

export default function ShareEventButton({
  eventId,
  eventName,
  eventDescription,
  eventImage,
  eventDate,
  eventUrl
}: ShareEventButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${eventUrl}`;
  const shareText = `Check out ${eventName} on ${new Date(eventDate).toLocaleDateString()}!`;

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't have a direct web share API
    // Copy link and show instructions
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied! Open Instagram and paste this link in your story or post.');
  };

  const handleSMSShare = () => {
    const smsBody = `${shareText}\n\n${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
    window.location.href = smsUrl;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleFacebookShare}>
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInstagramShare}>
          <Instagram className="w-4 h-4 mr-2" />
          Share on Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSMSShare}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Share via SMS
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-600">Link Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
