import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { normalizeText } from '../../skills/search';
import type { JobFilters, JobSortOrder } from '../filters';

const MAX_VISIBLE_SKILLS = 40;

const SORT_OPTIONS: { value: JobSortOrder; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'match', label: 'Maior match' },
];

interface JobFiltersBarProps {
  availableSkills: string[];
  value: JobFilters;
  onChange: (next: JobFilters) => void;
  resultCount: number;
}

export function JobFiltersBar({
  availableSkills,
  value,
  onChange,
  resultCount,
}: JobFiltersBarProps) {
  const [query, setQuery] = useState('');

  const selectedKeys = new Set(value.skillNames.map(normalizeText));
  const normalizedQuery = normalizeText(query);
  const matchingSkills = availableSkills.filter(
    (name) =>
      normalizedQuery === '' || normalizeText(name).includes(normalizedQuery),
  );
  const shownSkills = matchingSkills.slice(0, MAX_VISIBLE_SKILLS);

  const toggleSkill = (name: string) => {
    const key = normalizeText(name);
    const alreadySelected = selectedKeys.has(key);
    onChange({
      ...value,
      skillNames: alreadySelected
        ? value.skillNames.filter((skill) => normalizeText(skill) !== key)
        : [...value.skillNames, name],
    });
  };

  const setSort = (sort: JobSortOrder) => {
    onChange({ ...value, sort });
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Ordenar vagas"
          className="flex rounded-lg border border-border p-0.5 text-xs"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value.sort === option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                value.sort === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Competências
              {value.skillNames.length > 0
                ? ` (${value.skillNames.length})`
                : ''}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar competência"
                aria-label="Buscar competência"
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {availableSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma competência nas vagas ativas.
                </p>
              ) : shownSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma competência encontrada.
                </p>
              ) : (
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                  {shownSkills.map((name) => {
                    const selected = selectedKeys.has(normalizeText(name));
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleSkill(name)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
              {matchingSkills.length > MAX_VISIBLE_SKILLS && (
                <p className="text-xs text-muted-foreground">
                  Mostrando {MAX_VISIBLE_SKILLS} de {matchingSkills.length}.
                  Digite para refinar a busca.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {value.skillNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.skillNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggleSkill(name)}
              aria-label={`Remover filtro ${name}`}
              className="rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {name} ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...value, skillNames: [] })}
            className="px-1 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpar competências
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {resultCount === 1 ? '1 vaga' : `${resultCount} vagas`}
      </p>
    </div>
  );
}
