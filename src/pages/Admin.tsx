import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Shield,
  ArrowLeft,
  Search,
  Edit,
  Loader2,
  Crown,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithDetails {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  current_period_end: string | null;
  created_at: string;
}

const PLANS = ['free', 'wikibasic', 'wikiessentails', 'wikipro', 'wikibusiness'];
const STATUSES = ['inactive', 'active', 'trial', 'cancelled'];

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activate' | 'deactivate' | 'promote' | 'demote';
    user: UserWithDetails;
  } | null>(null);

  // Password change dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user && role !== null && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado. Apenas administradores.");
    }
  }, [user, loading, role, isAdmin, navigate]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with their roles and subscriptions
      const { data: profiles, error: profilesError } = await supabaseWiki
        .from('profiles')
        .select('user_id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabaseWiki
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: subscriptions, error: subsError } = await supabaseWiki
        .from('subscriptions')
        .select('user_id, status, plan, current_period_end');

      if (subsError) throw subsError;

      // Combine the data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const userSub = subscriptions?.find(s => s.user_id === profile.user_id);

        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role || 'user',
          subscription_status: userSub?.status || null,
          subscription_plan: userSub?.plan || null,
          current_period_end: userSub?.current_period_end || null,
          created_at: profile.created_at || '',
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const handleEditUser = (userToEdit: UserWithDetails) => {
    setEditingUser(userToEdit);
    setEditPlan(userToEdit.subscription_plan || 'free');
    setEditStatus(userToEdit.subscription_status || 'inactive');
    setEditRole(userToEdit.role);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      // Update subscription
      const { error: subError } = await supabaseWiki
        .from('subscriptions')
        .upsert({
          user_id: editingUser.user_id,
          plan: editPlan,
          status: editStatus,
          current_period_end: editStatus === 'active' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : editingUser.current_period_end,
        }, {
          onConflict: 'user_id'
        });

      if (subError) throw subError;

      // Update role if changed
      if (editRole !== editingUser.role) {
        const { error: roleError } = await supabaseWiki
          .from('user_roles')
          .upsert({
            user_id: editingUser.user_id,
            role: editRole,
          }, {
            onConflict: 'user_id'
          });

        if (roleError) throw roleError;
      }

      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordUser) return;

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-password', {
        body: {
          user_id: passwordUser.user_id,
          new_password: newPassword,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao alterar senha');
      }

      toast.success('Senha alterada com sucesso!');
      setIsPasswordDialogOpen(false);
      setPasswordUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleQuickAction = async (action: 'activate' | 'deactivate', userToUpdate: UserWithDetails) => {
    try {
      const newStatus = action === 'activate' ? 'active' : 'inactive';
      
      const { error } = await supabaseWiki
        .from('subscriptions')
        .upsert({
          user_id: userToUpdate.user_id,
          status: newStatus,
          plan: userToUpdate.subscription_plan || 'wikibasic',
          current_period_end: action === 'activate' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(action === 'activate' ? 'Plano ativado!' : 'Plano desativado!');
      setConfirmAction(null);
      loadUsers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const handleRoleChange = async (action: 'promote' | 'demote', userToUpdate: UserWithDetails) => {
    try {
      const newRole = action === 'promote' ? 'admin' : 'user';
      
      const { error } = await supabaseWiki
        .from('user_roles')
        .upsert({
          user_id: userToUpdate.user_id,
          role: newRole,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(action === 'promote' ? 'Usuário promovido a admin!' : 'Admin rebaixado a usuário!');
      setConfirmAction(null);
      loadUsers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = filterStatus === 'all' || u.subscription_status === filterStatus;
    const matchesRole = filterRole === 'all' || u.role === filterRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Trial</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    return <Badge variant="outline"><UserIcon className="w-3 h-3 mr-1" />Usuário</Badge>;
  };

  if (loading || (user && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Administração
              </h1>
              <p className="text-muted-foreground">
                Gerencie usuários, planos e permissões
              </p>
            </div>
          </div>
          <Button onClick={loadUsers} variant="outline" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button variant="outline" onClick={() => navigate("/admin/blog")}>
            <FileText className="w-4 h-4 mr-2" />Gerenciar Blog
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/treinamentos")}>
            <GraduationCap className="w-4 h-4 mr-2" />Gerenciar Treinamentos
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.subscription_status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Trial</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.subscription_status === 'trial').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status do Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <span className="capitalize">{u.subscription_plan || 'Nenhum'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(u.subscription_status)}</TableCell>
                      <TableCell>
                        {u.current_period_end 
                          ? format(new Date(u.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.subscription_status !== 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => setConfirmAction({ type: 'activate', user: u })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Ativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              onClick={() => setConfirmAction({ type: 'deactivate', user: u })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Desativar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(u)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPasswordUser(u);
                              setNewPassword('');
                              setConfirmNewPassword('');
                              setIsPasswordDialogOpen(true);
                            }}
                            title="Alterar senha"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plano</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map(plan => (
                    <SelectItem key={plan} value={plan} className="capitalize">
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status === 'active' ? 'Ativo' : 
                       status === 'inactive' ? 'Inativo' :
                       status === 'trial' ? 'Trial' : 'Cancelado'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'activate' && 'Ativar Plano'}
              {confirmAction?.type === 'deactivate' && 'Desativar Plano'}
              {confirmAction?.type === 'promote' && 'Promover a Admin'}
              {confirmAction?.type === 'demote' && 'Remover Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'activate' && 
                `Tem certeza que deseja ativar o plano de ${confirmAction.user.full_name || confirmAction.user.email}?`}
              {confirmAction?.type === 'deactivate' && 
                `Tem certeza que deseja desativar o plano de ${confirmAction.user.full_name || confirmAction.user.email}?`}
              {confirmAction?.type === 'promote' && 
                `Tem certeza que deseja promover ${confirmAction.user.full_name || confirmAction.user.email} a administrador?`}
              {confirmAction?.type === 'demote' && 
                `Tem certeza que deseja remover privilégios de admin de ${confirmAction.user.full_name || confirmAction.user.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === 'activate' || confirmAction?.type === 'deactivate') {
                  handleQuickAction(confirmAction.type, confirmAction.user);
                } else if (confirmAction?.type === 'promote' || confirmAction?.type === 'demote') {
                  handleRoleChange(confirmAction.type, confirmAction.user);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Alterar senha de {passwordUser?.full_name || passwordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmNewPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
              <p className="text-sm text-destructive">As senhas não coincidem</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
            >
              {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
