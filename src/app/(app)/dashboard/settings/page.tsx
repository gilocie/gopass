
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Organizer, UserProfile } from '@/lib/types';
import { getOrganizersByUserId, updateOrganizer } from '@/services/organizerService';
import { Banner } from '@/components/ui/banner';
import { Save, Loader2, CreditCard, User, Building, Trash2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateUserProfile, updateUserPassword, deleteUserAccount, reauthenticateUser, getUserProfile, updateUserFirestoreProfile } from '@/services/userService';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, BASE_CURRENCY_CODE } from '@/lib/currency';

// Schemas for form validation
const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});


export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSavingOrg, setIsSavingOrg] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');

  // Org form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  
  // Localization state
  const [selectedCountryCode, setSelectedCountryCode] = React.useState('US');
  const [exchangeRates, setExchangeRates] = React.useState<{ [key: string]: number }>({});
  
  // RHF Forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: user?.displayName || '', email: user?.email || '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [orgs, profile] = await Promise.all([
            getOrganizersByUserId(user.uid),
            getUserProfile(user.uid)
        ]);

        if (profile) {
            setUserProfile(profile);
            setSelectedCountryCode(profile.countryCode || 'US');
            setExchangeRates(profile.exchangeRates || {});
        }
        
        if (orgs.length > 0) {
            const mainOrg = orgs[0];
            setOrganizer(mainOrg);
            setName(mainOrg.name);
            setDescription(mainOrg.description);
            setLogoUrl(mainOrg.logoUrl || null);
        }
        
        profileForm.reset({
            displayName: user.displayName || '',
            email: user.email || '',
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch your settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, toast, profileForm]);

  const handleSaveOrg = async () => {
    if (!user || !organizer || !name || !description) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a name and description." });
      return;
    }

    setIsSavingOrg(true);
    
    const profileData: Partial<Organizer> = {
      name,
      description,
      logoUrl: logoUrl || '',
    };

    try {
      await updateOrganizer(organizer.id, profileData);
      toast({ title: "Settings Saved", description: "Your profile has been successfully updated." });
    } catch (error) {
       toast({ variant: "destructive", title: "Save Failed", description: "Could not save your settings." });
    } finally {
      setIsSavingOrg(false);
    }
  };
  
  const handleUpdateProfile = async (values: z.infer<typeof profileFormSchema>) => {
      if (!user) return;
      setIsSavingProfile(true);
      try {
          await updateUserProfile(user, { displayName: values.displayName, email: values.email });
          await updateUserFirestoreProfile(user.uid, { countryCode: selectedCountryCode, exchangeRates });
          toast({ title: "Profile Updated", description: "Your details and preferences have been updated." });
          window.location.reload(); // To apply currency changes
      } catch (error: any) {
          toast({ variant: "destructive", title: "Update Failed", description: error.message });
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleChangePassword = async (values: z.infer<typeof passwordFormSchema>) => {
      if (!user) return;
      setIsChangingPassword(true);
      try {
          await reauthenticateUser(values.currentPassword);
          await updateUserPassword(values.newPassword);
          toast({ title: "Password Changed", description: "Your password has been successfully updated." });
          passwordForm.reset();
      } catch (error: any) {
          toast({ variant: "destructive", title: "Password Change Failed", description: error.message });
      } finally {
          setIsChangingPassword(false);
      }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteUserAccount();
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        router.push('/');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        setIsDeleting(false);
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading settings...</div>
  }

  const selectedCountry = countries.find(c => c.code === selectedCountryCode);
  const selectedCurrency = selectedCountry?.currency;
  const requiresRateInput = selectedCurrency && selectedCurrency.code !== BASE_CURRENCY_CODE;

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCurrency) return;
    const { value } = e.target;
    setExchangeRates(prev => ({ ...prev, [selectedCurrency.code]: parseFloat(value) || 0 }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
      </div>

       <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile"><Building className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="account"><User className="mr-2 h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" /> Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
            <Card>
                <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                    This is your primary organization profile. The logo will appear in the header.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {organizer ? (
                        <>
                            <div className="grid gap-2">
                                <Label>Organization Logo</Label>
                                <p className="text-sm text-muted-foreground">Recommended size: 400x400px.</p>
                                <div className="w-full max-w-xs">
                                    <Banner initialImage={logoUrl} onImageChange={setLogoUrl} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="org-name">Organization Name</Label>
                                <Input id="org-name" placeholder="e.g., Awesome Events Inc." value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="org-description">About Your Organization</Label>
                                <Textarea id="org-description" placeholder="Describe what your organization does..." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveOrg} disabled={isSavingOrg}>
                                    {isSavingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    {isSavingOrg ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            <p>You haven't created an organizer profile yet.</p>
                             <Button asChild variant="link"><Link href="/dashboard/organization/new">Create one now</Link></Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="account">
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your personal account details and security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {/* Update Profile Form */}
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                             <h3 className="font-semibold text-lg">Personal Information</h3>
                             <FormField
                                control={profileForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="your@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Separator />
                            <h3 className="font-semibold text-lg">Localization</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                                        <SelectTrigger id="country">
                                            <SelectValue placeholder="Select your country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map(c => (
                                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                     <Label>Currency</Label>
                                     <Input readOnly value={selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.symbol})` : 'N/A'} />
                                </div>
                             </div>
                             {requiresRateInput && selectedCurrency && (
                                <div className="grid gap-2 animate-in fade-in">
                                    <Label htmlFor="exchange-rate">Exchange Rate from {BASE_CURRENCY_CODE} to {selectedCurrency.code}</Label>
                                    <Input
                                        id="exchange-rate"
                                        type="number"
                                        value={exchangeRates[selectedCurrency.code] || ''}
                                        onChange={handleRateChange}
                                        placeholder={`1 ${BASE_CURRENCY_CODE} = ? ${selectedCurrency.name}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter how many {selectedCurrency.name} are equal to 1 {BASE_CURRENCY_CODE}.
                                    </p>
                                </div>
                             )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSavingProfile}>
                                    {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    {isSavingProfile ? 'Saving...' : 'Save Account Info'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                     <Separator />
                     {/* Change Password Form */}
                     <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                             <h3 className="font-semibold text-lg">Change Password</h3>
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    {isChangingPassword ? 'Saving...' : 'Change Password'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                    <Separator />
                    {/* Danger Zone */}
                    <div className="p-4 border border-destructive/50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                             <div>
                                 <p className="font-medium">Delete Account</p>
                                 <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                             </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete Account</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is permanent. All your events, tickets, and organizer pages will be deleted. To confirm, type <span className="font-bold text-foreground">DELETE</span> below.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder="Type DELETE to confirm"
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="billing">
            <Card>
                <CardHeader>
                    <CardTitle>Billing & Subscriptions</CardTitle>
                    <CardDescription>Manage your payment methods and subscription plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold">Coming Soon!</h3>
                        <p>Our billing and subscription management portal is currently under construction.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}
