import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodError } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ListChecks,
  Plus,
  Trash2,
  Briefcase,
  Building2,
  MapPin,
  Coins,
  Target,
  Eye,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMPLOYMENT_TYPES, MAX_JOB_REQUIREMENTS } from '@/features/jobs/create-job.schema';
import { useCreateJob } from '@/features/jobs/create-job.hooks';
import {
  DEFAULT_IMPORTANCE,
  IMPORTANCE_LABELS,
  IMPORTANCE_VALUES,
  type ImportanceValue,
} from '@/features/jobs/importance';
import {
  SENIORITY_LABELS,
  SENIORITY_VALUES,
  type SeniorityValue,
} from '@/features/jobs/seniority';
import {
  DEFAULT_JOB_ITEM_ROLE,
  JOB_ITEM_ROLES,
  JOB_ITEM_ROLE_HINTS,
  JOB_ITEM_ROLE_LABELS,
  type JobItemRole,
} from '@/features/jobs/item-roles';
import { useRecruiterOnboarding } from '@/features/recruiters/hooks';
import { useRequirementOptions, useSkillsCatalog } from '@/features/skills/hooks';
import type { RequirementOption } from '@/features/skills/api';
import {
  SKILL_GROUP_LABELS,
  filterSkills,
  skillGroup,
  type SkillGroup,
} from '@/features/skills/search';
import {
  DEFAULT_SKILL_LEVEL,
  MAX_SKILL_LEVEL,
  SKILL_LEVELS,
  skillLevelDescriptor,
  skillLevelName,
} from '@/features/skills/levels';

interface JobCreateProps {
  onBack: () => void;
  onPublished: (title: string) => void;
}

interface SelectedSkill {
  skillId: string;
  name: string;
  category: string;
  kind?: string;
  requiredLevel: number;
  role: JobItemRole;
  importance: ImportanceValue;
}

interface SelectedRequirement {
  skillId: string;
  name: string;
  question: string;
  detail: string;
  eliminatory: boolean;
}

const MAX_SKILLS = 15;
const MAX_SUGGESTIONS = 20;

const steps = [
  { id: 0, label: 'Informações', icon: Briefcase },
  { id: 1, label: 'Competências', icon: Target },
  { id: 2, label: 'Revisão', icon: Eye },
];

function groupLabel(skill: { category: string; kind?: string }): string {
  return SKILL_GROUP_LABELS[skillGroup({ id: '', name: '', ...skill })];
}

function roleBadgeVariant(role: JobItemRole): 'destructive' | 'secondary' | 'outline' {
  if (role === 'required') return 'destructive';
  return role === 'implicit' ? 'outline' : 'secondary';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? 'Revise os dados da vaga.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Não foi possível publicar a vaga. Tente novamente.';
}

