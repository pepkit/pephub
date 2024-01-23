const API_HOST = import.meta.env.VITE_API_HOST || '';

export const downloadZip = (namespace: string, project: string, tag: string, jwt: string | undefined | null) => {
  const completeName = `${namespace}-${project}-${tag}`;
  fetch(`${API_HOST}/api/v1/projects/${namespace}/${project}/zip?tag=${tag}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt || ' IMNOTAUTHORIZED'}`,
    },
  })
    .then((res) => res.blob())
    .then((blob) => {
      var a = document.createElement('a');
      var file = window.URL.createObjectURL(blob);
      a.href = file;
      a.download = completeName + '.zip';
      a.click();
      window.URL.revokeObjectURL(file);
    });
};
