import { ProjectInfoFooter } from './project-info-footer';
import { ProjectDescription } from './project-page-description';
import { ProjectHeaderBar } from './project-page-header-bar';
import { useSampleTable } from '../../hooks/queries/useSampleTable'


type Props = {
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  sampleTableIndex: string;
};

export const ProjectHeader = (props: Props) => {
  const { sampleTable, sampleTableIndex } = props;
  
  return (
    <div className="shadow-sm pt-2">
      <ProjectHeaderBar sampleTable={sampleTable} sampleTableIndex={sampleTableIndex}/>
      <ProjectDescription />
      <ProjectInfoFooter />
    </div>
  );
};
