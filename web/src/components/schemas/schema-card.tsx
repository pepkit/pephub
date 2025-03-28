import { Schema } from '../../api/schemas';
import { dateStringToDate, dateStringToDateTime } from '../../utils/dates';

type Props = {
  schema: Schema;
};

export const SchemaCard = (props: Props) => {
  const { schema } = props;
  return (
    <div className="shadow-sm rounded border border-light-subtle schema-card">
      <a href={`/schemas/${schema.namespace}/${schema.schema_name}`}>
        <div className="p-3 d-flex flex-column justify-content-between h-100">
          <div>
            <h3 className="fw-bold fs-5">
              {schema.namespace}/{schema.schema_name}
            </h3>
            <p className="text-muted mb-0 my-2">{schema.description}</p>
          </div>
          <div className="d-flex align-items-center mt-1">
            <i className="bi bi-clock me-1 text-sm"></i>
            <p className="fst-italic mb-0 text-sm">{dateStringToDateTime(schema.last_update_date)}</p>
          </div>
        </div>
      </a>
    </div>
  );
};
