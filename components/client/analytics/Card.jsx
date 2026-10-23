// White panel used for every dashboard block. Wide content scrolls inside it.
export default function Card({title, description, action, children}) {
  return (
    <section className="min-w-0 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
