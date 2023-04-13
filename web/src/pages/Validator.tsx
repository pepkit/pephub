import { FC } from 'react';
import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { ValidatorForm } from '../components/forms/validator-form';

interface FormValues {
  peps: FileList;
  schemas: string[];
}

export const EidoValidator: FC = () => {
  const { user, login } = useSession();
  return (
    <PageLayout
      title="Eido Validator"
      description="This tool will validate your sample metadata against one or more schemas. Drag and drop all parts of your PEP here. This includes metadata only, which is the config YAML file, any sample or subsample table CSV files, etc. Then, click 'Validate'."
    >
      <h1>Eido Univseral Validator</h1>
      <ValidatorForm />
    </PageLayout>
  );
};
