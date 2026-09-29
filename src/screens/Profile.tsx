import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Mail,
  Link as LinkIcon,
  Github,
  ExternalLink,
  Pencil,
  Thermometer,
  Plus,
  Building2,
  Briefcase,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { mockCandidate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { WorkExperience } from '@/lib/types';
import {
  useMyMatchSkills,
  useRemoveCandidateSkill,
  useSaveCandidateSkill,
  useSkillCatalog,
} from '@/features/candidates/hooks';
import { useToast } from '@/hooks/use-toast';

const seniorityLevel: Record<string, number> = {
  Junior: 25,
  Pleno: 55,
  Senior: 80,
  Especialista: 100,
};

function formatMonthYear(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function formatDuration(start: string, end: string | null): string {
  const [sy, sm] = start.split('-').map(Number);
  const startMonths = sy * 12 + sm;
  let endMonths: number;
  if (end) {
    const [ey, em] = end.split('-').map(Number);
    endMonths = ey * 12 + em;
  } else {
    endMonths = new Date().getFullYear() * 12 + (new Date().getMonth() + 1);
  }
  const total = endMonths - startMonths;
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (years > 0 && months > 0) return `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}`;
  if (years > 0) return `${years} ano${years > 1 ? 's' : ''}`;
  return `${months} ${months > 1 ? 'meses' : 'mês'}`;
}

function SkillBar({ name, level }: { name: string; level: number }) {
  const colors = ['bg-jm-red', 'bg-jm-orange', 'bg-jm-orange', 'bg-jm-teal', 'bg-jm-purple'];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 md:w-40 truncate">{name}</span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-all',
              i < level ? colors[level - 1] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">Nv {level}</span>
    </div>
  );
}

export function Profile() {
  const [experiences, setExperiences] = useState<WorkExperience[]>(mockCandidate.workExperiences);
  const [newSkillId, setNewSkillId] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('3');
  const [newSkillEvidence, setNewSkillEvidence] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [competencyInput, setCompetencyInput] = useState('');
  const [form, setForm] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    competencies: [] as string[],
  });

  const candidate = mockCandidate;
  const candidateSkillsQuery = useMyMatchSkills();
  const skillCatalogQuery = useSkillCatalog();
  const saveCandidateSkill = useSaveCandidateSkill();
  const removeCandidateSkill = useRemoveCandidateSkill();
  const { toast } = useToast();
  const candidateSkills = candidateSkillsQuery.data ?? [];
  const candidateSkillIds = new Set(candidateSkills.map((skill) => skill.skill_id));
  const availableSkills = (skillCatalogQuery.data ?? []).filter(
    (skill) => !candidateSkillIds.has(skill.id),
  );
  const initials = candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const handleSaveCandidateSkill = async (
    skillId: string,
    declaredLevel: number,
    evidencedByProject: boolean,
  ) => {
    try {
      await saveCandidateSkill.mutateAsync({
        skillId,
        declaredLevel,
        evidencedByProject,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Não foi possível salvar a competência',
        description:
          error instanceof Error
            ? error.message
            : 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleAddCandidateSkill = async () => {
    if (!newSkillId) {
      return;
    }
    const saved = await handleSaveCandidateSkill(
      newSkillId,
      Number(newSkillLevel),
      newSkillEvidence,
    );
    if (saved) {
      setNewSkillId('');
      setNewSkillLevel('3');
      setNewSkillEvidence(false);
      toast({ title: 'Competência adicionada ao perfil' });
    }
  };

  const handleRemoveCandidateSkill = async (skillId: string) => {
    try {
      await removeCandidateSkill.mutateAsync(skillId);
    } catch (error) {
      toast({
        title: 'Não foi possível remover a competência',
        description:
          error instanceof Error
            ? error.message
            : 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      competencies: [],
    });
    setCompetencyInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (exp: WorkExperience) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate ?? '',
      current: exp.current,
      description: exp.description,
      competencies: [...exp.competencies],
    });
    setCompetencyInput('');
    setDialogOpen(true);
  };

  const handleAddCompetency = () => {
    const trimmed = competencyInput.trim();
    if (trimmed && !form.competencies.includes(trimmed)) {
      setForm((prev) => ({ ...prev, competencies: [...prev.competencies, trimmed] }));
      setCompetencyInput('');
    }
  };

  const handleRemoveCompetency = (comp: string) => {
    setForm((prev) => ({ ...prev, competencies: prev.competencies.filter((c) => c !== comp) }));
  };

  const handleSave = () => {
    if (!form.company.trim() || !form.position.trim() || !form.startDate.trim()) return;

    const data: WorkExperience = {
      id: editingId ?? `we-${Date.now()}`,
      company: form.company.trim(),
      position: form.position.trim(),
      startDate: form.startDate,
      endDate: form.current ? null : form.endDate || null,
      current: form.current,
      description: form.description.trim(),
      competencies: form.competencies,
    };

    if (editingId) {
      setExperiences((prev) => prev.map((e) => (e.id === editingId ? data : e)));
    } else {
      setExperiences((prev) => [data, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  const formValid = form.company.trim() && form.position.trim() && form.startDate.trim();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
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
                  <h1 className="text-xl font-bold">{candidate.name}</h1>
                  <p className="text-sm text-muted-foreground">{candidate.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {candidate.email}
              </span>
              <Badge className="bg-primary/10 text-primary border-0">
                {candidate.seniority}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {candidate.bio}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seniority thermometer */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5 text-primary" />
            Senioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-8 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-jm-teal via-jm-purple to-jm-purple rounded-full flex items-center justify-end px-3"
              initial={{ width: 0 }}
              animate={{ width: `${seniorityLevel[candidate.seniority]}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <span className="text-xs font-bold text-white">{candidate.seniority}</span>
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Junior</span>
            <span>Pleno</span>
            <span>Senior</span>
            <span>Especialista</span>
          </div>
        </CardContent>
      </Card>

      {/* Work Experience Timeline */}
      <Card className="border-border mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Trajetória profissional ({sortedExperiences.length})
            </CardTitle>
            <Button size="sm" onClick={openAddDialog} className="bg-gradient-purple-teal text-white border-0 hover:opacity-90">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedExperiences.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Registre suas experiências profissionais para enrich seu perfil.
              </p>
              <Button size="sm" onClick={openAddDialog} variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar experiência
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedExperiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative pl-8"
                >
                  {/* Timeline line */}
                  {i < sortedExperiences.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                  )}
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    exp.current ? 'bg-jm-teal/15' : 'bg-muted'
                  )}>
                    <div className={cn('w-2.5 h-2.5 rounded-full', exp.current ? 'bg-jm-teal' : 'bg-muted-foreground/50')} />
                  </div>

                  <div className="pb-6 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{exp.position}</h4>
                          {exp.current && (
                            <Badge className="bg-jm-teal/15 text-jm-teal border-0 text-[10px]">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-primary mt-0.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {exp.company}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatMonthYear(exp.startDate)} — {exp.current ? 'Presente' : exp.endDate ? formatMonthYear(exp.endDate) : 'Presente'}
                          </span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{formatDuration(exp.startDate, exp.endDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(exp)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(exp.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {exp.description}
                      </p>
                    )}

                    {exp.competencies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {exp.competencies.map((comp) => (
                          <Badge key={comp} variant="secondary" className="text-[10px]">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Competências ({candidateSkills.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidateSkillsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando suas competências...</p>
          ) : candidateSkillsQuery.error ? (
            <p role="alert" className="text-sm text-destructive">
              {candidateSkillsQuery.error instanceof Error
                ? candidateSkillsQuery.error.message
                : 'Não foi possível carregar suas competências.'}
            </p>
          ) : candidateSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não cadastrou competências. Adicione algumas para calcular o Match Score.
            </p>
          ) : (
            <div className="space-y-4">
              {candidateSkills.map((skill) => (
                <div key={skill.skill_id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <SkillBar
                        name={skill.skill_name}
                        level={skill.declared_level}
                      />
                    </div>
                    <Select
                      value={String(skill.declared_level)}
                      onValueChange={(level) => {
                        void handleSaveCandidateSkill(
                          skill.skill_id,
                          Number(level),
                          skill.evidenced_by_project,
                        );
                      }}
                      disabled={saveCandidateSkill.isPending}
                    >
                      <SelectTrigger
                        className="w-20"
                        aria-label={`Nível de ${skill.skill_name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            Nv {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remover ${skill.skill_name}`}
                      disabled={removeCandidateSkill.isPending}
                      onClick={() => void handleRemoveCandidateSkill(skill.skill_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 pl-32 md:pl-40">
                    <Switch
                      id={`skill-evidence-${skill.skill_id}`}
                      checked={skill.evidenced_by_project}
                      disabled={saveCandidateSkill.isPending}
                      onCheckedChange={(checked) => {
                        void handleSaveCandidateSkill(
                          skill.skill_id,
                          skill.declared_level,
                          checked,
                        );
                      }}
                    />
                    <Label
                      htmlFor={`skill-evidence-${skill.skill_id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Tenho projeto que comprova esta competência
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {skillCatalogQuery.error && (
            <p role="alert" className="text-sm text-destructive">
              {skillCatalogQuery.error instanceof Error
                ? skillCatalogQuery.error.message
                : 'Não foi possível carregar o catálogo de competências.'}
            </p>
          )}

          {!candidateSkillsQuery.error && !skillCatalogQuery.error && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              {skillCatalogQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
              ) : availableSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {candidateSkills.length > 0
                    ? 'Todas as competências do catálogo já estão no seu perfil.'
                    : 'O catálogo está vazio. Cadastre competências no banco antes de usar o Match Score.'}
                </p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
                    <Select value={newSkillId} onValueChange={setNewSkillId}>
                      <SelectTrigger aria-label="Nova competência">
                        <SelectValue placeholder="Selecione uma competência" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSkills.map((skill) => (
                          <SelectItem key={skill.id} value={skill.id}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                      <SelectTrigger aria-label="Nível da nova competência">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            Nv {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="new-skill-evidence"
                        checked={newSkillEvidence}
                        onCheckedChange={setNewSkillEvidence}
                      />
                      <Label
                        htmlFor="new-skill-evidence"
                        className="text-xs text-muted-foreground"
                      >
                        Tenho projeto que comprova esta competência
                      </Label>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleAddCandidateSkill()}
                      disabled={!newSkillId || saveCandidateSkill.isPending}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Adicionar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Projetos ({candidate.projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.projects.map((project, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
            >
              <h4 className="font-semibold">{project.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              <a
                href="#"
                className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {project.link}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {candidate.links.map((link) => (
              <Button key={link.label} variant="outline" size="sm" asChild>
                <a href="#" className="flex items-center gap-2">
                  {link.label === 'GitHub' ? (
                    <Github className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Experience Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar experiência' : 'Adicionar experiência'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Ex: TechHub Brasil"
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                placeholder="Ex: Analista de Parcerias"
                value={form.position}
                onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Início</Label>
                <Input
                  id="startDate"
                  type="month"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fim</Label>
                <Input
                  id="endDate"
                  type="month"
                  value={form.endDate}
                  disabled={form.current}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="current"
                checked={form.current}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, current: checked, endDate: checked ? '' : prev.endDate }))}
              />
              <Label htmlFor="current" className="text-sm cursor-pointer">
                Trabalho aqui atualmente
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva suas responsabilidades e conquistas..."
                value={form.description}
                rows={3}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Competências desenvolvidas</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Negociação"
                  value={competencyInput}
                  onChange={(e) => setCompetencyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCompetency();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddCompetency} disabled={!competencyInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.competencies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.competencies.map((comp) => (
                    <Badge
                      key={comp}
                      variant="secondary"
                      className="text-[10px] cursor-pointer hover:bg-destructive/15 hover:text-destructive"
                      onClick={() => handleRemoveCompetency(comp)}
                    >
                      {comp}
                      <span className="ml-1 text-muted-foreground">✕</span>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Digite o nome e pressione Enter ou clique em + para adicionar. Clique numa competência para remover.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formValid}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              {editingId ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
