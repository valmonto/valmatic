import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomSheet } from './bottom-sheet';
import { useMobileDemoStore, type DemoPriority } from '../store';

const projects = ['Mobile App', 'Website', 'API', 'Operations', 'Design System'];

const priorities: { value: DemoPriority; label: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'low', label: 'Low', dot: 'bg-muted-foreground/50' },
];

export function NewTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const addTask = useMobileDemoStore((state) => state.addTask);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Mobile App');
  const [priority, setPriority] = useState<DemoPriority>('medium');

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Give the task a title first');
      return;
    }
    addTask({ title: trimmed, project, priority });
    setTitle('');
    setPriority('medium');
    onClose();
    toast.success('Task created', { description: `Added to ${project} — demo data only.` });
    navigate('/mobile/tasks');
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="New task"
      description="Demo only — nothing is persisted."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="demo-task-title">Title</Label>
          <Input
            id="demo-task-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
            placeholder="What needs to be done?"
          />
        </div>

        <div className="space-y-2">
          <Label>Project</Label>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setProject(name)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  project === name
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {priorities.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors',
                  priority === option.value
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <span className={cn('size-2 rounded-full', option.dot)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleCreate}>
          Create task
        </Button>
      </div>
    </BottomSheet>
  );
}
