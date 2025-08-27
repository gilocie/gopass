import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Get in Touch</h1>
          <p className="text-muted-foreground">
            We'd love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">support@gopass.app</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">123 Event Lane, Celebration City, USA</span>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your Name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message..." />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
