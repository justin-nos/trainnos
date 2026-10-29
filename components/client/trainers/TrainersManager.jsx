"use client";
import {useEffect, useState} from "react";
import {FaArrowDown, FaArrowUp, FaPlus, FaRotateRight} from "react-icons/fa6";
import {checkUpload, mediaKind, ACCEPT} from "../../../lib/media/rules.mjs";
import {formatUSPhone} from "../../../lib/quiz/phone.mjs";
import {
  BIO_MAX,
  NAME_MAX,
  TRAINER_POSITIONS,
  isFounder,
  splitTrainers,
} from "../../../lib/trainers/schema.mjs";
import {resizeImage, uploadFile} from "../media/upload";

async function send(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: body ? {"Content-Type": "application/json"} : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const shortDate = iso =>
  iso ? new Date(iso).toLocaleDateString(undefined, {month: "short", day: "numeric"}) : "";

const BUTTON =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 disabled:opacity-50";
const SECONDARY = `${BUTTON} text-gray-600 ring-gray-200 hover:bg-gray-50`;
const PRIMARY = `${BUTTON} bg-gray-900 text-white ring-gray-900 hover:bg-gray-700`;

export default function TrainersManager() {
  const [trainers, setTrainers] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState(null);
  // null | "new" | a trainer being edited
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setState("loading");
    try {
      const {trainers} = await send("/api/trainers", "GET");
      setTrainers(trainers);
      setState("ready");
    } catch (err) {
      console.error("Could not load trainers", err);
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Update on screen right away; put the old list back if the save fails.
  const patch = async (id, optimistic, body) => {
    const previous = trainers;
    setError(null);
    setTrainers(ts => ts.map(t => (t.id === id ? {...t, ...optimistic} : t)));
    try {
      const {trainer} = await send(`/api/trainers/${id}`, "PATCH", body);
      setTrainers(ts => ts.map(t => (t.id === id ? trainer : t)));
    } catch (err) {
      console.error("Could not update trainer", err);
      setTrainers(previous);
      setError(err.message);
    }
  };

  const {current, past} = splitTrainers(trainers);
  // Founders always lead /meet, so they sit apart and can't be reordered.
  const founders = current.filter(isFounder);
  const team = current.filter(t => !isFounder(t));

  // Renumbers the team (after the founders) and saves the ones that moved.
  const move = async (index, offset) => {
    const order = [...founders, ...team];
    const a = founders.length + index;
    [order[a], order[a + offset]] = [order[a + offset], order[a]];
    const moved = order
      .map((trainer, sortOrder) => ({trainer, sortOrder}))
      .filter(({trainer, sortOrder}) => trainer.sortOrder !== sortOrder);
    const previous = trainers;
    setError(null);
    setTrainers(ts =>
      ts.map(t => {
        const i = order.findIndex(o => o.id === t.id);
        return i === -1 ? t : {...t, sortOrder: i};
      }),
    );
    try {
      await Promise.all(
        moved.map(({trainer, sortOrder}) =>
          send(`/api/trainers/${trainer.id}`, "PATCH", {sortOrder}),
        ),
      );
    } catch (err) {
      console.error("Could not reorder trainers", err);
      setTrainers(previous);
      setError(err.message);
      load();
    }
  };

  const remove = trainer => {
    if (
      !window.confirm(
        `Remove ${trainer.name} from the site? You can re-add them anytime from Past trainers.`,
      )
    ) {
      return;
    }
    patch(trainer.id, {active: false, removedAt: new Date().toISOString()}, {active: false});
  };

  const readd = trainer =>
    patch(
      trainer.id,
      {active: true, removedAt: null, sortOrder: current.length},
      {active: true},
    );

  const destroy = async trainer => {
    if (!window.confirm(`Delete ${trainer.name} forever? This can't be undone.`)) return;
    const previous = trainers;
    setError(null);
    setTrainers(ts => ts.filter(t => t.id !== trainer.id));
    try {
      await send(`/api/trainers/${trainer.id}`, "DELETE");
    } catch (err) {
      console.error("Could not delete trainer", err);
      setTrainers(previous);
      setError(err.message);
    }
  };

  const saved = trainer => {
    setTrainers(ts =>
      ts.some(t => t.id === trainer.id)
        ? ts.map(t => (t.id === trainer.id ? trainer : t))
        : [...ts, trainer],
    );
    setEditing(null);
  };

  return (
    <section aria-labelledby="trainers-heading" className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={load}
          disabled={state === "loading"}
          className={SECONDARY}
        >
          <FaRotateRight
            aria-hidden="true"
            className={`size-3 ${state === "loading" ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
        {!editing && (
          <button type="button" onClick={() => setEditing("new")} className={PRIMARY}>
            <FaPlus aria-hidden="true" className="size-3" />
            Add trainer
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t save: {error}
        </p>
      )}

      {editing && (
        <TrainerForm
          key={editing === "new" ? "new" : editing.id}
          trainer={editing === "new" ? null : editing}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}

      {state === "loading" && trainers.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">Loading trainers…</p>
      )}
      {state === "error" && (
        <p className="py-10 text-center text-sm text-red-600">
          Couldn&rsquo;t load trainers. Try Refresh.
        </p>
      )}
      {founders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Founders</h2>
          <p className="mt-1 text-sm text-gray-500">Always shown first on Meet Us.</p>
          <ul role="list" className={`mt-4 ${GRID}`}>
            {founders.map(trainer => (
              <TrainerCard key={trainer.id} trainer={trainer} onEdit={() => setEditing(trainer)} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 id="trainers-heading" className="text-xl font-bold tracking-tight text-gray-900">
          Trainers
        </h2>
        {state === "ready" && team.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No trainers yet. Add one to show them on Meet Us under Trainers.
          </p>
        )}
        {team.length > 0 && (
          <ul role="list" className={`mt-4 ${GRID}`}>
            {team.map((trainer, index) => (
              <TrainerCard key={trainer.id} trainer={trainer} onEdit={() => setEditing(trainer)}>
                <button type="button" onClick={() => remove(trainer)} className={SECONDARY}>
                  Remove
                </button>
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${trainer.name} up`}
                    className={ROUND}
                  >
                    <FaArrowUp aria-hidden="true" className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === team.length - 1}
                    aria-label={`Move ${trainer.name} down`}
                    className={ROUND}
                  >
                    <FaArrowDown aria-hidden="true" className="size-3" />
                  </button>
                </span>
              </TrainerCard>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500">Past trainers</h2>
          <ul role="list" className="mt-3 divide-y divide-gray-100 rounded-xl bg-gray-50 ring-1 ring-gray-200">
            {past.map(trainer => (
              <li key={trainer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <img
                  src={trainer.photo.url}
                  alt=""
                  className="size-10 rounded-full object-cover opacity-70"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-gray-700">{trainer.name}</p>
                  <p className="text-gray-500">
                    {trainer.position} · Removed {shortDate(trainer.removedAt)}
                  </p>
                </div>
                <button type="button" onClick={() => readd(trainer)} className={SECONDARY}>
                  Re-add
                </button>
                <button
                  type="button"
                  onClick={() => destroy(trainer)}
                  className={`${BUTTON} text-red-600 ring-red-200 hover:bg-red-50`}
                >
                  Delete forever
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
const ROUND =
  "rounded-full p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-30";

// children are extra actions after Edit (Remove and reorder for the team).
function TrainerCard({trainer, onEdit, children}) {
  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <img
        src={trainer.photo.url}
        alt={`Photo of ${trainer.name}`}
        className="aspect-[4/5] w-full object-cover object-top"
      />
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
          <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {trainer.position}
          </span>
        </div>
        {trainer.bio && <p className="text-sm text-gray-600">{trainer.bio}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onEdit} className={SECONDARY}>
            Edit
          </button>
          {children}
        </div>
      </div>
    </li>
  );
}

const INPUT =
  "mt-1 block w-full rounded-lg px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none";
const LABEL = "block text-sm font-medium text-gray-700";

// Add (trainer = null) or edit. The photo uploads on save, not on pick.
function TrainerForm({trainer, onSaved, onCancel}) {
  const [fields, setFields] = useState({
    name: trainer?.name ?? "",
    position: trainer?.position ?? "",
    bio: trainer?.bio ?? "",
    email: trainer?.email ?? "",
    phone: trainer?.phone ? formatUSPhone(trainer.phone) : "",
  });
  // {blob, preview} for a newly picked photo
  const [photo, setPhoto] = useState(null);
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  const set = key => e => setFields(f => ({...f, [key]: e.target.value}));

  const pickPhoto = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (mediaKind(file.type) !== "image") {
      return setError("Trainer photos must be JPEG, PNG or WebP.");
    }
    try {
      const blob = await resizeImage(file);
      const check = checkUpload({purpose: "trainer", contentType: blob.type, size: blob.size});
      if (!check.ok) return setError(check.error);
      setPhoto({blob, preview: URL.createObjectURL(blob)});
    } catch (err) {
      console.error("Could not read photo", err);
      setError("Couldn't read that photo. Try another one.");
    }
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {...fields};
      // Co-Founder titles are fixed; the API rejects position changes for them.
      if (founder) delete body.position;
      if (photo) {
        setProgress(0);
        const {path} = await uploadFile(photo.blob, {purpose: "trainer", onProgress: setProgress});
        body.photoPath = path;
      }
      const {trainer: result} = trainer
        ? await send(`/api/trainers/${trainer.id}`, "PATCH", body)
        : await send("/api/trainers", "POST", body);
      onSaved(result);
    } catch (err) {
      console.error("Could not save trainer", err);
      setError(err.message);
      setSaving(false);
      setProgress(null);
    }
  };

  const founder = isFounder(trainer);
  const preview = photo?.preview ?? trainer?.photo.url;
  const canSave = fields.name.trim() && fields.position && preview && !saving;

  return (
    <form
      onSubmit={save}
      className="space-y-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {trainer ? `Edit ${trainer.name}` : "Add trainer"}
      </h3>

      <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <div>
          <span className={LABEL}>Photo</span>
          <label className="mt-1 flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-sm text-gray-500 ring-1 ring-dashed ring-gray-300 hover:bg-gray-100">
            {preview ? (
              <img src={preview} alt="Selected photo" className="size-full object-cover object-top" />
            ) : (
              "Choose a photo"
            )}
            <input
              type="file"
              accept={ACCEPT.trainer}
              onChange={pickPhoto}
              className="sr-only"
            />
          </label>
          {preview && <p className="mt-1 text-xs text-gray-500">Tap the photo to change it.</p>}
          {progress !== null && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-gray-900 transition-[width]"
                style={{width: `${Math.round(progress * 100)}%`}}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="trainer-name" className={LABEL}>
              Name
            </label>
            <input
              id="trainer-name"
              value={fields.name}
              onChange={set("name")}
              maxLength={NAME_MAX}
              required
              className={INPUT}
            />
          </div>
          {founder ? (
            <div>
              <span className={LABEL}>Position</span>
              <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                {trainer.position}{" "}
                <span className="text-gray-500">(founder title, can&rsquo;t be changed)</span>
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="trainer-position" className={LABEL}>
                Position
              </label>
              <select
                id="trainer-position"
                value={fields.position}
                onChange={set("position")}
                required
                className={INPUT}
              >
                <option value="" disabled>
                  Pick a position
                </option>
                {TRAINER_POSITIONS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="trainer-bio" className={LABEL}>
                Bio
              </label>
              <span className="text-xs text-gray-500">
                {fields.bio.length} / {BIO_MAX}
              </span>
            </div>
            <textarea
              id="trainer-bio"
              value={fields.bio}
              onChange={set("bio")}
              maxLength={BIO_MAX}
              rows={5}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Contact (optional)</legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="trainer-email" className={LABEL}>
              Email
            </label>
            <input
              id="trainer-email"
              type="email"
              value={fields.email}
              onChange={set("email")}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="trainer-phone" className={LABEL}>
              Phone
            </label>
            <input
              id="trainer-phone"
              type="tel"
              value={fields.phone}
              onChange={set("phone")}
              className={INPUT}
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className={SECONDARY}>
          Cancel
        </button>
        <button type="submit" disabled={!canSave} className={PRIMARY}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
