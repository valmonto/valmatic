import * as React from 'react';
import { Copy, LogOut, MoreHorizontal, PanelRight, Pencil, Settings, Trash2, User } from 'lucide-react';

import { CompactModal, WideModal } from '@/components/overlays';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Row, Section } from '../components/section';

export function OverlaysSection() {
  const [notifications, setNotifications] = React.useState(true);
  return (
    <Section
      title="Overlays"
      description="Dialogs, sheets, menus, and hovers — all dismiss-on-outside."
    >
      <Row label="Dialogs & sheets">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename workspace</DialogTitle>
              <DialogDescription>
                This name is visible to everyone in the workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input id="ws-name" defaultValue="Valmonto" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                This action can’t be undone. All associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <PanelRight /> Open sheet
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>Update your details, then save.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-name">Name</Label>
                <Input id="sheet-name" defaultValue="Initial Owner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-email">Email</Label>
                <Input id="sheet-email" type="email" defaultValue="owner@valmonto.com" />
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Save</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Row>

      <Separator />

      <Row label="Composed modals">
        <CompactModal
          trigger={<Button variant="outline">Compact modal</Button>}
          title="Rename workspace"
          description="This name is visible to everyone in the workspace."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save changes</Button>
              </DialogClose>
            </>
          }
        >
          <div className="space-y-2 py-2">
            <Label htmlFor="compact-name">Workspace name</Label>
            <Input id="compact-name" defaultValue="Valmonto" />
          </div>
        </CompactModal>

        <WideModal
          trigger={<Button variant="outline">Wide modal</Button>}
          title="Edit project details"
          description="A larger surface for multi-column forms and richer content."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save project</Button>
              </DialogClose>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wide-name">Project name</Label>
              <Input id="wide-name" defaultValue="Atlas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wide-key">Project key</Label>
              <Input id="wide-key" defaultValue="ATL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wide-owner">Owner</Label>
              <Input id="wide-owner" defaultValue="Initial Owner" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wide-email">Contact email</Label>
              <Input id="wide-email" type="email" defaultValue="owner@valmonto.com" />
            </div>
          </div>
        </WideModal>
      </Row>

      <Separator />

      <Row label="Menus & popovers">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem>
              <User /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings /> Settings
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked={notifications} onCheckedChange={setNotifications}>
              Notifications
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PopoverHeader>
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>Set the width and height in pixels.</PopoverDescription>
            </PopoverHeader>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pop-w">Width</Label>
                <Input id="pop-w" defaultValue="320" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pop-h">Height</Label>
                <Input id="pop-h" defaultValue="240" />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@valmonto</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="flex gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  VM
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Valmonto</p>
                <p className="text-sm text-muted-foreground">
                  The workspace powering this gallery. Hover cards are great for quick context.
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Row>

      <Separator />

      <Row label="Context menu (right-click)">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Right-click anywhere in this area
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem>
              <Pencil /> Edit
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy /> Duplicate
              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Trash2 /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Row>
    </Section>
  );
}
