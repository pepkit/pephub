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
      <p className="mx-2">
        Bioinformatics tool authors can use <a href="https://eido.databio.org/en/latest/">eido</a> to specify and
        describe required input sample attributes in order to use their tool. Input sample attributes are described with
        a schema, and eido validates the sample metadata to ensure it satisfies the tool's needs. Eido uses{' '}
        <a href="https://json-schema.org/">JSON Schema</a>, which annotates and validates JSON.
      </p>
      <p className="mx-2">
        This online validator allows you to validate your sample metadata against one or more schemas. Drag and drop all
        parts of your PEP here. This includes metadata only, which is the config YAML file, any sample or subsample
        table CSV files, etc. Then, click 'Validate'.
      </p>
      <ValidatorForm defaultPepRegistryPath={pepRegistryPath} defaultSchemaRegistryPath={schemaRegistryPath} />
    </PageLayout>
  );
};
