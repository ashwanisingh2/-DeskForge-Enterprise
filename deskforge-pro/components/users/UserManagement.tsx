'use client';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AnimatePresence, motion} from 'framer-motion';
import {Plus, ShieldOff, UserCog} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Select} from '@/components/ui/input';
import {TableSkeleton} from '@/components/ui/skeleton';
import {useToast} from '@/components/ui/toast';

type User = {id: string; name: string; email: string; username: string; role: string; department?: string | null; isActive: boolean; createdAt: string};

const ROLES = ['ADMIN', 'AGENT', 'END_USER'] as const;
const roleTone = (r: string) => (r === 'ADMIN' ? 'purple' : r === 'AGENT' ? 'info' : 'neutral');

export function UserManagement() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['users', 'manage']});

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const {data, isLoading} = useQuery({queryKey: ['users', 'manage'], queryFn: () => apiGet<{users: User[]}>('/api/users?scope=manage')});
  const users = data?.users ?? [];

  const deactivate = useMutation({
    mutationFn: (id: string) => apiSend(`/api/users/${id}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'User deactivated'});
    },
    onError: (err) => toast({tone: 'error', title: 'Failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Access, roles and service ownership.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add user
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-accent/50">
                  <td className="font-medium">{u.name}</td>
                  <td className="font-mono text-xs text-muted-foreground">{u.username}</td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td>
                    <Badge tone={roleTone(u.role)}>{u.role.replace('_', ' ')}</Badge>
                  </td>
                  <td className="text-muted-foreground">{u.department ?? '—'}</td>
                  <td>{u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}>
                        <UserCog className="h-4 w-4" />
                      </Button>
                      {u.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Deactivate ${u.name}`}
                          onClick={() => {
                            if (window.confirm(`Deactivate ${u.name}? They will be signed out everywhere.`)) deactivate.mutate(u.id);
                          }}
                        >
                          <ShieldOff className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <AnimatePresence>
        {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSaved={invalidate} />}
        {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={invalidate} />}
      </AnimatePresence>
    </div>
  );
}

function ModalShell({title, onClose, children}: {title: string; onClose: () => void; children: React.ReactNode}) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-label={title}
        className="w-full max-w-md rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl"
        initial={{opacity: 0, scale: 0.97, y: 8}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.97, y: 8}}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function CreateUserModal({onClose, onSaved}: {onClose: () => void; onSaved: () => void}) {
  const {toast} = useToast();
  const [form, setForm] = useState({name: '', email: '', username: '', password: '', role: 'END_USER', department: ''});

  const create = useMutation({
    mutationFn: () => apiSend('/api/users', 'POST', {...form, department: form.department || undefined}),
    onSuccess: () => {
      toast({tone: 'success', title: 'User created'});
      onSaved();
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? (err.status === 409 ? 'Email or username already exists' : err.message) : 'Error';
      toast({tone: 'error', title: 'Create failed', description: msg});
    },
  });

  const valid = form.name.length >= 2 && /.+@.+\..+/.test(form.email) && form.username.length >= 3 && form.password.length >= 8;

  return (
    <ModalShell title="Add user" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate();
        }}
      >
        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
        <Input placeholder="Username" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required />
        <Input type="password" placeholder="Temporary password (min 8)" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} aria-label="Role">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Input placeholder="Department" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={!valid}>
            Create
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({user, onClose, onSaved}: {user: User; onClose: () => void; onSaved: () => void}) {
  const {toast} = useToast();
  const [form, setForm] = useState({name: user.name, role: user.role, department: user.department ?? '', isActive: user.isActive, password: ''});

  const save = useMutation({
    mutationFn: () =>
      apiSend(`/api/users/${user.id}`, 'PATCH', {
        name: form.name,
        role: form.role,
        department: form.department || null,
        isActive: form.isActive,
        ...(form.password ? {password: form.password} : {}),
      }),
    onSuccess: () => {
      toast({tone: 'success', title: 'User updated'});
      onSaved();
      onClose();
    },
    onError: (err) => toast({tone: 'error', title: 'Update failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <ModalShell title={`Edit ${user.name}`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} aria-label="Role">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Input placeholder="Department" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} />
        </div>
        <Input type="password" placeholder="Reset password (optional, min 8)" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})} />
          Active
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Save
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
