// Guarda qual vaga o Pipeline deve abrir. O botao "Ver pipeline completo" do
// modal de candidatos chama focusPipelineOnJob antes de navegar; o Pipeline le
// a escolha ao abrir (peek) e limpa quando sai da tela (clear).
let focusedJobId: string | null = null;

export function focusPipelineOnJob(jobId: string): void {
  focusedJobId = jobId;
}

export function peekPipelineFocus(): string | null {
  return focusedJobId;
}

export function clearPipelineFocus(): void {
  focusedJobId = null;
}
