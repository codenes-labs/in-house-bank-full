import { Link, useNavigate } from 'react-router-dom';
import { CarneGenerator } from '../components/carne-generator';
import { useBank } from '../components/bank-context';

export function NewInstallmentPage() {
  const bank = useBank();
  const navigate = useNavigate();
  const settings = bank.snapshot.settings;

  return (
    <div className="grid gap-4">
      <Link to="/parcelamentos" className="text-sm font-semibold text-primary w-fit">
        Voltar aos parcelamentos
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">Novo parcelamento</h1>
        <p className="mt-1 text-muted-foreground">Gere as parcelas e salve direto na sua conta.</p>
      </div>
      <CarneGenerator
        title="Montar carnê"
        description="Use o simulador, confira as parcelas e salve. O PDF fica disponível depois de salvar."
        prefill={{
          beneficiary: settings.businessName,
          pixKey: settings.defaultPixKey,
          institution: settings.defaultInstitution,
          city: settings.city,
        }}
        onSaveBundle={async (bundle) => {
          await bank.saveBundle(bundle);
          navigate(`/parcelamentos/${bundle.plan.id}`);
        }}
      />
    </div>
  );
}
