
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';

const defaultTemplates = [
  { id: 'modern', name: 'Modern', description: 'A sleek and contemporary design for tech events.', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'minimalist', name: 'Minimalist', description: 'A clean and simple layout focusing on the essentials.', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'classic', name: 'Classic', description: 'An elegant and traditional design for formal gatherings.', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'vibrant', name: 'Vibrant', description: 'A colorful and energetic design for festivals and parties.', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'corporate', name: 'Corporate', description: 'A professional and branded look for business conferences.', imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'artistic', name: 'Artistic', description: 'A creative and unique design for art shows and exhibitions.', imageUrl: 'https://placehold.co/600x400.png' },
];

export default function TemplatesPage() {
    const [savedTemplates, setSavedTemplates] = useLocalStorage('ticket-templates', []);
    const allTemplates = [...defaultTemplates, ...savedTemplates];

    const handleDeleteTemplate = (templateId: string) => {
        setSavedTemplates(savedTemplates.filter((t: any) => t.id !== templateId));
    };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <div>
            <h1 className="text-lg font-semibold md:text-2xl">Ticket Templates</h1>
            <p className="text-sm text-muted-foreground">Choose a template to start designing your ticket, or start from scratch.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/dashboard/designer" className="flex items-center gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Start from Scratch
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search templates..." className="pl-10" />
            </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTemplates.map((template: any) => (
          <Card key={template.id} className="flex flex-col overflow-hidden transition-all hover:shadow-lg group">
            <div className="relative h-48 w-full">
              <Image
                src={template.imageUrl || 'https://placehold.co/600x400.png'}
                alt={template.name}
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint="ticket template design"
              />
               {savedTemplates.some((st: any) => st.id === template.id) && (
                 <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4" />
                 </Button>
               )}
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription className="h-10">{template.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/designer?template=${template.id}`}>Customize</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

    