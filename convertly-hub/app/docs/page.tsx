// app/docs/page.tsx

const apiEndpoints = [
  {
    id: 'convert-file',
    method: 'POST',
    path: '/api/v1/convert',
    description:
      'Converts a file for an active API key on a Basic plan or higher. The active plan determines the maximum file size. Stored results return 202 and are downloaded separately; without storage the file is streamed immediately with 200.',
    parameters: [
      { name: 'file', type: 'file', description: 'The file to be converted.' },
      {
        name: 'targetFormat',
        type: 'string',
        description: 'The desired output format (e.g., "pdf", "jpg", "png").',
      },
    ],
    examples: [
      {
        language: 'curl',
        code: `curl -X POST \\
  https://your-convertly-domain.example/api/v1/convert \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -F 'file=@/path/to/your/file.docx' \\
  -F 'targetFormat=pdf'`,
      },
      {
        language: 'javascript',
        code: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('targetFormat', 'pdf');

fetch('/api/v1/convert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <YOUR_API_KEY>',
  },
  body: formData,
})
.then(async (response) => {
  if (!response.ok) throw new Error('Conversion request failed');
  if (response.status === 202) return response.json();

  const file = await response.blob();
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'converted-file';
  link.click();
  URL.revokeObjectURL(url);
})
.then(data => { if (data) console.log(data); })
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
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            API Documentation
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Integrate Convertly Hub into your own applications with the API-key protected conversion
            API.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Supported directions: JPG to PNG, PNG to JPG, and DOCX to PDF. File size is limited by
            the active plan; PDF to DOCX is not available yet. Each API key is limited to 30
            conversion requests per minute.
          </p>
        </div>
        <div className="mt-16 space-y-12">
          {apiEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gray-800 p-4 sm:p-6">
                <h3 className="text-lg font-semibold leading-7 text-white">
                  <span
                    className={
                      'text-sm font-semibold ' +
                      (endpoint.method === 'POST' ? 'text-white' : 'text-green-400') +
                      ' mr-2'
                    }
                  >
                    {endpoint.method}
                  </span>
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
                        <p className="text-sm font-medium text-gray-600 capitalize mb-1">
                          {example.language}
                        </p>
                        <pre className="p-4 bg-gray-900 rounded-lg text-sm text-white overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-800">
                    Stored result response (202 Accepted)
                  </h4>
                  <pre className="mt-3 p-4 bg-gray-900 rounded-lg text-sm text-white overflow-x-auto">
                    <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                  </pre>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-base font-semibold text-gray-800">
                    Downloading a stored result
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">
                    When File Storage is enabled in the account, use the returned conversionId with
                    the same API key. Do not use curl -i when writing the binary response to a file,
                    because it adds HTTP headers to the downloaded file.
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white">
                    <code>{`curl \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -o converted-file.jpg \\
  https://your-convertly-domain.example/api/v1/conversions/<CONVERSION_ID>/download`}</code>
                  </pre>
                  <p className="mt-3 text-sm text-gray-600">
                    The download endpoint returns 200 with the binary file, 401 for an invalid key,
                    404 when the stored result is not available yet or no longer exists, and 503 for
                    a storage failure. Retry a newly created stored conversion with a short backoff.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-base font-semibold text-gray-800">Storage modes</h4>
                  <p className="mt-2 text-sm text-gray-600">
                    File Storage is an account preference, not a multipart parameter. With it
                    enabled, POST returns 202 and the result is private in storage. With it
                    disabled, POST returns 200 and streams the binary result directly with
                    Cache-Control: no-store; no later download endpoint is available for that
                    conversion.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
