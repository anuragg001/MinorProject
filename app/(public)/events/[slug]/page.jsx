"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Loader2, Calendar, MapPin, Users, Share2, Ticket, QrCode } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function EventDetailsPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [showQR, setShowQR] = useState(false);

  const { data: event, isLoading } = useConvexQuery(api.events.getEventBySlug, {
    slug,
  });

  const { data: registrationStatus } = useConvexQuery(
    api.registrations.checkRegistration,
    event && user ? { eventId: event._id } : "skip"
  );

  const { mutate: register, isLoading: isRegistering } = useConvexMutation(
    api.registrations.registerForEvent
  );

  const handleRegister = async () => {
    if (!isUserLoaded) return;
    if (!user) {
      toast.error("Please sign in to register for this event.");
      router.push("/sign-in");
      return;
    }

    try {
      await register({ eventId: event._id });
      toast.success("Successfully registered for the event!");
      setShowQR(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <h1 className="text-4xl font-bold">Event Not Found</h1>
        <p className="text-muted-foreground">This event might have been deleted or doesn't exist.</p>
        <Button onClick={() => router.push("/explore")}>Back to Explore</Button>
      </div>
    );
  }

  const isRegistered = registrationStatus?.isRegistered;
  const qrCodeData = registrationStatus?.registration?.qrCode;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden mb-8">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-8xl"
            style={{ backgroundColor: event.themeColor || "#1e3a8a" }}
          >
            {getCategoryIcon(event.category)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
              {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
            </Badge>
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-white border-white/20">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{format(event.startDate, "PPP 'at' p")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{event.locationType === "online" ? "Online Event" : `${event.city}, ${event.state || event.country}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{event.registrationCount} / {event.capacity} Registered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Location</h2>
            <Card className="bg-muted/50 border-none">
              <CardContent className="p-6">
                {event.locationType === "online" ? (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-full text-purple-500">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">Online Event</h3>
                      <p className="text-sm text-muted-foreground">Link will be provided upon registration</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-full text-purple-500 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{event.venue}</h3>
                        <p className="text-muted-foreground mt-1">{event.address}</p>
                        <p className="text-muted-foreground">{event.city}, {event.state} {event.country}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-purple-500/20 shadow-xl shadow-purple-500/5 bg-black/40 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Tickets</p>
                <div className="text-3xl font-bold">
                  {event.ticketType === "free" ? (
                    "Free"
                  ) : (
                    `₹${event.ticketPrice}`
                  )}
                </div>
              </div>

              {isRegistered ? (
                <Button 
                  className="w-full h-12 text-lg gap-2 bg-green-600 hover:bg-green-700 text-white" 
                  size="lg"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="w-5 h-5" />
                  Show Ticket (QR Code)
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 text-lg gap-2" 
                  size="lg"
                  onClick={handleRegister}
                  disabled={isRegistering || event.registrationCount >= event.capacity}
                >
                  {isRegistering ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Ticket className="w-5 h-5" />
                  )}
                  {event.registrationCount >= event.capacity ? "Join Waitlist" : "Register Now"}
                </Button>
              )}

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-sm font-medium mb-3">Organized by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">
                    {event.organizerName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{event.organizerName}</p>
                    <p className="text-xs text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}>
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Your Ticket</DialogTitle>
            <DialogDescription className="text-center">
              Present this QR code at the event entrance
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
              <QRCode
                value={qrCodeData || "processing"}
                size={250}
                level="H"
                className="rounded-md"
              />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">{event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {format(event.startDate, "PPP 'at' p")}
              </p>
            </div>
            <Badge variant="outline" className="text-purple-400 border-purple-500/50">
              Confirmed
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
