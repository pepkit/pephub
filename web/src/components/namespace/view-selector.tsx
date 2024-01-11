import { FC, useState } from 'react';

type View = 'peps' | 'stars';

interface Props {
  view: View;
  setView: (view: View) => void;
  numStars: number;
  numPeps: number;
}

interface SelectorProps extends Props {
  active: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

const Selector = (props: SelectorProps) => {
  const { view, setView, active } = props;

  let className = 'me-1 ';

  if (active) {
    className += 'btn btn-sm btn-outline-primary shadow-none px-3 py-2 fw-bold';
  } else {
    className += 'btn btn-sm shadow-none px-3 py-2 text-primary';
  }

  return (
    <button
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      className={className}
      onClick={() => {
        setView(view);
        // update url to show ?view=peps or ?view=stars
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('view', view);
          window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        }
      }}
    >
      {props.children}
    </button>
  );
};

export const NamespaceViewSelector: FC<Props> = (props) => {
  const [popcornVariant, setPopcornVariant] = useState<'primary' | 'white'>('primary');
  return (
    <div className="d-flex flex-row align-items-center">
      <div>
        <Selector {...props} view="peps" active={props.view === 'peps'}>
          <i className="bi bi-file-earmark-text me-1"></i>
          PEPs
          <span className="text-sm ms-2 rounded-pill border border-primary px-2 bg-primary bg-opacity-10">
            {props.numPeps}
          </span>
        </Selector>
        {/* <Selector
          onMouseEnter={() => {
            if (props.view === 'pops') {
              setPopcornVariant('white');
            }
          }}
          onMouseLeave={() => setPopcornVariant('primary')}
          {...props}
          view="pops"
          active={props.view === 'pops'}
        >
          <img
            src={`popcorn-${popcornVariant}.svg`}
            height="13px"
            width="13px"
            alt="Popcorn icon"
            className="me-1 text-primary mb-1"
          />
          POPs
          <span className="text-sm ms-2 rounded-pill border border-primary px-2 bg-primary bg-opacity-10">
            {props.numStars}
          </span>
        </Selector> */}
        <Selector {...props} view="stars" active={props.view === 'stars'}>
          <i className="bi bi-star me-2"></i>
          Stars
          <span className="text-sm ms-2 rounded-pill border border-primary px-2 bg-primary bg-opacity-10">
            {props.numStars}
          </span>
        </Selector>
      </div>
    </div>
  );
};
