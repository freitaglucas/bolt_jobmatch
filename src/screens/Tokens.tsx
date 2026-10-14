import { motion } from 'framer-motion';
import { CalendarClock, Info, ShieldCheck, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SLA_HOURS } from '../features/tokens/token-rules';

const SLA_DAYS = SLA_HOURS / 24;

const HIGHLIGHTS = [
  {
    icon: CalendarClock,
    title: `Retorno em até ${SLA_DAYS} dias`,
    text: 'Todo candidato ativo tem um prazo de retorno. Ele aparece em cada card do Pipeline e em "Minhas candidaturas".',
  },
  {
    icon: ShieldCheck,
    title: 'Mais tempo, sem sumir',
    text: 'Se precisar de mais tempo, envie uma atualização com a nova data: até 2 adiamentos por etapa, de no máximo 14 dias.',
  },
  {
    icon: Target,
    title: 'Meta de 90% no prazo',
    text: 'Em breve o painel mostra o seu índice de retorno no prazo e o desconto que ele garantiria.',
  },
];

const RULES = [
  'Mover de etapa, rejeitar e dar retorno (individual ou em lote) são gratuitos e nunca travam.',
  'Mudar de etapa conta como contato: o candidato sempre fica sabendo.',
  'Ao dar um retorno de decisão, o prazo da etapa é cumprido e um novo prazo começa.',
  'Rejeitar sempre leva um motivo. No retorno em lote, o motivo é sugerido pelo que o candidato informou no perfil.',
];

export function Tokens() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jornada do Recrutamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Retorno no prazo: o candidato sempre sabe quando vai ter notícias
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {HIGHLIGHTS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-jm-teal/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-jm-teal" />
                </div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
