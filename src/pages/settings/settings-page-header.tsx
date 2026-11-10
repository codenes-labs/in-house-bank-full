import { useAuth } from '../../components/auth-context';
import { useBank } from '../../components/bank-context';

export function SettingsPageHeader({
  title,
  description,
  showAccount = false,
}: {
  title: string;
  description?: string;
  showAccount?: boolean;
}) {
  const auth = useAuth();
  const bank = useBank();
  const email = auth.session?.user.email ?? '';
  const businessName = bank.snapshot.settings.businessName.trim();

  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {showAccount ? (
        <>
          <p className="mt-2 break-all text-sm text-muted-foreground">{email}</p>
          {businessName ? <p className="text-sm font-semibold text-foreground">{businessName}</p> : null}
        </>
      ) : null}
    </div>
  );
}

export function SettingsAlerts({ notice, error }: { notice: string | null; error: string | null }) {
  return (
    <>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  );
}
