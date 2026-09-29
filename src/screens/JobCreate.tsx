import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import type { Job, SkillRequirement } from '@/lib/types';

interface JobCreateProps {
  onBack: () => void;
  onPublish: (job: Job) => void;
}

const skillSuggestions = [
  'Inovação Aberta',
  'Gestão de Projetos',
  'Negociação',
  'Metodologias Ágeis',
  'Liderança',
  'Design Thinking',
  'Análise de Dados',
  'Apresentações',
  'Estratégia',
  'Relacionamento',
];

const steps = [
  { id: 0, label: 'Informações', icon: Briefcase },
  { id: 1, label: 'Competências', icon: Target },
  { id: 2, label: 'Revisão', icon: Eye },
];

export function JobCreate({ onBack, onPublish }: JobCreateProps) {
  const [step, setStep] = useState(0);

  // Step 0 fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('SENAI');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [type, setType] = useState<'CLT' | 'PJ' | 'Híbrido'>('CLT');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Step 1 fields
  const [skills, setSkills] = useState<SkillRequirement[]>([]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const addSkill = (name: string) => {
    if (skills.some((s) => s.name === name)) return;
    setSkills([
      ...skills,
      { name, level: 3, candidateLevel: 0, mandatory: false },
    ]);
  };

  const updateSkill = (index: number, field: keyof SkillRequirement, value: number | boolean) => {
    setSkills((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === 0) return title.trim() && company.trim() && location.trim() && description.trim();
    if (step === 1) return skills.length > 0;
    return true;
  };

  const handlePublish = () => {
    const job: Job = {
      id: `job-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      salary: salary.trim() || 'A combinar',
      type,
      description: description.trim(),
      matchScore: 0,
      posted: ' agora',
      tags,
      status: 'Ativa',
      candidatesCount: 0,
      newCandidatesCount: 0,
      interviewCount: 0,
      skills,
    };
    onPublish(job);
  };

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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa *</Label>
                    <Input
                      id="company"
                      placeholder="Ex: SENAI"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização *</Label>
                    <Input
                      id="location"
                      placeholder="Ex: São Paulo, SP ou Remoto"
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
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de contratação</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CLT', 'PJ', 'Híbrido'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            'py-2 rounded-lg text-sm font-medium border transition-all',
                            type === t
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
                  <Label htmlFor="description">Descrição da vaga *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva as responsabilidades, objetivos e contexto da posição..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Inovação, Startups..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addTag} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => setTags(tags.filter((t) => t !== tag))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                    Adicione as skills necessárias e defina o nível exigido (1-5) e se são obrigatórias.
                    Estas competências alimentam o Match Score dos candidatos.
                  </p>

                  {/* Suggestions */}
                  <div>
                    <Label className="mb-2 block">Sugestões</Label>
                    <div className="flex flex-wrap gap-2">
                      {skillSuggestions
                        .filter((s) => !skills.some((sk) => sk.name === s))
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => addSkill(s)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                          >
                            <Plus className="h-3 w-3" />
                            {s}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Added skills */}
                  {skills.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      {skills.map((skill, i) => (
                        <div
                          key={skill.name}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{skill.name}</span>
                              <button
                                onClick={() => removeSkill(i)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Level selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Nível exigido:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => updateSkill(i, 'level', lvl)}
                                  className={cn(
                                    'w-7 h-7 rounded-lg text-xs font-bold transition-all',
                                    skill.level >= lvl
                                      ? 'bg-gradient-purple-teal text-white'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                  )}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Mandatory toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={skill.mandatory}
                              onCheckedChange={(v) => updateSkill(i, 'mandatory', v)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {skill.mandatory ? 'Obrigatória' : 'Desejável'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom skill input */}
                  <CustomSkillInput onAdd={addSkill} existing={skills.map((s) => s.name)} />
                </CardContent>
              </Card>

              {/* Match preview */}
              {skills.length > 0 && (
                <Card className="border-border bg-gradient-purple-teal-soft">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {skills.filter((s) => s.mandatory).length} obrigatória(s) e{' '}
                      {skills.filter((s) => !s.mandatory).length} desejável(eis). O Match Score será calculado
                      com base nestas competências para cada candidato.
                    </p>
                  </CardContent>
                </Card>
              )}
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
                        {company || 'Empresa'}
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
                      {type}
                    </span>
                    {salary && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Coins className="h-3.5 w-3.5" />
                        {salary}
                      </span>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description || 'Sem descrição.'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Competências exigidas ({skills.length})</h3>
                    <div className="space-y-2">
                      {skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1">{skill.name}</span>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <div
                                key={j}
                                className={cn(
                                  'h-1.5 w-4 rounded-full',
                                  j < skill.level ? 'bg-jm-purple' : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <Badge
                            variant={skill.mandatory ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {skill.mandatory ? 'Obrigatória' : 'Desejável'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
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
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={step === 0 ? onBack : () => setStep(step - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        {step < 2 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
          >
            <Check className="h-4 w-4 mr-2" />
            Publicar vaga
          </Button>
        )}
      </div>
    </div>
  );
}

function CustomSkillInput({
  onAdd,
  existing,
}: {
  onAdd: (name: string) => void;
  existing: string[];
}) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const name = value.trim();
    if (name && !existing.includes(name)) {
      onAdd(name);
      setValue('');
    }
  };

  return (
    <div className="pt-2 border-t border-border">
      <Label className="mb-2 block">Adicionar competência personalizada</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Digite o nome da skill..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="outline" onClick={handleAdd} type="button">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
