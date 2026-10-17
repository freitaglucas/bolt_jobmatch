import { BadgeCheck, CalendarClock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { returnPromiseText, sealPeriodText, sealText } from '../seal-rules';

interface ReturnAssuranceProps {
  // Percentual do selo; null/undefined = sem selo (nunca existe selo negativo).
  sealPercent?: number | null;
  // Mostra "Ultimos 90 dias" ao lado do selo (pagina da vaga).
  showPeriod?: boolean;
  className?: string;
}

// Promessa de retorno (sempre) e selo de retorno no prazo (quando conquistado).
export function ReturnAssurance({ sealPercent, showPeriod, className }: ReturnAssuranceProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-xs', className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-foreground">
        <CalendarClock className="h-3.5 w-3.5 text-jm-teal" aria-hidden="true" />
        {returnPromiseText()}
      </span>
      {sealPercent != null && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-jm-teal/15 px-2 py-1 font-medium text-foreground"
          title={sealPeriodText()}
        >
          <BadgeCheck className="h-3.5 w-3.5 text-jm-teal" aria-hidden="true" />
          {sealText(sealPercent)}
          {showPeriod && (
            <span className="font-normal text-muted-foreground">· {sealPeriodText()}</span>
          )}
        </span>
      )}
    </div>
  );
}
