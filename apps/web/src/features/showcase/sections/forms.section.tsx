import * as React from 'react';
import { Bold, Italic, Mail, Search, Underline } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Row, Section } from '../components/section';

export function InputsSection() {
  return (
    <Section title="Inputs" description="Text fields, textarea, and selects.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="demo-email">Email</Label>
          <Input id="demo-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-role">Role</Label>
          <NativeSelect id="demo-role" className="w-full" defaultValue="member">
            <NativeSelectOption value="owner">Owner</NativeSelectOption>
            <NativeSelectOption value="admin">Admin</NativeSelectOption>
            <NativeSelectOption value="member">Member</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-disabled">Disabled</Label>
          <Input id="demo-disabled" placeholder="Unavailable" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-invalid">Invalid</Label>
          <Input id="demo-invalid" aria-invalid defaultValue="not-an-email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="demo-msg">Message</Label>
        <Textarea id="demo-msg" placeholder="Write something…" rows={3} />
      </div>
    </Section>
  );
}

export function SelectionSection() {
  return (
    <Section title="Selection" description="Checkboxes, radios, switches.">
      <Row label="Checkboxes">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox defaultChecked /> Email me updates
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox /> Subscribe to newsletter
        </label>
        <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Checkbox disabled /> Disabled
        </label>
      </Row>
      <Separator />
      <Row label="Radio group">
        <RadioGroup defaultValue="comfortable" className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2.5 text-sm">
            <RadioGroupItem value="compact" /> Compact
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <RadioGroupItem value="comfortable" /> Comfortable
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <RadioGroupItem value="spacious" /> Spacious
          </label>
        </RadioGroup>
      </Row>
      <Separator />
      <Row label="Switches">
        <label className="flex items-center gap-2.5 text-sm">
          <Switch defaultChecked /> Notifications
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Switch /> Auto-update
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Switch size="sm" defaultChecked /> Compact
        </label>
      </Row>
    </Section>
  );
}

export function MoreInputsSection() {
  const [otp, setOtp] = React.useState('');
  return (
    <Section title="More inputs" description="Select, toggles, and one-time codes.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Fancy select</Label>
          <Select defaultValue="member">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Roles</SelectLabel>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Verification code</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>
      <Separator />
      <Row label="Toggles">
        <Toggle aria-label="Bold">
          <Bold />
        </Toggle>
        <Toggle aria-label="Italic" defaultPressed>
          <Italic />
        </Toggle>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToggleGroup type="multiple" defaultValue={['bold']} variant="outline">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline />
          </ToggleGroupItem>
        </ToggleGroup>
      </Row>
    </Section>
  );
}

export function FormCompositionSection() {
  return (
    <Section title="Form composition" description="Fields and input groups.">
      <Row label="Field (label, hint, error)">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="field-name">Display name</FieldLabel>
            <Input id="field-name" defaultValue="Valmonto" />
            <FieldDescription>This is shown across the workspace.</FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="field-email">Email</FieldLabel>
            <Input id="field-email" aria-invalid defaultValue="not-an-email" />
            <FieldError>Enter a valid email address.</FieldError>
          </Field>
        </div>
      </Row>
      <Separator />
      <Row label="Input groups (addons)">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search…" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput placeholder="you" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@valmonto.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Amount" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="sm">USD</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Row>
    </Section>
  );
}
