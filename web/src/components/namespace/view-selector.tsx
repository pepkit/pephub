import { FC } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import { NavLink, useSearchParams } from 'react-router-dom';
import { DownloadGeoCount } from '../namespace/archive/download-geo-count';

type View = 'peps' | 'pops' | 'schemas' | 'stars' | 'archive';

type Props = {
  view: View;
  numPeps: number;
  numPops: number;
  numStars?: number;
  numSchemas: number;
  setView: (view: View) => void;
  enableStars?: boolean;
  isGEO?: boolean;
  namespace?: string;
};

export const NamespaceViewSelector: FC<Props> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const handleNavSelect = (eventKey: string | null) => {
    if (eventKey === null) {
      return;
    }
    searchParams.set('view', eventKey);
    setSearchParams(searchParams);
    props.setView(eventKey as View);
  };

  return (
    <div className="px-0 py-1 namespace-nav">
      <Nav variant="pills" defaultActiveKey={props.view} onSelect={handleNavSelect}>
        <Nav.Item>
          <Nav.Link eventKey="peps" className="px-2 py-1 me-1">
            <i className="bi bi-file-earmark-text me-1"></i>
            PEPs
            {props.view === 'peps' ? (
              <span className="text-sm ms-2 rounded-pill border border-light px-2 bg-light bg-opacity-10">
                {props.numPeps}
              </span>
            ) : (
              <span className="text-sm ms-2 rounded-pill border border-secondary-subtle px-2 bg-secondary bg-opacity-10">
                {props.numPeps}
              </span>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pops" className="px-2 py-1 me-1">
            <i className="bi bi-balloon me-1"></i>
            POPs
            {props.view === 'pops' ? (
              <span className="text-sm ms-2 rounded-pill border border-light px-2 bg-light bg-opacity-10">
                {props.numPops}
              </span>
            ) : (
              <span className="text-sm ms-2 rounded-pill border border-secondary-subtle px-2 bg-secondary bg-opacity-10">
                {props.numPops}
              </span>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="schemas" className="px-2 py-1 me-1">
            <i className="bi bi-filetype-yml me-1"></i>
            Schemas
            {props.view === 'schemas' ? (
              <span className="text-sm ms-2 rounded-pill border border-light px-2 bg-light bg-opacity-10">
                {props.numSchemas}
              </span>
            ) : (
              <span className="text-sm ms-2 rounded-pill border border-secondary-subtle px-2 bg-secondary bg-opacity-10">
                {props.numSchemas}
              </span>
            )}
          </Nav.Link>
        </Nav.Item>
        {props.enableStars && (
          <Nav.Item accessKey="stars">
            <Nav.Link eventKey="stars" className="px-2 py-1 me-1">
              <i className="bi bi-star me-2"></i>
              Stars
              {props.view === 'stars' ? (
                <span className="text-sm ms-2 rounded-pill border border-light px-2 bg-light bg-opacity-10">
                  {props.numStars}
                </span>
              ) : (
                <span className="text-sm ms-2 rounded-pill border border-secondary-subtle px-2 bg-secondary bg-opacity-10">
                  {props.numStars}
                </span>
              )}
            </Nav.Link>
          </Nav.Item>
        )}
        {props.isGEO && (
          <Nav.Item>
            <Nav.Link eventKey="archive" className="px-2 py-1 me-1">
              <i className="bi bi-database-down me-1"></i>
              Archive
              {props.view === 'archive' ? (
                <span className="text-sm ms-2 rounded-pill border border-light px-2 bg-light bg-opacity-10">
                  <DownloadGeoCount namespace={props.namespace}/>
                </span>
              ) : (
                <span className="text-sm ms-2 rounded-pill border border-secondary-subtle px-2 bg-secondary bg-opacity-10">
                  <DownloadGeoCount namespace={props.namespace}/>
                </span>
              )}
            </Nav.Link>
          </Nav.Item>
        )}
      </Nav>
    </div>
  );
};
