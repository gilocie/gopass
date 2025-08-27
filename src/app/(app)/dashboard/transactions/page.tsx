
'use client';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import type { Organizer, UserProfile } from '@/lib/types';
import { PLANS, PlanId } from '@/lib/plans';
import { useCurrency } from '@/contexts/CurrencyContext';
import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Printer, Rocket, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { getOrganizersByUserId } from '@/services/organizerService';

type FilterType = 'all' | 'today' | 'weekly' | 'monthly';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [userOrganizations, setUserOrganizations] = React.useState<Organizer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = React.useState<{planId: PlanId, date: string} | null>(null);

  React.useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        const [profile, orgs] = await Promise.all([
            getUserProfile(user.uid),
            getOrganizersByUserId(user.uid)
        ]);
        setUserProfile(profile);
        setUserOrganizations(orgs);
        setLoading(false);
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleViewInvoice = (upgrade: {planId: PlanId, date: string}) => {
    setSelectedUpgrade(upgrade);
    setIsInvoiceOpen(true);
  };

  const handlePrintUpgradeInvoice = () => {
    if (!selectedUpgrade || !primaryOrganization) return;
    
    const upgradedPlan = PLANS[selectedUpgrade.planId];

    const PrintableInvoice = () => (
        <html>
            <head>
                <title>Print Invoice</title>
                <style>{`
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; font-size: 12px; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    h2, h3 { margin-top: 0; }
                    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
                    .invoice-header-info { text-align: right; }
                    .organizer-logo { max-width: 120px; max-height: 60px; margin-bottom: 0.5rem; }
                    .organizer-name { font-size: 1.5em; font-weight: bold; }
                    .details-section { margin-bottom: 20px; }
                    .details-section p { margin: 5px 0; }
                    .summary-section { margin-top: 30px; }
                    .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .summary-item:last-child { border-bottom: none; }
                    .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.5em; border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; }
                    .font-mono { font-family: 'Courier New', Courier, monospace; }
                `}</style>
            </head>
            <body>
                <div className="invoice-box">
                    <div className="invoice-header">
                        <div>
                            <div className="organizer-name">GoPass</div>
                        </div>
                        <div className="invoice-header-info">
                            <h2>Invoice</h2>
                            <p><strong>Invoice #:</strong> <span className="font-mono">UPG-${new Date(selectedUpgrade.date).getTime()}</span></p>
                            <p><strong>Date:</strong> ${new Date(selectedUpgrade.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                     <div className="details-section">
                        <h3>Billed To</h3>
                        <p><strong>Organization:</strong> ${primaryOrganization.name}</p>
                        <p><strong>Email:</strong> ${user?.email}</p>
                    </div>

                    <div className="summary-section">
                        <h3>Order Summary</h3>
                        <div class="summary-item">
                            <span>Upgrade to ${upgradedPlan.name} Plan</span>
                            <span>${format(parseInt(upgradedPlan.price))}</span>
                        </div>
                        <div class="total">
                            <span>Total Paid:</span>
                            <span>${format(parseInt(upgradedPlan.price))}</span>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
    
    const printContent = renderToStaticMarkup(<PrintableInvoice />);
    const newWindow = window.open('', '_blank', 'height=600,width=800');
    newWindow?.document.write(printContent);
    newWindow?.document.close();
    newWindow?.focus();
    setTimeout(() => {
        newWindow?.print();
        newWindow?.close();
    }, 250);
  };

  const sortedTransactions = React.useMemo(() => {
    if (!userProfile?.upgradeHistory) return [];
    return [...userProfile.upgradeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userProfile]);
  
  const filteredTransactions = React.useMemo(() => {
    const now = new Date();
    return sortedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        switch (filter) {
            case 'today':
                return isWithinInterval(transactionDate, { start: startOfDay(now), end: endOfDay(now) });
            case 'weekly':
                return isWithinInterval(transactionDate, { start: startOfWeek(now), end: endOfWeek(now) });
            case 'monthly':
                return isWithinInterval(transactionDate, { start: startOfMonth(now), end: endOfMonth(now) });
            case 'all':
            default:
                return true;
        }
    });
  }, [sortedTransactions, filter]);
  
  const primaryOrganization = userOrganizations.length > 0 ? userOrganizations[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">All Transactions</h1>
      </div>
       <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
            <Card>
                <CardHeader>
                    <CardTitle>Upgrade History</CardTitle>
                    <CardDescription>A complete list of your plan upgrade transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((upgrade, index) => {
                                    const plan = PLANS[upgrade.planId];
                                    return (
                                        <TableRow key={index} className="cursor-pointer" onClick={() => handleViewInvoice(upgrade)}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                        <Rocket className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Upgrade to {plan.name} Plan</div>
                                                         <div className="sm:hidden text-xs text-muted-foreground">
                                                            {new Date(upgrade.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{new Date(upgrade.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-medium">{format(parseInt(plan.price))}</TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                                        No transactions found for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-fit p-0 bg-transparent border-0 shadow-none flex items-start gap-2 justify-center">
              <DialogHeader>
                <DialogTitle className="sr-only">Upgrade Invoice</DialogTitle>
                <DialogDescription className="sr-only">
                    Invoice for your plan upgrade.
                </DialogDescription>
            </DialogHeader>
            {selectedUpgrade && primaryOrganization && (
                <>
                    <div className="p-6 bg-card rounded-lg border shadow-lg max-w-md w-full space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">Billed To</h3>
                            <div className="text-sm text-muted-foreground leading-snug">
                                {primaryOrganization.name}<br />
                                {user?.email}<br />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-base">Transaction Details</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Transaction ID:</span>
                                <span className="font-mono">UPG-{new Date(selectedUpgrade.date).getTime()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date:</span>
                                <span>{new Date(selectedUpgrade.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-base">Order Summary</h3>
                            <div className="flex justify-between text-sm">
                                <span>Upgrade to {PLANS[selectedUpgrade.planId].name} Plan</span>
                                <span>{format(parseInt(PLANS[selectedUpgrade.planId].price))}</span>
                            </div>
                            <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-base">
                                <span>Total Paid:</span>
                                <span>{format(parseInt(PLANS[selectedUpgrade.planId].price))}</span>
                            </div>
                        </div>
                    </div>
                    <TooltipProvider>
                        <div className="flex flex-col gap-2 p-2 bg-card rounded-lg border shadow-md">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handlePrintUpgradeInvoice}><Printer /></Button>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>Print Invoice</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsInvoiceOpen(false)}><X/></Button>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>Close</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
