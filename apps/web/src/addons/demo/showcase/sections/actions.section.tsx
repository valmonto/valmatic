import { ArrowRight, Bell, Check, Download, Loader2, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Row, Section } from '../components/section';

export function ButtonsSection() {
  return (
    <Section title="Buttons" description="Variants, sizes, icons, and states.">
      <Row label="Variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </Row>
      <Row label="Sizes">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add">
          <Plus />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Notifications">
          <Bell />
        </Button>
      </Row>
      <Row label="With icons & states">
        <Button>
          <Download /> Download
        </Button>
        <Button variant="outline">
          Continue <ArrowRight />
        </Button>
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
        <Button disabled>
          <Loader2 className="animate-spin" /> Loading
        </Button>
      </Row>
    </Section>
  );
}

export function BadgesSection() {
  return (
    <Section title="Badges" description="Counts, statuses, and tags.">
      <Row label="Variants">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Row>
      <Row label="Status (soft tonal)">
        <Badge variant="success">
          <Check /> Active
        </Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="info">Beta</Badge>
        <Badge variant="secondary">v1.4.0</Badge>
      </Row>
    </Section>
  );
}
