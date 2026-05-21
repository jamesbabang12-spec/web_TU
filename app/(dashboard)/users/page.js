'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCrud } from '@/lib/hooks/use-crud'
import { useAuthStore } from '@/lib/store/auth-store'
import { ROLES, ROLE_LABELS, ROLE_BADGE_COLOR } from '@/lib/auth/roles'
import { TableSkeleton, EmptyState } from '@/components/table-helpers'
import { KELAS_LIST } from '@/lib/mock-data'
import { Plus, Search, Edit, Trash2, MoreHorizontal, ShieldCheck, KeyRound, Loader2, Eye, EyeOff, UserCog as UserCogIcon, Mail as MailIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const baseSchema = {
  email: z.string().email('Email tidak valid'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  role: z.string().min(1, 'Role wajib dipilih'),
  kelas: z.string().optional().or(z.literal('')),
}

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

const editSchema = z.object({
  ...baseSchema,
  password: z.string().optional().refine(v => !v || v.length >= 6, { message: 'Password minimal 6 karakter (kosongkan jika tidak diubah)' }),
})

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const { data, loading, create, update, remove } = useCrud('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(editing ? editSchema : createSchema),
    defaultValues: { email: '', name: '', role: '', kelas: '', password: '' },
  })

  const watchRole = watch('role')

  const filtered = data.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openCreate = () => {
    setEditing(null)
    reset({ email: '', name: '', role: '', kelas: '', password: '' })
    setShowPassword(false)
    setOpen(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    reset({ email: u.email, name: u.name, role: u.role, kelas: u.kelas || '', password: '' })
    setShowPassword(false)
    setOpen(true)
  }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = { ...values }
      if (payload.role !== 'wali_kelas') payload.kelas = null
      if (editing) {
        if (!payload.password) delete payload.password
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  const stats = {
    total: data.length,
    admin: data.filter(u => u.role === 'admin').length,
    tu: data.filter(u => u.role === 'tu').length,
    wali: data.filter(u => u.role === 'wali_kelas').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Manajemen User Login
          </h1>
          <p className="text-sm text-muted-foreground">Kelola akun pengguna sistem (Admin / Tata Usaha / Wali Kelas)</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Tambah User</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Total User</p><p className="text-2xl font-bold">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', ROLE_BADGE_COLOR.admin)}><ShieldCheck className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Administrator</p><p className="text-2xl font-bold">{stats.admin}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', ROLE_BADGE_COLOR.tu)}><UserCogIcon className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Tata Usaha</p><p className="text-2xl font-bold">{stats.tu}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', ROLE_BADGE_COLOR.wali_kelas)}><UserCogIcon className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Wali Kelas</p><p className="text-2xl font-bold">{stats.wali}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="tu">Tata Usaha</SelectItem>
                <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? <TableSkeleton cols={6} /> : filtered.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Belum ada user" description="Tambah user pertama untuk memulai" action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Tambah User</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const initials = (u.name || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
                  const isSelf = u.id === currentUser?.id
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm flex items-center gap-2">
                              {u.name}
                              {isSelf && <Badge variant="outline" className="text-[10px] py-0 h-4">Anda</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">ID: {u.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm flex items-center gap-1.5"><MailIcon className="h-3 w-3 text-muted-foreground" /> {u.email}</span></TableCell>
                      <TableCell><Badge className={cn('font-medium', ROLE_BADGE_COLOR[u.role])}>{ROLE_LABELS[u.role] || u.role}</Badge></TableCell>
                      <TableCell className="text-sm">{u.kelas || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}><Edit className="h-4 w-4 mr-2" /> Edit User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(u)}><KeyRound className="h-4 w-4 mr-2 text-amber-600" /> Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={isSelf} onClick={() => !isSelf && setDeleteUser(u)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Hapus User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Perbarui informasi user. Kosongkan password jika tidak ingin mengubahnya.' : 'Buat akun login baru untuk pengguna sistem.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input {...register('name')} placeholder="Budi Pratama" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} placeholder="user@sekolahku.id" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? 'Password Baru ' : 'Password '}<span className="text-muted-foreground font-normal">{editing && '(kosongkan jika tidak diubah)'}</span></Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder={editing ? '••••••••' : 'Min. 6 karakter'} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role / Hak Akses</Label>
              <Select value={watch('role')} onValueChange={(v) => setValue('role', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator <span className="text-xs text-muted-foreground ml-2">(full access)</span></SelectItem>
                  <SelectItem value="tu">Tata Usaha <span className="text-xs text-muted-foreground ml-2">(operasional)</span></SelectItem>
                  <SelectItem value="wali_kelas">Wali Kelas <span className="text-xs text-muted-foreground ml-2">(per kelas)</span></SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            {watchRole === 'wali_kelas' && (
              <div className="space-y-1.5">
                <Label>Kelas yang Diampu</Label>
                <Select value={watch('kelas')} onValueChange={(v) => setValue('kelas', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{KELAS_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Wali kelas hanya bisa akses data siswa di kelas yang diampu.</p>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Simpan Perubahan' : 'Buat User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user "{deleteUser?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              User akan kehilangan akses ke sistem secara permanen. Email <strong>{deleteUser?.email}</strong> bisa dipakai lagi setelahnya untuk akun baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await remove(deleteUser.id); setDeleteUser(null) }} className="bg-destructive hover:bg-destructive/90">Hapus User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
