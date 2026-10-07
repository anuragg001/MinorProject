"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Loader2, Calendar, MapPin, Ticket, QrCode } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getCategoryIcon } from "@/lib/data";

export default function MyTicketsPage() {
  const { data: registrations, isLoading } = useConvexQuery(api.registrations.getMyRegistrations);
  const [selectedTicket, setSelectedTicket] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
        <div className="p-6 bg-purple-500/10 rounded-full text-purple-500">
          <Ticket className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">No Tickets Yet</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't registered for any events yet. Explore upcoming events and get your tickets!
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/explore">Explore Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Tickets</h1>
        <p className="text-muted-foreground">Manage your event registrations and digital tickets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registrations.map((reg) => {
          const { event } = reg;
          if (!event) return null;

          return (
            <Card key={reg._id} className="overflow-hidden bg-muted/30 border-muted-foreground/20 hover:border-purple-500/50 transition-colors">
              <div className="relative h-40 w-full">
                {event.coverImage ? (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl"
                    style={{ backgroundColor: event.themeColor || "#1e3a8a" }}
                  >
                    {getCategoryIcon(event.category)}
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-black/60 backdrop-blur-md text-white border-none">
                    {reg.status === "confirmed" ? "Confirmed" : "Cancelled"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1" title={event.title}>{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(event.startDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{event.locationType === "online" ? "Online" : event.venue}</span>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  {reg.status === "confirmed" && (
                    <Button 
                      className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setSelectedTicket(reg)}
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Code
                    </Button>
                  )}
                  <Button variant="outline" asChild className="flex-1">
                    <Link href={`/events/${event.slug}`}>
                      Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Your Ticket</DialogTitle>
            <DialogDescription className="text-center">
              Present this QR code at the event entrance
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <QRCode
                  value={selectedTicket.qrCode || "processing"}
                  size={250}
                  level="H"
                  className="rounded-md"
                />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">{selectedTicket.event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(selectedTicket.event.startDate, "PPP 'at' p")}
                </p>
                <p className="text-sm font-medium pt-2">
                  Attendee: {selectedTicket.attendeeName}
                </p>
              </div>
              <Badge variant="outline" className="text-purple-400 border-purple-500/50">
                Ticket ID: {selectedTicket._id.slice(-6).toUpperCase()}
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
