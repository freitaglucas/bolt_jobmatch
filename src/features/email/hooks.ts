import { useMutation } from '@tanstack/react-query';
import { sendTestEmail } from './api';

export function useSendTestEmail() {
  return useMutation({ mutationFn: sendTestEmail });
}
