import { FC } from 'react';

type CombinedErrorMessageProps = {
  errors: FieldErrors<any>;
  formType: string;
};

export const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors, formType } = props;

  if (formType === 'schema') {
    const nameError = errors.name?.message;
    let msg = null;

    if (nameError == 'empty') {
      msg = 'Schema Name must not be empty.';
    } else if (nameError == 'invalid') {
      msg = "Schema Name must contain only alphanumeric characters, '.', '-', or '_'.";
    }

    if (nameError) {
      return <p className="text-danger text-xs pt-1 mb-0">{msg}</p>;
    }
    return null;
  } else if (formType === 'project') {
    const nameError = errors.project_name?.message;
    const tagError = errors.tag?.message;
    let msg = null;

    if (nameError == 'empty' && !tagError) {
      msg = 'Project Name must not be empty.';
    } else if (nameError == 'invalid' && !tagError) {
      msg = "Project Name must contain only alphanumeric characters, '-', or '_'.";
    } else if (nameError == 'empty' && tagError == 'invalid') {
      msg = "Project Name must not be empty and Tag must contain only alphanumeric characters, '-', or '_'.";
    } else if (nameError == 'invalid' && tagError == 'invalid') {
      msg = "Project Name and Tag must contain only alphanumeric characters, '-', or '_'.";
    } else if (!nameError && tagError == 'invalid') {
      msg = "Project Tag must contain only alphanumeric characters, '-', or '_'.";
    }

    if (nameError || tagError) {
      return <p className="text-danger text-xs pt-1 mb-0">{msg}</p>;
    }

    return null;
  }
  
};