const API_BASE = import.meta.env.VITE_API_HOST || '';
const EXAMPLE_URL = `${API_BASE}/projects/databio/example`;

export const PEPHUB_PYTHON_CODE_MD = `
\`\`\`python
import requests

res = requests.get(
    '${EXAMPLE_URL}'
)

print(res.json())
\`\`\`
`;
export const PEPHUB_PYTHON_CODE_RAW = `
import requests

res = requests.get(
  '${EXAMPLE_URL}'
)

print(res.json())
`;

export const PEPHUB_R_CODE_MD = `
\`\`\`r
library(httr)

res <- GET('${EXAMPLE_URL}')

print(content(res, 'text'))
\`\`\`
`;

export const PEPHUB_R_CODE_RAW = `
library(httr)

res <- GET('${EXAMPLE_URL}')

print(content(res, 'text'))
`;

export const PEPHUB_CURL_CODE_MD = `
\`\`\`bash
curl ${EXAMPLE_URL} \\
    -H 'Accept: application/json' \\

\`\`\`
`;

export const PEPHUB_CURL_CODE_RAW = `
curl http://localhost:8000/api/bed/example \\
    -H 'Accept: application/json' \\
`;

export const PEPHUB_JAVASCRIPT_CODE_MD = `
\`\`\`javascript
fetch('${EXAMPLE_URL}')
  .then((res) => res.json())
  .then((data) => console.log(data));
\`\`\`
`;

export const PEPHUB_JAVASCRIPT_CODE_RAW = `
fetch('http://localhost:8000/api/bed/example')
  .then((res) => res.json())
  .then((data) => console.log(data));
`;

export const CODE_SNIPPETS = [
  {
    language: 'Python',
    code: PEPHUB_PYTHON_CODE_MD,
    raw: PEPHUB_PYTHON_CODE_RAW,
  },
  {
    language: 'R',
    code: PEPHUB_R_CODE_MD,
    raw: PEPHUB_R_CODE_RAW,
  },
  {
    language: 'Curl',
    code: PEPHUB_CURL_CODE_MD,
    raw: PEPHUB_CURL_CODE_RAW,
  },
  {
    language: 'JavaScript',
    code: PEPHUB_JAVASCRIPT_CODE_MD,
    raw: PEPHUB_JAVASCRIPT_CODE_RAW,
  },
];

export const CLIENT_PYTHON_CODE_MD = `
\`\`\`python
import peppy

project = peppy.Project.from_pephub('databio/example')

print(project)
\`\`\`
`;

export const CLIENT_PYTHON_CODE_RAW = `
import peppy

project = peppy.Project.from_pephub('databio/example')

print(project)
`;

export const CLIENT_R_CODE_MD = `
\`\`\`r

# PEPHub client is not yet available in R
# R package is under development

\`\`\`
`;

export const CLIENT_R_CODE_RAW = `
# PEPHub client is not yet available in R
# R package is under development
`;

export const PEPHUBCLIENT_SNIPPETS = [
  {
    language: 'Python',
    code: CLIENT_PYTHON_CODE_MD,
    raw: CLIENT_PYTHON_CODE_RAW,
  },
  {
    language: 'R',
    code: CLIENT_R_CODE_MD,
    raw: CLIENT_R_CODE_RAW,
  },
];
