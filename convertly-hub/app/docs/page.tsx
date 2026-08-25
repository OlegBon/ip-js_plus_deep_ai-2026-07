// app/docs/page.tsx

const apiEndpoints = [
  {
    id: 'convert-file',
    method: 'POST',
    path: '/api/v1/convert',
    description: 'Converts a file for an active API key on a Basic plan or higher. Stored results return 202 and are downloaded separately; without storage the file is streamed immediately with 200.',
    parameters: [
      { name: 'file', type: 'file', description: 'The file to be converted.' },
      { name: 'targetFormat', type: 'string', description: 'The desired output format (e.g., "pdf", "jpg", "png").' },
    ],
    examples: [
      {
        language: 'curl',
        code: `curl -X POST \\
  http://localhost:3001/api/v1/convert \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -F 'file=@/path/to/your/file.docx' \\
  -F 'targetFormat=pdf'`,
      },
      {
        language: 'javascript',
        code: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('targetFormat', 'pdf');

fetch('http://localhost:3001/api/v1/convert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <YOUR_API_KEY>',
  },
  body: formData,
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
      },
    ],
    response: {
      conversionId: 'c7a8b9d0-e1f2-g3h4-i5j6-k7l8m9n0o1p2',
      status: 'PENDING',
      createdAt: '2026-08-24T12:00:00.000Z',
    },
  },
];

export default function DocsPage() {
  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            API Documentation
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Integrate Convertly Hub into your own applications with the API-key protected conversion API.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Supported directions: JPG to PNG, PNG to JPG, and DOCX to PDF. Files are limited by the active plan (up to 10 MB); PDF to DOCX is not available yet.
          </p>
        </div>
        <div className="mt-16 space-y-12">
          {apiEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gray-800 p-4 sm:p-6">
                <h3 className="text-lg font-semibold leading-7 text-white">
                  <span className={
                    "text-sm font-semibold " +
                    (endpoint.method === 'POST' ? 'text-white' : 'text-green-400') +
                    " mr-2"
                  }>{endpoint.method}</span>
                  <span className="font-mono">{endpoint.path}</span>
                </h3>
                <p className="mt-2 text-sm text-gray-300">{endpoint.description}</p>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-800">Parameters</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {endpoint.parameters.map((param) => (
                      <li key={param.name}>
                        <code className="font-mono font-semibold">{param.name}</code>
                        <span className="text-gray-500"> ({param.type})</span>: {param.description}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-800">Code Examples</h4>
                  <div className="mt-3 space-y-4">
                    {endpoint.examples.map((example) => (
                      <div key={example.language}>
                        <p className="text-sm font-medium text-gray-600 capitalize mb-1">{example.language}</p>
                        <pre className="p-4 bg-gray-900 rounded-lg text-sm text-white overflow-x-auto">
                          <code>
                            {example.code}
                          </code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                    <h4 className="text-base font-semibold text-gray-800">Accepted Response (202 Accepted)</h4>
                    <pre className="mt-3 p-4 bg-gray-900 rounded-lg text-sm text-white overflow-x-auto">
                        <code>
                            {JSON.stringify(endpoint.response, null, 2)}
                        </code>
                    </pre>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
