import { CalendarDays, CreditCard, Inbox, Smile, User } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Row, Section } from '../components/section';

const frameworks = ['Next.js', 'Remix', 'Astro', 'Vite', 'Nuxt', 'SvelteKit'];

export function TabsSection() {
  return (
    <Section title="Tabs" description="Segmented and underline navigation.">
      <Row label="Segmented">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 text-sm text-muted-foreground">
            A summary of everything happening across your workspace.
          </TabsContent>
          <TabsContent value="activity" className="mt-4 text-sm text-muted-foreground">
            The latest events, ordered most-recent first.
          </TabsContent>
          <TabsContent value="settings" className="mt-4 text-sm text-muted-foreground">
            Tune preferences for this workspace.
          </TabsContent>
        </Tabs>
      </Row>
      <Separator />
      <Row label="Underline (line)">
        <Tabs defaultValue="account" className="w-full">
          <TabsList variant="line">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-4 text-sm text-muted-foreground">
            Manage your account details and profile.
          </TabsContent>
          <TabsContent value="password" className="mt-4 text-sm text-muted-foreground">
            Change your password and security settings.
          </TabsContent>
          <TabsContent value="team" className="mt-4 text-sm text-muted-foreground">
            Invite teammates and manage roles.
          </TabsContent>
        </Tabs>
      </Row>
    </Section>
  );
}

export function DataDisplaySection() {
  return (
    <Section title="Data display" description="Accordions, empty states, pagination.">
      <Row label="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="a">
            <AccordionTrigger>What is this gallery?</AccordionTrigger>
            <AccordionContent>
              A living reference of every design-system primitive, rendered with the real
              components.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I use these directly?</AccordionTrigger>
            <AccordionContent>
              Yes — import them from <code>@/components/ui</code> and they’ll match this styling.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Row>
      <Separator />
      <Row label="Empty state">
        <Empty className="w-full rounded-lg border border-dashed border-border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="size-5" />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>When you receive messages, they’ll show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Row>
      <Separator />
      <Row label="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Row>
    </Section>
  );
}

export function SearchCommandSection() {
  return (
    <Section title="Search & command" description="Comboboxes and the ⌘K palette.">
      <Row label="Combobox (searchable)">
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Search framework…" className="w-full sm:w-72" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Row>
      <Separator />
      <Row label="Command palette (inline)">
        <Command className="w-full rounded-lg border border-border/60 shadow-sm">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <CalendarDays /> Calendar
              </CommandItem>
              <CommandItem>
                <Smile /> Search emoji
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User /> Profile
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard /> Billing
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Row>
    </Section>
  );
}

export function CarouselSection() {
  return (
    <Section title="Carousel" description="Swipe or use the arrows.">
      <Row label="Carousel">
        <div className="w-full px-10">
          <Carousel className="w-full">
            <CarouselContent>
              {Array.from({ length: 5 }, (_, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center py-0">
                      <span className="text-3xl font-semibold text-muted-foreground/60">
                        {i + 1}
                      </span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </Row>
    </Section>
  );
}
