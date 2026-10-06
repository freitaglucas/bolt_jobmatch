import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Coins, Info, TrendingUp } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useTokenBalance, useTokenLedger } from '../features/tokens/hooks';
import {
  FEEDBACK_REWARD,
  INITIAL_TOKENS,
  SLA_HOURS,
  formatLedgerDate,
  mapLedgerRow,
  summarizeMonth,
} from '../features/tokens/token-rules';

const RULES = [
  `${INITIAL_TOKENS} tokens de boas-vindas quando o seu perfil é aprovado.`,
  'Mover etapa, rejeitar e dar retorno manual são gratuitos e nunca travam por saldo.',
  'Tokens vão pagar automações de contato com candidatos, como o retorno em lote por e-mail (em breve).',
  `Enviar feedback em até ${SLA_HOURS / 24} dias após a última mudança de etapa devolve ${FEEDBACK_REWARD} token (1 por candidatura e etapa).`,
];

export function Tokens() {
  const balanceQuery = useTokenBalance();
  const ledgerQuery = useTokenLedger();

  const entries = useMemo(
    () => (ledgerQuery.data ?? []).map(mapLedgerRow),
    [ledgerQuery.data],
  );
  const month = useMemo(() => summarizeMonth(entries, new Date()), [entries]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jornada do Recrutamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tokens pagam automações de contato e premiam o retorno rápido a quem se candidata
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border overflow-hidden mb-6">
          <div className="bg-gradient-purple-teal p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-6 w-6 text-white" />
              <span className="text-white/80 text-sm font-medium">Saldo de tokens</span>
            </div>
            <div className="text-5xl font-bold text-white">
              {balanceQuery.isError
                ? '—'
                : balanceQuery.isLoading
                  ? '...'
                  : balanceQuery.data ?? 0}
            </div>
            {balanceQuery.isError && (
              <p className="text-white/80 text-sm mt-2">
                Não foi possível carregar o saldo.
              </p>
            )}
            {!ledgerQuery.isLoading && !ledgerQuery.isError && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge className="bg-white/15 text-white border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{month.earned} este mês
                </Badge>
                <Badge className="bg-white/15 text-white border-0">
                  -{month.spent} este mês
                </Badge>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <Card className="border-border mb-6">
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando o histórico...</p>
          )}
          {ledgerQuery.isError && (
            <p className="text-sm text-destructive">
              Não foi possível carregar o histórico.
            </p>
          )}
          {!ledgerQuery.isLoading && !ledgerQuery.isError && entries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma movimentação de tokens ainda.
            </p>
          )}
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    entry.type === 'earn' ? 'bg-jm-teal/15' : 'bg-jm-orange/15',
                  )}
                >
                  {entry.type === 'earn' ? (
                    <ArrowDownLeft className="h-5 w-5 text-jm-teal" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-jm-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLedgerDate(entry.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold shrink-0',
                    entry.type === 'earn' ? 'text-jm-teal' : 'text-jm-orange',
                  )}
                >
                  {entry.type === 'earn' ? '+' : '-'}
                  {entry.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
