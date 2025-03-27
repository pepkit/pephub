import { Schema } from '../../api/schemas';
import { dateStringToDateTime } from '../../utils/dates';
import { SchemaCardDropdown } from './schema-card-dropdown';
import { MarkdownToText } from '../markdown/render';

type Props = {
  schema: Schema;
};

export const SchemaListCard = (props: Props) => {
  const { schema } = props;
  const { namespace, schema_name: name, description, last_update_date, latest_released_version, maintainers, private: isPrivate } = schema;
  
  return (
    <div className="border ps-3 pe-2 pb-3 pt-2 shadow-sm rounded mt-3 bg-body-tertiary card namespace-card">
      <div className="d-flex flex-column">
        <div className="d-flex justify-content-between">
          <a className='fw-semibold fs-4 stretched-link text-decoration-none text-primary-emphasis' href={`/schemas/${namespace}/${name}`}>
            {namespace}/{name}
          </a>
          {/* {isPrivate ? (
            <span className="ms-2 badge text-dark rounded-pill border border-dark">Private</span>
          ) : (
            <span className="ms-2 badge text-dark rounded-pill border border-dark">Public</span>
          )} */}
          <SchemaCardDropdown schema={schema} />
        </div>

        <div className="mb-0">
          {description ? (
            <MarkdownToText>{description}</MarkdownToText>
          ) : (
            <em>
              <span className="text-muted text-italic">No description</span>
            </em>
          )}
        </div>

        <div className="d-flex flex-row align-items-center mt-3 text-sm">
          <span>
            <span className="fw-semibold">Maintainers:</span>
            <span className="mx-1">{maintainers}</span>
          </span>
        </div>
        <div className="d-flex flex-row align-items-center text-mute text-sm">
          <span className="me-3">
            <span className="fw-semibold">Latest Version:</span>
            <span className="mx-1">{latest_released_version}</span>
          </span>
          <span>
            <span className="fw-semibold">Updated:</span>
            <span className="mx-1">{dateStringToDateTime(last_update_date)}</span>
          </span>
        </div>

      </div>
    </div>
  );
};
