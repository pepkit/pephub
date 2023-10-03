import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ValidatorForm } from '../components/forms/validator-form';
import { PageLayout } from '../components/layout/page-layout';

export const EidoValidator: FC = () => {
  // get any potential defaults from the URL
  const [params, setParams] = useSearchParams();

  const pepRegistryPath = params.get('pepRegistryPath') || '';
  const schemaRegistryPath = params.get('schemaRegistryPath') || '';

  return (
    <PageLayout
      title="Eido Validator"
      description="This tool will validate your sample metadata against one or more schemas. Drag and drop all parts of your PEP here. This includes metadata only, which is the config YAML file, any sample or subsample table CSV files, etc. Then, click 'Validate'."
    >
      <h1 className="mb-1">
        <img src="/eido_vertical.svg" height="75px" className="me-2" alt="Eido icon." />
        Universal Validator
      </h1>
      <ValidatorForm defaultPepRegistryPath={pepRegistryPath} defaultSchemaRegistryPath={schemaRegistryPath} />
    </PageLayout>
  );
};
