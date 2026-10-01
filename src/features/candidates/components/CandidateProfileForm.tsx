import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSkillCatalog } from '../hooks';
import {
  CandidateIdentitySchema,
  SaveCandidateProfileSchema,
} from '../schemas';
import type {
  CandidateProfile,
  ContractType,
  SaveCandidateProfileInput,
  SeniorityOption,
  WorkModel,
} from '../types';

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  'Híbrido': 'Híbrido',
};

const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

const CONTRACT_TYPES: ContractType[] = ['CLT', 'PJ', 'Híbrido'];
const WORK_MODELS: WorkModel[] = ['presencial', 'hibrido', 'remoto'];
const SENIORITY_OPTIONS: SeniorityOption[] = [
  'Junior',
  'Pleno',
  'Senior',
  'Especialista',
];

interface CandidateProfileFormProps {
  initialValues?: CandidateProfile;
  isSubmitting: boolean;
  submitError?: string | null;
  onSubmit: (input: SaveCandidateProfileInput) => void;
}

interface SelectedSkill {
  skillId: string;
  name: string;
  category: 'hard' | 'soft';
  declaredLevel: number;
  evidencedByProject: boolean;
}

export function CandidateProfileForm({
  initialValues,
  isSubmitting,
  submitError,
  onSubmit,
}: CandidateProfileFormProps) {
  const catalogQuery = useSkillCatalog();
  const [step, setStep] = useState(1);
  const [localError, setLocalError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialValues?.fullName ?? '');
  const [currentPosition, setCurrentPosition] = useState(
    initialValues?.currentPosition ?? '',
  );
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [bio, setBio] = useState(initialValues?.bio ?? '');

  const [skills, setSkills] = useState<SelectedSkill[]>(
    (initialValues?.skills ?? []).map((skill) => ({ ...skill })),
  );
  const [pendingSkillId, setPendingSkillId] = useState('');
  const [pendingLevel, setPendingLevel] = useState('3');
  const [pendingEvidence, setPendingEvidence] = useState(false);

  const [desiredPositions, setDesiredPositions] = useState<string[]>(
    initialValues?.desiredPositions ?? [],
  );
  const [positionInput, setPositionInput] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialValues?.yearsOfExperience?.toString() ?? '',
  );
  const [seniorityGeneral, setSeniorityGeneral] = useState<SeniorityOption>(
    initialValues?.seniorityGeneral ?? 'Pleno',
  );
  const [acceptedContractTypes, setAcceptedContractTypes] = useState<
    ContractType[]
  >(initialValues?.acceptedContractTypes ?? []);
  const [acceptedWorkModels, setAcceptedWorkModels] = useState<WorkModel[]>(
    initialValues?.acceptedWorkModels ?? [],
  );
  const [willingToRelocate, setWillingToRelocate] = useState(
    initialValues?.willingToRelocate ?? false,
  );
  const [salaryExpectation, setSalaryExpectation] = useState(
    initialValues?.salaryExpectation?.toString() ?? '',
  );

  const availableSkills = (catalogQuery.data ?? []).filter(
    (skill) => !skills.some((selected) => selected.skillId === skill.id),
  );

  const hardSkills = skills.filter((skill) => skill.category === 'hard');
  const softSkills = skills.filter((skill) => skill.category === 'soft');

  const step1Valid = CandidateIdentitySchema.safeParse({
    fullName,
    currentPosition,
    location,
    phone,
    bio,
  }).success;

  const step2Valid = skills.length >= 3;

  const buildInput = (): SaveCandidateProfileInput => ({
    fullName,
    currentPosition,
    location,
    phone,
    bio,
    desiredPositions,
    yearsOfExperience:
      yearsOfExperience.trim() === '' ? null : Number(yearsOfExperience),
    seniorityGeneral,
    acceptedContractTypes,
    acceptedWorkModels,
    willingToRelocate,
    salaryExpectation:
      salaryExpectation.trim() === '' ? null : Number(salaryExpectation),
    skills: skills.map(({ skillId, declaredLevel, evidencedByProject }) => ({
      skillId,
      declaredLevel,
      evidencedByProject,
    })),
  });

  const goNext = () => {
    setLocalError(null);
    if (step === 1) {
      const parsed = CandidateIdentitySchema.safeParse({
        fullName,
        currentPosition,
        location,
        phone,
        bio,
      });
      if (!parsed.success) {
        setLocalError(parsed.error.issues[0]?.message ?? 'Revise os dados.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!step2Valid) {
        setLocalError('Selecione pelo menos 3 competências.');
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => {
    setLocalError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSubmit = () => {
    setLocalError(null);
    const parsed = SaveCandidateProfileSchema.safeParse(buildInput());
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Revise os dados.');
      return;
    }
    onSubmit(parsed.data);
  };

  const addSkill = () => {
    const skill = (catalogQuery.data ?? []).find(
      (entry) => entry.id === pendingSkillId,
    );
    if (!skill) {
      return;
    }
    setSkills((previous) => [
      ...previous,
      {
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        declaredLevel: Number(pendingLevel),
        evidencedByProject: pendingEvidence,
      },
    ]);
    setPendingSkillId('');
    setPendingLevel('3');
    setPendingEvidence(false);
  };

  const removeSkill = (skillId: string) => {
    setSkills((previous) =>
      previous.filter((skill) => skill.skillId !== skillId),
    );
  };

  const toggleContractType = (value: ContractType) => {
    setAcceptedContractTypes((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  };

  const toggleWorkModel = (value: WorkModel) => {
    setAcceptedWorkModels((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  };

  const addPosition = () => {
    const trimmed = positionInput.trim();
    if (trimmed && !desiredPositions.includes(trimmed)) {
      setDesiredPositions((previous) => [...previous, trimmed]);
    }
    setPositionInput('');
  };

  const removePosition = (position: string) => {
    setDesiredPositions((previous) =>
      previous.filter((item) => item !== position),
    );
  };

  const errorMessage = localError ?? submitError ?? null;

  return (
    <Card className="border-border w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">
          {initialValues ? 'Editar perfil' : 'Complete seu perfil'}
        </CardTitle>
        <div className="flex items-center gap-3 pt-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Etapa {step} de 3
          </span>
          <Progress value={(step / 3) * 100} className="flex-1" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPosition">Cargo atual</Label>
              <Input
                id="currentPosition"
                value={currentPosition}
                onChange={(event) => setCurrentPosition(event.target.value)}
                placeholder="Ex: Analista de Inovação"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ex: São Paulo, SP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio curta</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </div>
        )}


        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha ao menos 3 competências, separando técnicas (hard) de
              comportamentais (soft). Indique seu nível (1 a 5) e se comprova com
              algum projeto.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="skillSelect">Competência</Label>
                <Select value={pendingSkillId} onValueChange={setPendingSkillId}>
                  <SelectTrigger id="skillSelect" className="w-full">
                    <SelectValue placeholder="Escolha do catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category === 'hard' ? 'hard' : 'soft'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="levelSelect">Nível</Label>
                <Select value={pendingLevel} onValueChange={setPendingLevel}>
                  <SelectTrigger id="levelSelect" className="w-full">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5'].map((level) => (
                      <SelectItem key={level} value={level}>
                        Nível {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="evidence"
                checked={pendingEvidence}
                onCheckedChange={(checked) => setPendingEvidence(checked === true)}
              />
              <Label htmlFor="evidence" className="text-sm cursor-pointer">
                Comprovo com projeto
              </Label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSkill}
              disabled={!pendingSkillId}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar
            </Button>

            <SelectedSkillList
              title="Técnicas (hard)"
              skills={hardSkills}
              onRemove={removeSkill}
            />
            <SelectedSkillList
              title="Comportamentais (soft)"
              skills={softSkills}
              onRemove={removeSkill}
            />
            <p className="text-xs text-muted-foreground">
              {skills.length} competência(s) selecionada(s) — mínimo 3.
            </p>
          </div>
        )}


        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Anos de experiência</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min={0}
                step={0.5}
                value={yearsOfExperience}
                onChange={(event) => setYearsOfExperience(event.target.value)}
                placeholder="Ex: 3.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seniority">Senioridade</Label>
              <Select
                value={seniorityGeneral}
                onValueChange={(value) =>
                  setSeniorityGeneral(value as SeniorityOption)
                }
              >
                <SelectTrigger id="seniority" className="w-full">
                  <SelectValue placeholder="Senioridade" />
                </SelectTrigger>
                <SelectContent>
                  {SENIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cargos desejados</Label>
              <div className="flex gap-2">
                <Input
                  value={positionInput}
                  onChange={(event) => setPositionInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addPosition();
                    }
                  }}
                  placeholder="Ex: Analista de Inovação"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPosition}
                  disabled={!positionInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {desiredPositions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {desiredPositions.map((position) => (
                    <Badge
                      key={position}
                      variant="secondary"
                      className="text-[10px] gap-1"
                    >
                      {position}
                      <button
                        type="button"
                        onClick={() => removePosition(position)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remover ${position}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipos de contrato aceitos</Label>
              <div className="flex flex-wrap gap-3">
                {CONTRACT_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={acceptedContractTypes.includes(type)}
                      onCheckedChange={() => toggleContractType(type)}
                    />
                    {CONTRACT_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Modelos de trabalho aceitos</Label>
              <div className="flex flex-wrap gap-3">
                {WORK_MODELS.map((model) => (
                  <label key={model} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={acceptedWorkModels.includes(model)}
                      onCheckedChange={() => toggleWorkModel(model)}
                    />
                    {WORK_MODEL_LABELS[model]}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="relocate"
                checked={willingToRelocate}
                onCheckedChange={(checked) => setWillingToRelocate(checked === true)}
              />
              <Label htmlFor="relocate" className="text-sm cursor-pointer">
                Aceito mudar de cidade
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryExpectation">
                Pretensão salarial (opcional)
              </Label>
              <Input
                id="salaryExpectation"
                type="number"
                min={0}
                step={100}
                value={salaryExpectation}
                onChange={(event) => setSalaryExpectation(event.target.value)}
                placeholder="Ex: 8000"
              />
              <p className="text-xs text-muted-foreground">
                Esse valor fica visível apenas para você.
              </p>
            </div>
          </div>
        )}


        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 1 || isSubmitting}
          >
            Voltar
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              Avançar
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-purple-teal text-white border-0 hover:opacity-90"
            >
              {isSubmitting ? 'Salvando...' : 'Concluir'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SelectedSkillList({
  title,
  skills,
  onRemove,
}: {
  title: string;
  skills: SelectedSkill[];
  onRemove: (skillId: string) => void;
}) {
  if (skills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {skills.map((skill) => (
          <motion.div
            key={skill.skillId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{skill.name}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  skill.evidencedByProject
                    ? 'bg-jm-teal/15 text-jm-teal'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                Nv {skill.declaredLevel}
              </span>
              {skill.evidencedByProject && (
                <span className="text-xs text-jm-purple">projeto</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(skill.skillId)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remover ${skill.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

