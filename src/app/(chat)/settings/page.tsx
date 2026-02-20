'use client';

import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  return (
    <SettingsDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    />
  );
}