export function JobCreate({ onBack, onPublished }: JobCreateProps) {
  const [step, setStep] = useState(0);

  // Step 0 fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentType, setEmploymentType] = useState<(typeof EMPLOYMENT_TYPES)[number]>('CLT');
  const [seniority, setSeniority] = useState<SeniorityValue | null>(null);
  const [description, setDescription] = useState('');
  // TODO(pos-mvp): tags da vaga (campo escondido no MVP, ainda não existe coluna no banco).

  // Step 1 fields
  const [selected, setSelected] = useState<SelectedSkill[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SkillGroup | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [requirements, setRequirements] = useState<SelectedRequirement[]>([]);

  const onboarding = useRecruiterOnboarding();
  const companyName = onboarding.data?.companyName ?? null;

  const catalog = useSkillsCatalog();
  const requirementOptions = useRequirementOptions();
  const createJobMutation = useCreateJob();

  const suggestions = useMemo(
    () =>
      filterSkills(
        catalog.data ?? [],
        search,
        selected.map((skill) => skill.skillId),
        showAllSkills ? Number.MAX_SAFE_INTEGER : MAX_SUGGESTIONS,
        categoryFilter,
      ),
    [catalog.data, search, selected, showAllSkills, categoryFilter],
  );

  const addSkill = (skill: { id: string; name: string; category: string; kind?: string }) => {
    if (selected.length >= MAX_SKILLS) return;
    if (selected.some((item) => item.skillId === skill.id)) return;
    setSelected((previous) => [
      ...previous,
      {
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        kind: skill.kind,
        requiredLevel: DEFAULT_SKILL_LEVEL,
        role: DEFAULT_JOB_ITEM_ROLE,
        importance: DEFAULT_IMPORTANCE,
      },
    ]);
  };

  const updateSkill = (
    skillId: string,
    changes: Partial<Pick<SelectedSkill, 'requiredLevel' | 'role' | 'importance'>>,
  ) => {
    setSelected((previous) =>
      previous.map((item) => (item.skillId === skillId ? { ...item, ...changes } : item)),
    );
  };

  const removeSkill = (skillId: string) => {
    setSelected((previous) => previous.filter((item) => item.skillId !== skillId));
  };

  const addRequirement = (option: RequirementOption) => {
    if (requirements.length >= MAX_JOB_REQUIREMENTS) return;
    if (requirements.some((item) => item.skillId === option.id)) return;
    setRequirements((previous) => [
      ...previous,
      { skillId: option.id, name: option.name, question: option.question, detail: '', eliminatory: false },
    ]);
  };

  const updateRequirement = (
    skillId: string,
    changes: Partial<Pick<SelectedRequirement, 'detail' | 'eliminatory'>>,
  ) => {
    setRequirements((previous) =>
      previous.map((item) => (item.skillId === skillId ? { ...item, ...changes } : item)),
    );
  };

  const removeRequirement = (skillId: string) => {
    setRequirements((previous) => previous.filter((item) => item.skillId !== skillId));
  };

  const availableRequirements = (requirementOptions.data ?? []).filter(
    (option) => !requirements.some((item) => item.skillId === option.id),
  );

  const canProceed = () => {
    if (step === 0) {
      return (
        title.trim().length >= 3 &&
        location.trim().length >= 2 &&
        description.trim().length >= 20
      );
    }
    if (step === 1) return selected.length >= 1 && selected.length <= MAX_SKILLS;
    return true;
  };

  const handlePublish = async () => {
    try {
      await createJobMutation.mutateAsync({
        title,
        location,
        description,
        salaryRange: salary,
        employmentType,
        seniority: seniority ?? undefined,
        skills: selected.map(({ skillId, requiredLevel, role, importance }) => ({
          skillId,
          requiredLevel,
          role,
          importance,
        })),
        requirements: requirements.map(({ skillId, detail, eliminatory }) => ({
          skillId,
          detail,
          eliminatory,
        })),
      });
      onPublished(title.trim());
    } catch {
      // O erro fica em createJobMutation.error e aparece na tela de revisão.
    }
  };

  const publishError = createJobMutation.error
    ? getErrorMessage(createJobMutation.error)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para vagas
      </button>

      <h1 className="text-2xl font-bold mb-2">Nova vaga</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Cadastre uma posição e defina as competências exigidas para o match
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  step === i
                    ? 'bg-gradient-purple-teal text-white'
                    : step > i
                      ? 'bg-jm-teal/15 text-jm-teal'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step > i ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:inline',
                  step >= i ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-3 rounded-full transition-all',
                  step > i ? 'bg-jm-teal/40' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* STEP 0: Job info */}
          {step === 0 && (
            <Card className="border-border">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da vaga *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Analista de Inovação Aberta"
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={companyName ?? (onboarding.isLoading ? 'Carregando...' : 'Não informada')}
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      Vem do cadastro da sua empresa.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização *</Label>
                    <Input
                      id="location"
                      placeholder="Ex: São Paulo, SP ou Remoto"
                      maxLength={120}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Faixa salarial</Label>
                    <Input
                      id="salary"
                      placeholder="Ex: R$ 6.000 - 9.000"
                      maxLength={60}
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de contratação</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {EMPLOYMENT_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEmploymentType(t)}
                          className={cn(
                            'py-2 rounded-lg text-sm font-medium border transition-all',
                            employmentType === t
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Senioridade (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SENIORITY_VALUES.map((level) => (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={seniority === level}
                        onClick={() => setSeniority(seniority === level ? null : level)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                          seniority === level
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        )}
                      >
                        {SENIORITY_LABELS[level]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique de novo para desmarcar. Ajuda o candidato a filtrar as vagas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição da vaga *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva as responsabilidades, objetivos e contexto da posição..."
                    rows={5}
                    maxLength={5000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 20 caracteres ({description.trim().length}/5000).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 1: Skills */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Competências exigidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha competências e ferramentas do catálogo, defina o nível exigido, a importância
                    e o papel de cada uma na vaga. Elas alimentam o Match Score dos candidatos. Máximo de {MAX_SKILLS}.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Importância define o peso do item na média do score (Alta 1,0 · Média 0,75 ·
                    Baixa 0,5). Obrigatório corta o score pela metade se o candidato não tiver o item;
                    desejável e implícito contam a favor.
                  </p>

                  {/* Catalog search */}
                  <div className="space-y-2">
                    <Label htmlFor="skill-search">Buscar no catálogo</Label>
                    <Input
                      id="skill-search"
                      placeholder="Ex: Comunicação, SQL, Liderança..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    {catalog.isLoading && (
                      <p className="text-sm text-muted-foreground">Carregando competências...</p>
                    )}

                    {catalog.isError && (
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-destructive">
                          Não foi possível carregar o catálogo de competências.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            void catalog.refetch();
                          }}
                        >
                          Tentar de novo
                        </Button>
                      </div>
                    )}

                    {catalog.data && (
                      <>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {([
                            { value: null, label: 'Todas' },
                            { value: 'hard', label: 'Técnicas' },
                            { value: 'soft', label: 'Comportamentais' },
                            { value: 'tool', label: 'Ferramentas' },
                          ] as const).map((option) => (
                            <button
                              key={option.label}
                              type="button"
                              aria-pressed={categoryFilter === option.value}
                              onClick={() => setCategoryFilter(option.value)}
                              className={cn(
                                'px-3 py-1 rounded-full border text-xs transition-all',
                                categoryFilter === option.value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/30',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div
                          className={cn(
                            'flex flex-wrap gap-2 pt-1',
                            showAllSkills && 'max-h-72 overflow-y-auto pr-1',
                          )}
                        >
                          {suggestions.items.map((skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              disabled={selected.length >= MAX_SKILLS}
                              onClick={() => addSkill(skill)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-3 w-3" />
                              {skill.name}
                              <span className="text-[10px] opacity-70">
                                · {groupLabel(skill)}
                              </span>
                            </button>
                          ))}
                        </div>
                        {suggestions.total === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma competência encontrada para essa busca.
                          </p>
                        )}
                        {!showAllSkills && suggestions.total > suggestions.items.length && (
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                              Mostrando {suggestions.items.length} de {suggestions.total}. Digite para refinar.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => setShowAllSkills(true)}
                            >
                              Ver lista completa ({suggestions.total})
                            </Button>
                          </div>
                        )}
                        {showAllSkills && (
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                              Mostrando todas as {suggestions.total} competências.
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setShowAllSkills(false)}
                            >
                              Mostrar menos
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Added skills */}
                  {selected.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <p className="text-xs text-muted-foreground">
                        {selected.length}/{MAX_SKILLS} competências escolhidas
                      </p>
                      {selected.map((skill) => (
                        <div
                          key={skill.skillId}
                          className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-3 rounded-xl border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{skill.name}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {groupLabel(skill)}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill.skillId)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={`Remover ${skill.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Level selector */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground shrink-0">Nível exigido:</span>
                              <div className="flex flex-wrap gap-1">
                                {SKILL_LEVELS.map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    aria-pressed={skill.requiredLevel === lvl}
                                    onClick={() => updateSkill(skill.skillId, { requiredLevel: lvl })}
                                    className={cn(
                                      'h-7 px-2.5 rounded-lg text-xs font-semibold transition-all',
                                      skill.requiredLevel === lvl
                                        ? 'bg-gradient-purple-teal text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                    )}
                                  >
                                    {skillLevelName(lvl)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {skillLevelDescriptor(skill.requiredLevel)}
                            </p>
                          </div>

                          {/* Importance selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Importância:</span>
                            <div className="flex gap-1">
                              {IMPORTANCE_VALUES.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  aria-pressed={skill.importance === value}
                                  onClick={() => updateSkill(skill.skillId, { importance: value })}
                                  className={cn(
                                    'px-2.5 h-7 rounded-lg text-xs font-medium transition-all',
                                    skill.importance === value
                                      ? 'bg-gradient-purple-teal text-white'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                  )}
                                >
                                  {IMPORTANCE_LABELS[value]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Role selector */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground shrink-0">Papel na vaga:</span>
                              <div className="flex flex-wrap gap-1">
                                {JOB_ITEM_ROLES.map((role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    aria-pressed={skill.role === role}
                                    onClick={() => updateSkill(skill.skillId, { role })}
                                    className={cn(
                                      'h-7 px-2.5 rounded-lg text-xs font-medium transition-all',
                                      skill.role === role
                                        ? 'bg-gradient-purple-teal text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                    )}
                                  >
                                    {JOB_ITEM_ROLE_LABELS[role]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {JOB_ITEM_ROLE_HINTS[skill.role]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Match preview */}
              {selected.length > 0 && (
                <Card className="border-border bg-gradient-purple-teal-soft">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {selected.filter((s) => s.role === 'required').length} obrigatório(s),{' '}
                      {selected.filter((s) => s.role === 'preferred').length} desejável(eis) e{' '}
                      {selected.filter((s) => s.role === 'implicit').length} implícito(s). O Match Score será
                      calculado com base nestes itens para cada candidato.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Requirements (sim/nao) */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Requisitos sim/não
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Perguntas que o candidato responde ao se candidatar, fora do Match Score. Opcional.
                    Máximo de {MAX_JOB_REQUIREMENTS}.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Excludente: quem responder não tem a candidatura recusada na hora e recebe o
                    retorno com o motivo. Sem marcar, a resposta só aparece para você no Pipeline.
                  </p>

                  {requirementOptions.isLoading && (
                    <p className="text-sm text-muted-foreground">Carregando requisitos...</p>
                  )}
                  {requirementOptions.isError && (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-destructive">Não foi possível carregar os requisitos.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          void requirementOptions.refetch();
                        }}
                      >
                        Tentar de novo
                      </Button>
                    </div>
                  )}
                  {availableRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {availableRequirements.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={requirements.length >= MAX_JOB_REQUIREMENTS}
                          onClick={() => addRequirement(option)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                          {option.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {requirements.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      {requirements.map((requirement) => (
                        <div
                          key={requirement.skillId}
                          className="space-y-3 p-3 rounded-xl border border-border"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{requirement.name}</p>
                              <p className="text-xs text-muted-foreground">{requirement.question}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRequirement(requirement.skillId)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Remover ${requirement.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`requirement-detail-${requirement.skillId}`} className="text-xs">
                              Detalhe (opcional)
                            </Label>
                            <Input
                              id={`requirement-detail-${requirement.skillId}`}
                              maxLength={200}
                              placeholder="Ex.: presencial na Vila Olímpia, São Paulo"
                              value={requirement.detail}
                              onChange={(e) =>
                                updateRequirement(requirement.skillId, { detail: e.target.value })
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`requirement-eliminatory-${requirement.skillId}`}
                              checked={requirement.eliminatory}
                              onCheckedChange={(value) =>
                                updateRequirement(requirement.skillId, { eliminatory: value })
                              }
                            />
                            <Label
                              htmlFor={`requirement-eliminatory-${requirement.skillId}`}
                              className="text-xs text-muted-foreground"
                            >
                              {requirement.eliminatory ? 'Excludente' : 'Não excludente'}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Preview as candidates see it */}
              <Card className="border-border overflow-hidden">
                <div className="bg-gradient-purple-teal-soft px-6 pt-6 pb-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">{title || 'Título da vaga'}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {companyName ?? 'Empresa'}
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">--</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    {location && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      {employmentType}
                    </span>
                    {salary.trim() && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Coins className="h-3.5 w-3.5" />
                        {salary}
                      </span>
                    )}
                    {seniority && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Award className="h-3.5 w-3.5" />
                        {SENIORITY_LABELS[seniority]}
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {description || 'Sem descrição.'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Competências exigidas ({selected.length})</h3>
                    <div className="space-y-2">
                      {selected.map((skill) => (
                        <div key={skill.skillId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1">{skill.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            Importância {IMPORTANCE_LABELS[skill.importance]}
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: MAX_SKILL_LEVEL }).map((_, j) => (
                              <div
                                key={j}
                                className={cn(
                                  'h-1.5 w-4 rounded-full',
                                  j < skill.requiredLevel ? 'bg-jm-purple' : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <Badge variant={roleBadgeVariant(skill.role)} className="text-[10px]">
                            {JOB_ITEM_ROLE_LABELS[skill.role]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {requirements.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-3">
                          Requisitos sim/não ({requirements.length})
                        </h3>
                        <div className="space-y-2">
                          {requirements.map((requirement) => (
                            <div
                              key={requirement.skillId}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                            >
                              <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1">
                                {requirement.name}
                                {requirement.detail.trim() && (
                                  <span className="text-muted-foreground"> · {requirement.detail.trim()}</span>
                                )}
                              </span>
                              {requirement.eliminatory && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Excludente
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-purple-teal-soft">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Ao publicar, esta vaga ficará visível para candidatos no swipe. O Match Score será
                    calculado automaticamente para cada perfil.
                  </p>
                </CardContent>
              </Card>

              {publishError && (
                <p role="alert" className="text-sm text-destructive">
                  {publishError}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          type="button"
          disabled={createJobMutation.isPending}
          onClick={step === 0 ? onBack : () => setStep(step - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        {step < 2 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              void handlePublish();
            }}
            disabled={createJobMutation.isPending}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            <Check className="h-4 w-4 mr-2" />
            {createJobMutation.isPending ? 'Publicando...' : 'Publicar vaga'}
          </Button>
        )}
      </div>
    </div>
  );
}
