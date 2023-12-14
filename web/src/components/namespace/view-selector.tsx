import { FC } from 'react';

type View = 'peps' | 'stars';

interface Props {
  view: View;
  setView: (view: View) => void;
  numStars: number;
}

interface SelectorProps extends Props {
  active: boolean;
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
    <button className={className} onClick={() => setView(view)}>
      {props.children}
    </button>
  );
};

export const NamespaceViewSelector: FC<Props> = (props) => {
  return (
    <div className="d-flex flex-row align-items-center">
      <div>
        <Selector {...props} view="peps" active={props.view === 'peps'}>
          <i className="bi bi-file-earmark-text me-1"></i>
          PEPs
        </Selector>
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
