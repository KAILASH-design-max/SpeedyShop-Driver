
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ShieldX, PlusCircle, Loader2, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Profile, Penalty } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const appealSchema = z.object({
  appealComment: z.string().min(20, "Appeal reason must be at least 20 characters long."),
});

interface PenaltyManagementProps {
  profile: Profile;
  onAppealSubmit: (penaltyId: string, appealComment: string) => Promise<void>;
}

export function PenaltyManagement({ profile, onAppealSubmit }: PenaltyManagementProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof appealSchema>>({
    resolver: zodResolver(appealSchema),
    defaultValues: {
      appealComment: "",
    },
  });

  async function onSubmit(values: z.infer<typeof appealSchema>) {
    if (!selectedPenaltyId) return;
    setIsSaving(true);
    try {
      await onAppealSubmit(selectedPenaltyId, values.appealComment);
      form.reset();
      setSelectedPenaltyId(null);
    } catch (error) {
      console.error("Failed to submit appeal:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const sortedPenalties = [...(profile.penalties || [])].sort((a, b) => {
    if (a.date?.seconds && b.date?.seconds) {
      return b.date.seconds - a.date.seconds;
    }
    return 0;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800 border-red-200';
      case 'Appealed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Removed':
      case 'Expired':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-none md:shadow-xl rounded-none md:rounded-lg border-x-0 md:border">
      <CardHeader className="px-4 md:px-6">
        <div>
          <CardTitle className="flex items-center text-2xl font-bold text-destructive">
            <ShieldX className="mr-3 h-6 w-6" />
            Penalty & Strike Management
          </CardTitle>
          <CardDescription>
            View your penalty history and submit appeals for review.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPenalties.length > 0 ? (
                sortedPenalties.map((penalty) => (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">
                      {penalty.date?.toDate ? format(penalty.date.toDate(), "dd MMM yyyy") : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{penalty.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeClass(penalty.status))}>
                        {penalty.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {penalty.status === 'Active' ? (
                        <Dialog onOpenChange={(open) => !open && setSelectedPenaltyId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedPenaltyId(penalty.id)}>
                              Appeal
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Appeal Penalty</DialogTitle>
                              <DialogDescription>
                                Explain why this penalty should be reviewed. Please provide as much detail as possible.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                  control={form.control}
                                  name="appealComment"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" />Your Reason for Appeal</FormLabel>
                                      <FormControl>
                                        <Textarea rows={5} placeholder="e.g., The customer provided the wrong address which caused the delay..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Appeal
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    You have no penalties or warnings. Keep up the great work!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
