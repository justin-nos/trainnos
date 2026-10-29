// Shared shell for /privacy, /terms and /sms-alerts: a dark band under the
// (white-text) site nav, then a readable white column.
export default function LegalPage({title, updated, section, children}) {
  return (
    <main data-section={section}>
      <div className="bg-gray-950 px-6 pt-32 pb-12 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
          {updated && <p className="mt-4 text-sm text-gray-400">Last updated {updated}</p>}
        </div>
      </div>
      <div className="bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6 text-base/7 text-gray-700 [&_a]:font-semibold [&_a]:text-red-600 [&_a:hover]:text-red-500 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </main>
  );
}

