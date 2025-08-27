
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Organizer } from '@/lib/types';
import { createOrganizer } from '@/services/organizerService';
import { Banner } from '@/components/ui/banner';
import { Save, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, name: 'Profile Details' },
  { id: 2, name: 'Branding' },
  { id: 3, name: 'Contact Information' },
];

export default function NewOrganizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);

  // Step 1 State
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [website, setWebsite] = React.useState('');
  
  // Step 2 State
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);

  // Step 3 State
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');

  const handleNext = () => {
    if (currentStep === 1 && (!name || !description)) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter your organization name and description.' });
        return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!user || !name || !description) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a name and description for your organization." });
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    
    const newOrgData: Omit<Organizer, 'id'> = {
        userId: user.uid,
        name,
        description,
        website: website || '',
        logoUrl: logoUrl || '',
        bannerUrl: bannerUrl || '',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
        isActive: true, // Default to active
    };

    try {
      const newOrgId = await createOrganizer(newOrgData);
      toast({ title: "Organization Created", description: "Your new profile has been created." });
      router.push(`/organizer/${newOrgId}`);
    } catch (error) {
       toast({ variant: "destructive", title: "Save Failed", description: "Could not save your organization profile." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Create New Organization Page</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Profile Setup</CardTitle>
          <CardDescription>
            This information will be displayed on your public organizer page.
            <span className="font-medium text-primary"> Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}</span>
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <div className="grid gap-6 animate-in fade-in">
                <div className="grid gap-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" placeholder="e.g., Awesome Events Inc." value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="org-description">About Your Organization</Label>
                  <Textarea id="org-description" placeholder="Describe what your organization does..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="org-website">Website (Optional)</Label>
                  <Input id="org-website" placeholder="https://your-organization.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="grid gap-8 animate-in fade-in">
                 <div>
                    <Label className="text-base font-semibold">Organization Logo</Label>
                    <p className="text-sm text-muted-foreground mb-2">Recommended size: 400x400px.</p>
                    <div className="w-full max-w-xs">
                        <Banner initialImage={logoUrl} onImageChange={setLogoUrl} />
                    </div>
                </div>
                 <div>
                    <Label className="text-base font-semibold">Header Banner</Label>
                    <p className="text-sm text-muted-foreground mb-2">This will appear at the top of your profile page. Recommended size: 1600x400px.</p>
                    <Banner initialImage={bannerUrl} onImageChange={setBannerUrl} />
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="grid gap-6 animate-in fade-in">
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Public Contact Email</Label>
                  <Input id="contact-email" type="email" placeholder="support@your-organization.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-phone">Public Contact Phone (Optional)</Label>
                  <Input id="contact-phone" type="tel" placeholder="+1 (555) 123-4567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
                 <div className="mt-4 p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">You're all set!</p>
                    <p>After saving, your new page will be live. You can start creating and linking events to it from the events dashboard.</p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {currentStep < steps.length ? (
          <Button onClick={handleNext} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isSaving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Creating Page...' : 'Create and View Page'}
          </Button>
        )}
      </div>
    </div>
  );
}
