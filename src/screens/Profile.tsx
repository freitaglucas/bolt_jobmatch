import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Mail,
  Pencil,
  Banknote,
  Briefcase,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks';
import {
  useMyCandidateProfile,
  useSaveCandidateProfile,
} from '@/features/candidates/hooks';
import { CandidateProfileForm } from '@/features/candidates/components/CandidateProfileForm';
import type { WorkModel } from '@/features/candidates/types';
import { useToast } from '@/hooks/use-toast';

const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '?';
}

function formatSalary(value: number | null): string {
  if (value === null) {
    return 'Não informada';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function SkillBar({
  name,
  level,
  evidenced,
}: {
  name: string;
  level: number;
  evidenced: boolean;
}) {
  const colors = [
    'bg-jm-red',
    'bg-jm-orange',
    'bg-jm-orange',
    'bg-jm-teal',
    'bg-jm-purple',
  ];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-40 md:w-52 truncate">{name}</span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 flex-1 rounded-full',
              index < level ? colors[level - 1] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        Nv {level}
      </span>
      {evidenced && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-jm-teal/15 text-jm-teal">
          projeto
        </span>
      )}
    </div>
  );
}

// TODO(pos-mvp): sem tabela — a seção "Trajetória profissional" (experiências,
// projetos e links) fica OCULTA na v0.0.0 porque ainda não existem tabelas para
// esses dados. Não remover este componente: reabilitá-lo (e trocar o retorno por
// null pela UI real) quando as tabelas forem criadas.
function ProfessionalTrajectory() {
  return null;
}

export function Profile() {
  const { user } = useAuth();
  const profileQuery = useMyCandidateProfile();
  const saveMutation = useSaveCandidateProfile();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (saveMutation.isSuccess) {
      setEditOpen(false);
      toast({ title: 'Perfil atualizado' });
    }
  }, [saveMutation.isSuccess, toast]);

  if (profileQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-destructive">
        Não foi possível carregar seu perfil. Tente novamente.
      </div>
    );
  }

  const profile = profileQuery.data;
  const email = user?.email ?? '';
  const initials = getInitials(profile.fullName);

  const workModelsLabel =
    profile.acceptedWorkModels.length > 0
      ? profile.acceptedWorkModels
          .map((model) => WORK_MODEL_LABELS[model])
          .join(' · ')
      : '—';

  const contractTypesLabel =
    profile.acceptedContractTypes.length > 0
      ? profile.acceptedContractTypes.join(' · ')
      : '—';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border overflow-hidden mb-6">
          <div className="h-24 bg-gradient-purple-teal" />
          <CardContent className="p-6 -mt-12">
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border-4 border-card">
                  <AvatarFallback className="bg-gradient-purple-teal text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="pb-1">
                  <h1 className="text-xl font-bold">{profile.fullName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.currentPosition || 'Cargo não informado'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>
              {profile.seniorityGeneral && (
                <Badge className="bg-primary/10 text-primary border-0">
                  {profile.seniorityGeneral}
                </Badge>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {profile.bio}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferências */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Anos de experiência</p>
              <p className="text-sm">
                {profile.yearsOfExperience !== null
                  ? `${profile.yearsOfExperience} ano(s)`
                  : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Aceito mudar de cidade</p>
              <p className="text-sm">
                {profile.willingToRelocate ? 'Sim' : 'Não'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tipos de contrato</p>
              <p className="text-sm">{contractTypesLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Modelos de trabalho</p>
              <p className="text-sm">{workModelsLabel}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cargos desejados</p>
            {profile.desiredPositions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.desiredPositions.map((position) => (
                  <Badge key={position} variant="secondary">
                    {position}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Pretensão salarial
            </p>
            <p className="text-sm">{formatSalary(profile.salaryExpectation)}</p>
            <p className="text-xs text-muted-foreground">
              Visível apenas para você.
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Competências */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Competências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <SkillBar
                key={skill.skillId}
                name={skill.name}
                level={skill.declaredLevel}
                evidenced={skill.evidencedByProject}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma competência declarada.
            </p>
          )}
        </CardContent>
      </Card>

      <ProfessionalTrajectory />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <CandidateProfileForm
            initialValues={profile}
            isSubmitting={saveMutation.isPending}
            submitError={
              saveMutation.error instanceof Error
                ? saveMutation.error.message
                : null
            }
            onSubmit={(input) => void saveMutation.mutate(input)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

