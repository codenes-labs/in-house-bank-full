import { useMemo, useState } from 'react';
import { OverlayPanel } from './overlay-panel';
import { SaveActionButton } from './standard-action-buttons';
import {
  type CompanyMenuAccess,
  categoryCheckState,
  MenuAccessCategory,
  menuAccessCategoryLabel,
  setCategoryRoutes,
  isRouteEnabled,
  setRouteEnabled,
} from '../domain/holding/company-menu-access';
import { menuAccessRoutesCatalog } from '../domain/navigation/menu-access-catalog';

const CATEGORIES: MenuAccessCategory[] = [
  MenuAccessCategory.Patrimonio,
  MenuAccessCategory.Holding,
  MenuAccessCategory.Relatorios,
  MenuAccessCategory.Conta,
];

function CategoryCheckbox({
  state,
  onChange,
}: {
  state: ReturnType<typeof categoryCheckState>;
  onChange: (checked: boolean) => void;
}) {
  const ref = (element: HTMLInputElement | null) => {
    if (element) {
      element.indeterminate = state === 'partial';
    }
  };
  return (
    <input
      ref={ref}
      type="checkbox"
      className="size-4 shrink-0 rounded border-border"
      checked={state === 'all'}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

export function HoldingCompanyPermissionsPanel({
  open,
  menuAccess,
  mustChangePassword,
  saving,
  onClose,
  onChangeMenuAccess,
  onChangeMustChangePassword,
  onSave,
}: {
  open: boolean;
  menuAccess: CompanyMenuAccess;
  mustChangePassword: boolean;
  saving: boolean;
  onClose: () => void;
  onChangeMenuAccess: (next: CompanyMenuAccess) => void;
  onChangeMustChangePassword: (value: boolean) => void;
  onSave: () => void;
}) {
  const catalog = useMemo(() => menuAccessRoutesCatalog(), []);
  const [expanded, setExpanded] = useState<Partial<Record<MenuAccessCategory, boolean>>>({});

  return (
    <OverlayPanel open={open} title="Permissões da conta" onClose={onClose}>
      <div className="grid gap-6">
        <section className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Marque uma categoria para liberar todas as telas; expanda para ajustar tela a tela.
          </p>
          <ul className="grid gap-2">
            {CATEGORIES.map((category) => {
              const state = categoryCheckState(menuAccess, category);
              const routes = catalog.filter((entry) => entry.category === category);
              const isOpen = expanded[category] === true;
              return (
                <li key={category} className="rounded-lg border border-border">
                  <div className="flex min-h-12 items-center gap-2 px-3">
                    <CategoryCheckbox
                      state={state}
                      onChange={(checked) => onChangeMenuAccess(setCategoryRoutes(menuAccess, category, checked))}
                    />
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 py-3 text-left"
                      onClick={() => setExpanded((prev) => ({ ...prev, [category]: !isOpen }))}
                    >
                      <span className="font-medium">{menuAccessCategoryLabel(category)}</span>
                      <span className="text-xs text-muted-foreground">{isOpen ? '▾' : '▸'}</span>
                    </button>
                  </div>
                  {isOpen ? (
                    <ul className="grid gap-1 border-t border-border px-3 py-2">
                      {routes.map((route) => (
                        <li key={route.to}>
                          <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted/50">
                            <input
                              type="checkbox"
                              className="size-4 shrink-0 rounded border-border"
                              checked={isRouteEnabled(menuAccess, route.to)}
                              onChange={(event) =>
                                onChangeMenuAccess(setRouteEnabled(menuAccess, route.to, event.target.checked))
                              }
                            />
                            <span className="text-sm">{route.label}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Acesso</h3>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-3">
            <input
              type="checkbox"
              className="size-4 shrink-0 rounded border-border"
              checked={mustChangePassword}
              onChange={(event) => onChangeMustChangePassword(event.target.checked)}
            />
            <span className="text-sm text-muted-foreground">Exigir troca de senha no próximo login</span>
          </label>
        </section>
        <SaveActionButton
          type="button"
          label="Salvar permissões"
          busy={saving}
          className="w-full"
          onClick={onSave}
        />
      </div>
    </OverlayPanel>
  );
}