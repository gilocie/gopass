import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">About GoPass</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to GoPass, your ultimate solution for seamless and secure event management. Our mission is to empower event organizers with the tools they need to create unforgettable experiences, from intimate gatherings to large-scale conferences.
          </p>
          <p>
            Founded on the principles of innovation and user-centric design, GoPass was built to address the common challenges organizers face. We saw a need for a platform that combines a powerful ticket designer, robust attendee management, and a secure verification system, all in one intuitive package.
          </p>
          <p>
            Our team is composed of passionate developers, designers, and event enthusiasts who are dedicated to continuous improvement. We believe in building strong relationships with our users and leveraging their feedback to make GoPass the best event management platform on the market.
          </p>
          <p>
            Thank you for choosing GoPass. We're excited to be a part of your next successful event.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
