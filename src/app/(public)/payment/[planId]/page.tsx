
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PLANS, PlanId } from '@/lib/plans';
import { initiatePlanUpgradeDeposit, getCountryConfig, checkDepositStatus } from '@/services/pawaPayService';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { upgradeUserPlan } from '@/services/userService';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PawaPayProvider } from '@/services/pawaPayService';

export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const { format: formatPrice, currency } = useCurrency();
    const planId = params.planId as PlanId;
    const plan = PLANS[planId];

    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [selectedProvider, setSelectedProvider] = React.useState<PawaPayProvider | null>(null);
    
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [depositId, setDepositId] = React.useState<string | null>(null);
    const [providers, setProviders] = React.useState<PawaPayProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = React.useState(true);
    const [countryPrefix, setCountryPrefix] = React.useState('');
    
    // --- Polling Logic ---
    React.useEffect(() => {
        if (paymentStatus !== 'pending' || !depositId) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const { status } = await checkDepositStatus(depositId);
                if (status === 'COMPLETED') {
                    setPaymentStatus('success');
                    if(user) await upgradeUserPlan(user.uid, planId);
                    toast({ title: 'Success!', description: `You have been upgraded to the ${plan.name} plan.` });
                    clearInterval(interval);
                    setTimeout(() => router.push('/dashboard'), 2000);
                } else if (status === 'FAILED' || status === 'REJECTED') {
                    setPaymentStatus('failed');
                    toast({ variant: 'destructive', title: 'Payment Failed', description: 'Your transaction could not be completed.' });
                    clearInterval(interval);
                    setIsProcessing(false);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);

    }, [paymentStatus, depositId, user, planId, router, toast, plan.name]);
    
    // --- Fetch Providers ---
     React.useEffect(() => {
        const fetchProviders = async () => {
            setLoadingProviders(true);
            try {
                const config = await getCountryConfig('MWI');
                if (config) {
                    setProviders(config.providers);
                    setCountryPrefix(config.prefix);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load payment providers.' });
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not load payment providers.' });
            } finally {
                setLoadingProviders(false);
            }
        }
        fetchProviders();
    }, [toast]);


    const priceInLocalCurrency = parseFloat(plan.price) * (currency.code === 'MWK' ? 1750 : 1);


    const handlePayment = async () => {
        if (!user || !selectedProvider) {
            toast({ variant: 'destructive', title: 'Error', description: 'Configuration missing.' });
            return;
        }
        if (!phoneNumber) {
            toast({ variant: 'destructive', title: 'Phone Number Required', description: 'Please enter a valid phone number.' });
            return;
        }
       
        setPaymentStatus('pending');
        setIsProcessing(true);
        
        try {
            const result = await initiatePlanUpgradeDeposit({
                userId: user.uid,
                planId: planId,
                amount: priceInLocalCurrency.toString(),
                currency: 'MWK',
                country: 'MWI',
                correspondent: selectedProvider.provider,
                customerPhone: `${countryPrefix}${phoneNumber.replace(/^0+/, '')}`,
                statementDescription: `GoPass ${plan.name} Plan`,
            });
            
            if (result.success && result.depositId) {
                setDepositId(result.depositId);
            } else {
                setPaymentStatus('failed');
                toast({ variant: 'destructive', title: 'Payment Failed', description: result.message || 'Could not initiate payment.' });
                setIsProcessing(false);
            }
        } catch (error: any) {
            setPaymentStatus('failed');
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unexpected error occurred.' });
            setIsProcessing(false);
        }
    };
    
    if (!plan) {
        router.push('/pricing');
        return null;
    }
    
    const amountIsValid = selectedProvider ? 
        priceInLocalCurrency >= selectedProvider.minAmount && priceInLocalCurrency <= selectedProvider.maxAmount
        : false;
    
    const canSubmit = !isProcessing && phoneNumber && selectedProvider && selectedProvider.status === 'OPERATIONAL' && amountIsValid;
    const operationalProviders = providers.filter(p => p.status === 'OPERATIONAL');

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                     <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <CardTitle className="text-center pt-8">Complete Your Purchase</CardTitle>
                    <CardDescription className="text-center">You are upgrading to the <span className="font-bold text-primary">{plan.name}</span> plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {paymentStatus === 'pending' ? (
                        <div className="text-center p-2 flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <h3 className="font-semibold text-lg">Awaiting Confirmation</h3>
                            <p className="text-muted-foreground text-sm">
                                Please check your phone and enter your PIN to approve the payment of {formatPrice(priceInLocalCurrency, true)}.
                           </p>
                           <Button variant="outline" onClick={() => { setPaymentStatus('idle'); setIsProcessing(false); }}>Cancel</Button>
                        </div>
                    ) : paymentStatus === 'success' ? (
                         <div className="text-center py-8 flex flex-col items-center gap-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h3 className="font-semibold text-lg">Upgrade Complete!</h3>
                            <p className="text-muted-foreground text-sm">
                                Redirecting you to the dashboard...
                           </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Label>Select Payment Method</Label>
                                {loadingProviders ? (
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <Skeleton className="h-20" />
                                        <Skeleton className="h-20" />
                                    </div>
                                ) : (
                                    <RadioGroup value={selectedProvider?.provider} onValueChange={(providerId) => setSelectedProvider(providers.find(p => p.provider === providerId) || null)} className="grid grid-cols-2 gap-4 mt-2">
                                        {providers.map(p => (
                                            <div key={p.provider}>
                                                <RadioGroupItem value={p.provider} id={p.provider} className="peer sr-only" disabled={p.status !== 'OPERATIONAL'} />
                                                <Label 
                                                    htmlFor={p.provider} 
                                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-muted/20 hover:border-primary peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors cursor-pointer h-16 p-2 overflow-hidden peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                                                >
                                                    <div className="relative w-full h-full">
                                                        <Image src={p.logo} alt={p.displayName} fill style={{ objectFit: 'contain' }} />
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone-number">Phone Number</Label>
                                <div className="relative">
                                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                        +{countryPrefix}
                                    </div>
                                    <Input 
                                        id="phone-number" 
                                        placeholder="991234567" 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)} 
                                        className="pl-14"
                                    />
                                </div>
                            </div>
                             {selectedProvider && !amountIsValid && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Amount Out of Range</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        The total amount of {formatPrice(priceInLocalCurrency, true)} is outside the allowed range for {selectedProvider.displayName}.
                                        ({formatPrice(selectedProvider.minAmount, true)} - {formatPrice(selectedProvider.maxAmount, true)})
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button onClick={handlePayment} disabled={!canSubmit} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                {isProcessing && paymentStatus === 'idle' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Pay {formatPrice(priceInLocalCurrency, true)}
                            </Button>
                            {paymentStatus === 'failed' && (
                                <Button variant="outline" onClick={() => { setPaymentStatus('idle'); setIsProcessing(false); }}>Try Again</Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    