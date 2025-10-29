
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, MessageSquarePlus, PlusCircle, Trash2 } from "lucide-react";
import type { Profile } from "@/types";
import { arrayUnion, arrayRemove } from "firebase/firestore";

interface ManageQuickRepliesProps {
  profile: Profile;
  onUpdate: (data: Record<string, any>) => Promise<void>;
}

const formSchema = z.object({
  newReply: z.string().min(3, "Reply must be at least 3 characters.").max(100, "Reply cannot exceed 100 characters."),
});

export function ManageQuickReplies({ profile, onUpdate }: ManageQuickRepliesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newReply: "" },
  });

  async function handleAddReply(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    await onUpdate({
      customQuickReplies: arrayUnion(values.newReply),
    });
    form.reset();
    setIsSaving(false);
  }

  async function handleDeleteReply(replyToDelete: string) {
    await onUpdate({
      customQuickReplies: arrayRemove(replyToDelete),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary cursor-pointer">
          <div className="flex items-center gap-3">
            <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Manage Quick Replies</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Quick Replies</DialogTitle>
          <DialogDescription>
            Create, view, and delete your personalized chat replies for faster communication.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {profile.customQuickReplies && profile.customQuickReplies.length > 0 ? (
            profile.customQuickReplies.map((reply, index) => (
              <div key={index} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md">
                <p className="text-sm flex-grow">{reply}</p>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteReply(reply)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">You have no custom replies.</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddReply)} className="space-y-4">
            <FormField
              control={form.control}
              name="newReply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">New Quick Reply</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="Add a new reply..." {...field} />
                      <Button type="submit" disabled={isSaving} size="icon">
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
