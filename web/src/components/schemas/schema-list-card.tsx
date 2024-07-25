import { Schema } from '../../api/schemas';
import { dateStringToDateTime } from '../../utils/dates';
import { SchemaCardDropdown } from './schema-card-dropdown';

type Props = {
  schema: Schema;
};

export const SchemaListCard = (props: Props) => {
  const { schema } = props;
  const { namespace, name, description, last_update_date, submission_date } = schema;
  return (
    <div className="border border-dark p-2 shadow-sm rounded mt-3">
      <div className="d-flex flex-column gap-1">
        <div className="d-flex justify-content-between">
          <a href={`/schemas/${namespace}/${name}`}>
            <h4 className="fw-bold fs-4 mb-0">
              {namespace}/{name}
            </h4>
          </a>
          <SchemaCardDropdown schema={schema} />
        </div>
        <p className="text-muted mb-0">{description || 'No description'}</p>
        <p className="fst-italic mb-0 text-sm">
          <span className="mx-1">
            <i className="bi bi-clock me-1"> Updated: {dateStringToDateTime(last_update_date)}</i>{' '}
          </span>
          <span className="mx-1">
            <i className="bi bi-clock me-1"> Created: {dateStringToDateTime(submission_date)}</i>
          </span>
        </p>
      </div>
    </div>
  );
};
