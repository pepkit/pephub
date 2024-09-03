import { Schema } from '../../api/schemas';
import { dateStringToDateTime } from '../../utils/dates';
import { SchemaCardDropdown } from './schema-card-dropdown';
import { MarkdownToText } from '../markdown/render';

type Props = {
  schema: Schema;
};

export const SchemaListCard = (props: Props) => {
  const { schema } = props;
  const { namespace, name, description, last_update_date, submission_date } = schema;
  return (
    <div className="border ps-3 pe-2 pb-3 pt-2 shadow-sm rounded mt-3 bg-body-tertiary card namespace-card">
      <div className="d-flex flex-column">
        <div className="d-flex justify-content-between">
          <a className='fw-semibold fs-4 stretched-link text-decoration-none text-primary-emphasis' href={`/schemas/${namespace}/${name}`}>
            {namespace}/{name}
          </a>
          <SchemaCardDropdown schema={schema} />
        </div>

        {description ? (
          <MarkdownToText>{description}</MarkdownToText>
        ) : (
          <em>
            <span className="text-muted text-italic">No description</span>
          </em>
        )}
        {/*<p className="text-muted mb-0">{description || 'No description'}</p>*/}
        <p className="mt-2 mb-0">
          <small>
            <span className="me-3">
              <span className="fw-semibold">Created:</span>
              <span className="mx-1">{dateStringToDateTime(submission_date)}</span>
            </span>
            <span>
              <span className="fw-semibold">Updated:</span>
              <span className="mx-1">{dateStringToDateTime(last_update_date)}</span>
            </span>
          </small>
        </p>
      </div>
    </div>
  );
};
